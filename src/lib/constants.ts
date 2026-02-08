import { SimulationParams } from '@/types';

// Carreau非ニュートンモデル基本パラメータ (Cho & Kensey, 1991)
export const CARREAU = {
  mu_inf: 0.00345,  // Pa·s 無限せん断粘度
  mu_0: 0.056,      // Pa·s ゼロせん断粘度
  lambda: 3.313,    // s 緩和時間
  n: 0.3568,        // べき乗指数
} as const;

// Hct依存粘度テーブル (線形補間用)
export const HCT_VISCOSITY_TABLE = [
  { hct: 20, mu_inf: 0.00220, mu_0: 0.025 },
  { hct: 25, mu_inf: 0.00260, mu_0: 0.032 },
  { hct: 30, mu_inf: 0.00280, mu_0: 0.037 },
  { hct: 35, mu_inf: 0.00300, mu_0: 0.042 },
  { hct: 40, mu_inf: 0.00320, mu_0: 0.048 },
  { hct: 45, mu_inf: 0.00345, mu_0: 0.056 },
  { hct: 50, mu_inf: 0.00400, mu_0: 0.065 },
  { hct: 55, mu_inf: 0.00450, mu_0: 0.075 },
] as const;

export const BLOOD_DENSITY = 1060; // kg/m³

// 吻合部WSS補正係数の範囲 (CFD文献ベース)
export const WSS_CORRECTION = {
  outerWall: { base: 2.0, angleCoeff: 1.5 },
  innerFloor: { base: 0.15, angleCoeff: -0.3 },
  toe: { base: 1.8, angleCoeff: 1.0 },
  heel: { base: 1.2, angleCoeff: 0.5 },
} as const;

// 成熟判定基準 (KDOQI 2019 + Rule of 6s)
export const MATURATION_CRITERIA = {
  veinDiameter: { threshold: 2.5, maxScore: 20, unit: 'mm' },
  arteryDiameter: { threshold: 2.0, maxScore: 15, unit: 'mm' },
  flowRate: { threshold: 500, maxScore: 20, unit: 'mL/min' },
  tawss: { threshold: 1.0, maxScore: 15, unit: 'Pa' },
  osi: { threshold: 0.15, maxScore: 10, unit: '' },
  angle: { optMin: 30, optMax: 60, maxScore: 10, unit: '度' },
  hct: { min: 30, max: 45, maxScore: 10, unit: '%' },
} as const;

// Canvas描画定数
export const CANVAS = {
  width: 800,
  height: 500,
  padding: 50,
  vesselScale: 28,      // mm → px変換係数
  arrowSpacing: 25,     // ベクトル矢印間隔(px)
  arrowScale: 40,       // 速度→矢印長さスケール
} as const;

// デフォルトパラメータ
export const DEFAULT_PARAMS: SimulationParams = {
  arteryDiameter: 4.0,
  veinDiameter: 4.0,
  anastomosisAngle: 45,
  baseFlowRate: 600,
  bloodFlowRate: 600,
  hematocrit: 0.40,  // 0-1 ratio
  heartRate: 75,
  bloodPressure: 90,
  systolicRatio: 0.35,
};

// Jet カラーマップ (CFD標準)
export function jetColormap(t: number): [number, number, number] {
  // t: 0-1 → [R,G,B] 0-255
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  let r: number, g: number, b: number;

  if (t < 0.125) {
    r = 0; g = 0; b = clamp(128 + t * 1024);
  } else if (t < 0.375) {
    r = 0; g = clamp((t - 0.125) * 1024); b = 255;
  } else if (t < 0.625) {
    r = clamp((t - 0.375) * 1024); g = 255; b = clamp(255 - (t - 0.375) * 1024);
  } else if (t < 0.875) {
    r = 255; g = clamp(255 - (t - 0.625) * 1024); b = 0;
  } else {
    r = clamp(255 - (t - 0.875) * 1024); g = 0; b = 0;
  }

  return [Math.round(r), Math.round(g), Math.round(b)];
}

// 発散型カラーマップ (OSI用: 青→白→赤)
export function divergingColormap(t: number): [number, number, number] {
  // t: 0-1, 中央(0.5)が白
  if (t < 0.5) {
    const s = t * 2;
    return [
      Math.round(59 + s * 196),
      Math.round(76 + s * 179),
      Math.round(192 + s * 63),
    ];
  } else {
    const s = (t - 0.5) * 2;
    return [
      Math.round(255),
      Math.round(255 - s * 200),
      Math.round(255 - s * 220),
    ];
  }
}
