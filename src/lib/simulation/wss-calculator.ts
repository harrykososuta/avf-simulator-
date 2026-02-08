import {
  SimulationParams,
  HemodynamicResult,
  HemodynamicMetrics,
  WSSData,
  RegionType,
} from '@/types';
import { calculateBloodProperties, wallShearRate, carreauViscosity } from './blood-properties';
import { generateGeometry } from './geometry';
import { calculateFlowSplit, generatePulsatileWaveform, calculateVelocityField } from './flow-solver';

/**
 * 領域別WSS補正係数
 * CFD文献ベースの経験的補正
 */
function getRegionCorrectionFactor(
  region: RegionType,
  angleRad: number,
  diameterRatio: number // vein/artery
): number {
  switch (region) {
    case 'proximal_artery':
      return 1.0;
    case 'distal_artery':
      return 0.85; // 流量減少による低下
    case 'anastomosis_outer':
      // 外壁: 高WSS (流れの衝突)
      return 1.0 + 2.0 * Math.sin(angleRad) * Math.sqrt(diameterRatio);
    case 'anastomosis_toe':
      // Toe: 高WSS
      return 1.0 + 1.5 * Math.cos(angleRad / 2);
    case 'anastomosis_heel':
      // Heel: 中程度
      return 1.0 + 0.5 * Math.sin(angleRad);
    case 'anastomosis_floor':
      // Floor: 低WSS (再循環帯)
      return 0.15 * (1 - 0.5 * Math.sin(angleRad / 2)) / Math.pow(diameterRatio, 0.3);
    case 'vein_outer':
      // 静脈外壁: やや高WSS
      return 1.1 + 0.3 * Math.sin(angleRad);
    case 'vein_inner':
      // 静脈内壁: やや低WSS
      return 0.7;
    default:
      return 1.0;
  }
}

/**
 * OSI計算
 * OSI = 0.5 × (1 - |∫τ dt| / ∫|τ| dt)
 */
function calculateOSI(
  wssTimeSeries: number[],
  region: RegionType,
  angleRad: number
): number {
  // 各タイムステップでのWSS方向を考慮
  // 再循環帯では周期的に方向反転
  const isRecirculation =
    region === 'anastomosis_floor' ||
    (region === 'vein_inner' && angleRad > Math.PI / 6);

  if (!isRecirculation) {
    // 一方向流: 低OSI
    // 脈動による微小変動のみ
    const mean = wssTimeSeries.reduce((a, b) => a + b) / wssTimeSeries.length;
    const variance = wssTimeSeries.reduce((a, b) => a + (b - mean) ** 2, 0) / wssTimeSeries.length;
    const cv = Math.sqrt(variance) / (mean + 1e-10);
    return Math.min(0.05 + cv * 0.1, 0.15);
  }

  // 再循環帯: WSS方向が変わる
  // 方向反転の程度は角度と流速に依存
  const reversalFraction = 0.3 + 0.4 * Math.sin(angleRad);

  // 実効的なOSI計算
  let sumAbs = 0;
  let sumSigned = 0;
  wssTimeSeries.forEach((wss, i) => {
    const phase = (i / wssTimeSeries.length) * 2 * Math.PI;
    // 拡張期に方向反転が起きやすい
    const directionFactor = Math.sin(phase) > 0.3 ? 1 : -reversalFraction;
    sumAbs += Math.abs(wss);
    sumSigned += wss * directionFactor;
  });

  const osi = 0.5 * (1 - Math.abs(sumSigned) / (sumAbs + 1e-10));
  return Math.min(Math.max(osi, 0), 0.5);
}

/**
 * RRT計算
 * RRT = 1 / ((1 - 2×OSI) × TAWSS)
 */
function calculateRRT(tawss: number, osi: number): number {
  const denominator = (1 - 2 * osi) * tawss;
  if (denominator < 0.01) return 100; // 上限クランプ
  return 1 / denominator;
}

/**
 * 全血行動態計算のオーケストレーション
 */
export function calculateHemodynamics(params: SimulationParams): HemodynamicResult {
  // 1. ジオメトリ生成
  const geometry = generateGeometry(
    params.arteryDiameter,
    params.veinDiameter,
    params.anastomosisAngle
  );

  // 2. 血液物性計算
  const bloodProps = calculateBloodProperties(
    params.bloodFlowRate,
    params.arteryDiameter,
    params.hematocrit
  );

  // 3. 流量分配
  const flowSplit = calculateFlowSplit(params);

  // 4. 脈動波形生成
  const waveform = generatePulsatileWaveform(params.heartRate, params.systolicRatio, 20);

  // 5. 各領域の基準WSS計算
  const angleRad = (params.anastomosisAngle * Math.PI) / 180;
  const diameterRatio = params.veinDiameter / params.arteryDiameter;

  // 動脈の基準WSS (Poiseuille)
  const arteryFlow_m3s = params.bloodFlowRate / (1e6 * 60);
  const arteryRadius_m = (params.arteryDiameter / 2) * 1e-3;
  const arteryShearRate = wallShearRate(arteryFlow_m3s, arteryRadius_m);
  const arteryViscosity = carreauViscosity(arteryShearRate, params.hematocrit);
  const baseWSS_artery = arteryViscosity * arteryShearRate;

  // 静脈の基準WSS
  const veinFlow_m3s = flowSplit.veinFlowRate / (1e6 * 60);
  const veinRadius_m = (params.veinDiameter / 2) * 1e-3;
  const veinShearRate = wallShearRate(veinFlow_m3s, veinRadius_m);
  const veinViscosity = carreauViscosity(veinShearRate, params.hematocrit);
  const baseWSS_vein = veinViscosity * veinShearRate;

  // 6. 各壁面ポイントでWSS/OSI/RRT計算
  const wallWSS = geometry.wallPoints.map((wp) => {
    // 基準WSSの選択
    const isVein = wp.regionType.startsWith('vein');
    const baseWSS = isVein ? baseWSS_vein : baseWSS_artery;

    // 領域補正係数
    const correction = getRegionCorrectionFactor(wp.regionType, angleRad, diameterRatio);

    // 壁面位置に沿った変動（空間的な滑らかさ）
    const spatialVariation = 1 + 0.1 * Math.sin(wp.paramPosition * Math.PI * 4);

    // 時系列WSS生成
    const wssTimeSeries = waveform.map((w) => baseWSS * correction * spatialVariation * w);

    // TAWSS
    const tawss = wssTimeSeries.reduce((a, b) => a + Math.abs(b), 0) / wssTimeSeries.length;

    // OSI
    const osi = calculateOSI(wssTimeSeries, wp.regionType, angleRad);

    // RRT
    const rrt = calculateRRT(tawss, osi);

    return {
      point: wp,
      data: { tawss, osi, rrt } as WSSData,
    };
  });

  // 7. 速度場計算
  const velocityField = calculateVelocityField(params, geometry, flowSplit);

  // 8. メトリクス集計
  const tawssValues = wallWSS.map((w) => w.data.tawss);
  const osiValues = wallWSS.map((w) => w.data.osi);
  const rrtValues = wallWSS.map((w) => w.data.rrt);

  // Reynolds Number: Re = (rho * v * D) / mu
  // Using artery diameter and mean velocity
  // Q = flow rate (ml/min) -> m^3/s: Q * 1e-6 / 60
  // A = pi * r^2 (m^2): r = diameter/2 (mm) * 1e-3
  // D = diameter (m): diameter * 1e-3
  // mu = viscosity (Pa·s)
  // rho = density (kg/m^3)

  // Note: reynoldsNumber is already available in 'bloodProps', but let's calculate it specifically for the artery flow
  // to ensure it matches the current parameters if they changed.
  // Actually, to be consistent with blood-properties.ts usage:
  // bloodProps.reynoldsNumber might be based on default shear rate.
  // Let's use the one from bloodProps for now as a baseline, or consistent with viscosity.

  // Dean Number: De = Re * sqrt(D / 2R_curve)
  // Assuming a curvature radius for the vein (approximate from geometry)
  const curvatureRadius = params.veinDiameter * 3; // Approximation
  const deanNumber = bloodProps.reynoldsNumber * Math.sqrt(params.veinDiameter / (2 * curvatureRadius));

  // WSS Gradient (approximate as max spatial difference over diameter)
  // Simple approximation from TAWSS variation
  const maxTAWSS = Math.max(...tawssValues);
  const minTAWSS = Math.min(...tawssValues);
  const wssGradient = (maxTAWSS - minTAWSS) / (params.arteryDiameter / 1000); // Pa/m

  const metrics: HemodynamicMetrics = {
    meanTAWSS: tawssValues.reduce((a, b) => a + b) / tawssValues.length,
    maxTAWSS: maxTAWSS,
    minTAWSS: minTAWSS,
    meanOSI: osiValues.reduce((a, b) => a + b) / osiValues.length,
    maxOSI: Math.max(...osiValues),
    meanRRT: rrtValues.reduce((a, b) => a + b) / rrtValues.length,
    maxRRT: Math.min(Math.max(...rrtValues), 100),

    // Detailed Analysis
    reynoldsNumber: bloodProps.reynoldsNumber,
    deanNumber: deanNumber,
    wssGradient: wssGradient,
    effectiveViscosity: bloodProps.viscosity,

    // Simplified
    tawss: tawssValues.reduce((a, b) => a + b) / tawssValues.length,
    osi: osiValues.reduce((a, b) => a + b) / osiValues.length,
    rrt: rrtValues.reduce((a, b) => a + b) / rrtValues.length,
    totalFlowRate: params.baseFlowRate || params.bloodFlowRate,
  };

  return {
    wallWSS,
    velocityField,
    metrics,
    flowSplit,
  };
}
