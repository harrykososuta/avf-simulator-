import { SimulationParams, FlowSplit, VelocityVector, VesselGeometry } from '@/types';
import { meanVelocity } from './blood-properties';

/**
 * 流量分配計算 (並列抵抗モデル)
 * Hagen-Poiseuille: R = 8μL / (πr⁴)
 */
export function calculateFlowSplit(params: SimulationParams): FlowSplit {
  const arteryRadius = params.arteryDiameter / 2;  // mm
  const veinRadius = params.veinDiameter / 2;       // mm
  const angleRad = (params.anastomosisAngle * Math.PI) / 180;

  // 仮想的な管路長 (相対値で十分)
  const veinLength = 100;    // mm (仮定)
  const distalLength = 80;   // mm (仮定)

  // 抵抗 ∝ L / r⁴
  const R_vein = veinLength / Math.pow(veinRadius, 4);
  const R_distal = distalLength / Math.pow(arteryRadius * 0.8, 4); // 遠位動脈は少し細い

  // 角度補正: 角度が大きいと静脈への流入抵抗増加
  const angleCorrection = 1 + 0.5 * Math.pow(angleRad / (Math.PI / 2), 2);
  const R_vein_effective = R_vein * angleCorrection;

  // 流量分配
  const totalConductance = 1 / R_vein_effective + 1 / R_distal;
  const veinFraction = (1 / R_vein_effective) / totalConductance;

  const veinFlowRate = params.bloodFlowRate * veinFraction;
  const distalFlowRate = params.bloodFlowRate * (1 - veinFraction);

  return {
    veinFlowRate,
    distalFlowRate,
    veinFraction,
  };
}

/**
 * 脈動流波形生成 (Fourier級数近似)
 * 正規化された流量倍率の時系列を返す
 */
export function generatePulsatileWaveform(
  heartRate: number,
  systolicRatio: number,
  numSteps: number = 20
): number[] {
  const waveform: number[] = [];
  const T = 60 / heartRate; // 心周期 (秒)

  for (let i = 0; i < numSteps; i++) {
    const t = (i / numSteps) * T;
    const phase = (2 * Math.PI * t) / T;

    // 収縮期波形: 急峻な立ち上がり + 緩やかな減衰
    const A1 = 0.6 * (systolicRatio / 0.35);
    const A2 = 0.25;
    const A3 = 0.1;

    let q = 1.0
      + A1 * Math.sin(phase)
      + A2 * Math.sin(2 * phase - 0.3)
      + A3 * Math.sin(3 * phase - 0.6);

    // 最低流量を保証
    q = Math.max(q, 0.15);
    waveform.push(q);
  }

  // 平均が1になるように正規化
  const mean = waveform.reduce((a, b) => a + b) / waveform.length;
  return waveform.map((q) => q / mean);
}

/**
 * 速度場計算 (2Dグリッド上)
 */
export function calculateVelocityField(
  params: SimulationParams,
  geometry: VesselGeometry,
  flowSplit: FlowSplit
): VelocityVector[] {
  const vectors: VelocityVector[] = [];
  const spacing = 22; // px

  const arteryRadius_m = (params.arteryDiameter / 2) * 1e-3;
  const veinRadius_m = (params.veinDiameter / 2) * 1e-3;

  const arteryFlow_m3s = params.bloodFlowRate / (1e6 * 60);
  const veinFlow_m3s = flowSplit.veinFlowRate / (1e6 * 60);
  const distalFlow_m3s = flowSplit.distalFlowRate / (1e6 * 60);

  const arteryVel = meanVelocity(arteryFlow_m3s, arteryRadius_m);
  const veinVel = meanVelocity(veinFlow_m3s, veinRadius_m);
  const distalVel = meanVelocity(distalFlow_m3s, arteryRadius_m * 0.8);

  const cx = geometry.anastomosisPoint.x;
  const cy = geometry.anastomosisPoint.y;
  const angleRad = (params.anastomosisAngle * Math.PI) / 180;
  const scale = 28; // CANVAS.vesselScale
  const arteryRadiusPx = (params.arteryDiameter / 2) * scale;
  const veinRadiusPx = (params.veinDiameter / 2) * scale;

  // 動脈領域のベクトル
  for (let x = cx - 150; x <= cx + 150; x += spacing) {
    for (let y = cy - arteryRadiusPx + 5; y <= cy + arteryRadiusPx - 5; y += spacing) {
      const distFromCenter = Math.abs(y - cy) / arteryRadiusPx;
      if (distFromCenter > 0.9) continue;

      // Poiseuille分布: v(r) = v_max * (1 - (r/R)²)
      const parabolic = 1 - distFromCenter * distFromCenter;
      let vx: number, vy: number;

      if (x < cx - arteryRadiusPx * 0.5) {
        // 近位動脈: 右向き
        vx = arteryVel * 2 * parabolic; // v_max = 2 * v_mean
        vy = 0;
      } else if (x > cx + arteryRadiusPx * 1.0) {
        // 遠位動脈
        vx = distalVel * 2 * parabolic;
        vy = 0;
      } else {
        // 吻合部: 流れが上方に曲がる
        const blendFactor = Math.max(0, 1 - (y - cy + arteryRadiusPx) / (2 * arteryRadiusPx));
        vx = arteryVel * parabolic * (1 - blendFactor * 0.5);
        vy = -arteryVel * parabolic * blendFactor * Math.sin(angleRad) * 0.5;
      }

      vectors.push({
        position: { x, y },
        vx, vy,
        magnitude: Math.sqrt(vx * vx + vy * vy),
      });
    }
  }

  // 静脈領域のベクトル
  const veinDirX = Math.cos(Math.PI - angleRad);
  const veinDirY = -Math.sin(angleRad);
  const veinNormX = Math.sin(angleRad);
  const veinNormY = Math.cos(angleRad);

  for (let s = 0.2; s <= 1.0; s += 0.12) {
    const centerX = cx + s * 250 * veinDirX;
    const centerY = cy + s * 250 * veinDirY;

    for (let r = -0.7; r <= 0.7; r += 0.35) {
      const px = centerX + r * veinRadiusPx * veinNormX;
      const py = centerY + r * veinRadiusPx * veinNormY;

      const parabolic = 1 - r * r;
      const vMag = veinVel * 2 * parabolic;

      vectors.push({
        position: { x: px, y: py },
        vx: vMag * veinDirX,
        vy: vMag * veinDirY,
        magnitude: vMag,
      });
    }
  }

  return vectors;
}
