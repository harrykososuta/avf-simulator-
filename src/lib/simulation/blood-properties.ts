import { BloodProperties } from '@/types';
import { CARREAU, HCT_VISCOSITY_TABLE, BLOOD_DENSITY } from '../constants';

/**
 * Hct依存のCarreauパラメータを線形補間で取得
 */
function interpolateHctParams(hct: number): { mu_inf: number; mu_0: number } {
  const table = HCT_VISCOSITY_TABLE;

  if (hct <= table[0].hct) {
    return { mu_inf: table[0].mu_inf, mu_0: table[0].mu_0 };
  }
  if (hct >= table[table.length - 1].hct) {
    return { mu_inf: table[table.length - 1].mu_inf, mu_0: table[table.length - 1].mu_0 };
  }

  for (let i = 0; i < table.length - 1; i++) {
    if (hct >= table[i].hct && hct <= table[i + 1].hct) {
      const frac = (hct - table[i].hct) / (table[i + 1].hct - table[i].hct);
      return {
        mu_inf: table[i].mu_inf + frac * (table[i + 1].mu_inf - table[i].mu_inf),
        mu_0: table[i].mu_0 + frac * (table[i + 1].mu_0 - table[i].mu_0),
      };
    }
  }

  return { mu_inf: CARREAU.mu_inf, mu_0: CARREAU.mu_0 };
}

/**
 * Carreauモデルによる粘度計算
 * μ(γ̇) = μ∞ + (μ₀ - μ∞)(1 + (λγ̇)²)^((n-1)/2)
 */
export function carreauViscosity(shearRate: number, hct: number): number {
  const { mu_inf, mu_0 } = interpolateHctParams(hct);
  const { lambda, n } = CARREAU;

  const gammaDotClamped = Math.max(shearRate, 0.1); // 数値安定性
  const term = 1 + Math.pow(lambda * gammaDotClamped, 2);
  return mu_inf + (mu_0 - mu_inf) * Math.pow(term, (n - 1) / 2);
}

/**
 * Poiseuille流の壁面せん断速度
 * γ̇_w = 4Q / (πr³) (ニュートン流体)
 * 非ニュートン補正: γ̇_w = ((3n+1)/4n) × 4Q/(πr³)
 */
export function wallShearRate(flowRate_m3s: number, radius_m: number): number {
  const { n } = CARREAU;
  const newtonianShearRate = (4 * flowRate_m3s) / (Math.PI * Math.pow(radius_m, 3));
  const correction = (3 * n + 1) / (4 * n); // Rabinowitsch補正
  return correction * newtonianShearRate;
}

/**
 * 平均流速
 */
export function meanVelocity(flowRate_m3s: number, radius_m: number): number {
  return flowRate_m3s / (Math.PI * radius_m * radius_m);
}

/**
 * レイノルズ数
 */
export function reynoldsNumber(
  velocity: number,
  diameter_m: number,
  viscosity: number
): number {
  return (BLOOD_DENSITY * velocity * diameter_m) / viscosity;
}

/**
 * 自己整合的な血液物性計算
 * 粘度がせん断速度に依存し、せん断速度が粘度に依存するため反復計算
 */
export function calculateBloodProperties(
  flowRate_mLmin: number,
  diameter_mm: number,
  hct: number
): BloodProperties {
  const flowRate_m3s = flowRate_mLmin / (1e6 * 60); // mL/min → m³/s
  const radius_m = (diameter_mm / 2) * 1e-3;        // mm → m
  const diameter_m = diameter_mm * 1e-3;

  // 反復計算 (3回で十分収束)
  let viscosity: number = CARREAU.mu_inf; // 初期推定
  let shearRate = 0;

  for (let i = 0; i < 5; i++) {
    shearRate = wallShearRate(flowRate_m3s, radius_m);
    viscosity = carreauViscosity(shearRate, hct);
  }

  const velocity = meanVelocity(flowRate_m3s, radius_m);
  const re = reynoldsNumber(velocity, diameter_m, viscosity);

  return {
    viscosity,
    density: BLOOD_DENSITY,
    reynoldsNumber: re,
    shearRate,
  };
}
