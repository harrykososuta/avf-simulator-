/**
 * AVF成熟予測モジュール
 * スコアリングシステム + ロジスティック回帰で成熟確率を計算
 */

import { SimulationParams, HemodynamicMetrics } from '@/types';

export interface MaturationPrediction {
  probability: number;  // 成熟確率 (0-1)
  score: number;        // 総合スコア
  factors: {
    veinDiameter: number;
    arteryDiameter: number;
    flowRate: number;
    tawss: number;
    osi: number;
    anastomosisAngle: number;
    hematocrit: number;
  };
  riskFactors: string[];
}

/**
 * 成熟予測スコアリング
 */
export function predictMaturation(
  params: SimulationParams,
  metrics: HemodynamicMetrics
): MaturationPrediction {
  const factors = {
    veinDiameter: scoreVeinDiameter(params.veinDiameter),
    arteryDiameter: scoreArteryDiameter(params.arteryDiameter),
    flowRate: scoreFlowRate(metrics.totalFlowRate),
    tawss: scoreTAWSS(metrics.tawss),
    osi: scoreOSI(metrics.osi),
    anastomosisAngle: scoreAnastomosisAngle(params.anastomosisAngle),
    hematocrit: scoreHematocrit(params.hematocrit),
  };

  const score = Object.values(factors).reduce((sum, s) => sum + s, 0);
  const probability = logisticFunction(score);
  const riskFactors = identifyRiskFactors(params, metrics);

  return {
    probability,
    score,
    factors,
    riskFactors,
  };
}

/**
 * 静脈径スコア (最大20点)
 */
function scoreVeinDiameter(diameter: number): number {
  if (diameter >= 2.5) return 20;
  if (diameter >= 2.0) return 15;
  if (diameter >= 1.5) return 10;
  return 0;
}

/**
 * 動脈径スコア (最大15点)
 */
function scoreArteryDiameter(diameter: number): number {
  if (diameter >= 2.0) return 15;
  if (diameter >= 1.5) return 10;
  return 5;
}

/**
 * 流量スコア (最大20点)
 */
function scoreFlowRate(flowRate: number): number {
  if (flowRate >= 500) return 20;
  if (flowRate >= 400) return 15;
  if (flowRate >= 300) return 10;
  return 5;
}

/**
 * TAWSSスコア (最大15点)
 */
function scoreTAWSS(tawss: number): number {
  if (tawss > 1.0 && tawss < 7.0) return 15; // 適正範囲
  if (tawss >= 0.5 && tawss <= 10.0) return 10;
  return 5; // 極端な値は減点
}

/**
 * OSIスコア (最大10点)
 */
function scoreOSI(osi: number): number {
  if (osi < 0.15) return 10;
  if (osi < 0.25) return 5;
  return 0;
}

/**
 * 吻合角度スコア (最大10点)
 */
function scoreAnastomosisAngle(angle: number): number {
  if (angle >= 30 && angle <= 60) return 10; // 最適角度
  if (angle >= 20 && angle <= 70) return 7;
  return 3;
}

/**
 * ヘマトクリットスコア (最大10点)
 */
function scoreHematocrit(hct: number): number {
  if (hct >= 0.35 && hct <= 0.45) return 10; // 正常範囲
  if (hct >= 0.30 && hct <= 0.50) return 7;
  return 3;
}

/**
 * ロジスティック関数でスコアを確率に変換
 * score 50点で50%, 70点で80%, 90点で95%程度
 */
function logisticFunction(score: number): number {
  const k = 0.1;  // 傾き
  const x0 = 50;  // 中点
  return 1 / (1 + Math.exp(-k * (score - x0)));
}

/**
 * リスク因子の特定
 */
function identifyRiskFactors(
  params: SimulationParams,
  metrics: HemodynamicMetrics
): string[] {
  const risks: string[] = [];

  if (params.veinDiameter < 2.0) {
    risks.push('静脈径が小さい (< 2.0mm)');
  }
  if (params.arteryDiameter < 1.5) {
    risks.push('動脈径が小さい (< 1.5mm)');
  }
  if (metrics.totalFlowRate < 400) {
    risks.push('血流量不足 (< 400 mL/min)');
  }
  if (metrics.tawss < 0.5) {
    risks.push('低壁せん断応力 (血栓リスク)');
  }
  if (metrics.tawss > 7.0) {
    risks.push('高壁せん断応力 (内膜損傷リスク)');
  }
  if (metrics.osi > 0.25) {
    risks.push('高OSI (乱流傾向)');
  }
  if (metrics.rrt > 10) {
    risks.push('高RRT (血栓形成リスク)');
  }
  if (params.anastomosisAngle < 30 || params.anastomosisAngle > 70) {
    risks.push('吻合角度が非最適');
  }
  if (params.hematocrit < 0.30) {
    risks.push('貧血傾向');
  }
  if (params.hematocrit > 0.50) {
    risks.push('多血症傾向');
  }

  return risks;
}

/**
 * 時系列予測（簡易モデル）
 * 12週間の成熟過程をシミュレート
 */
export function predictTimeline(
  initialPrediction: MaturationPrediction
): Array<{ week: number; probability: number; flowRate: number }> {
  const timeline = [];
  const baseProb = initialPrediction.probability;
  
  for (let week = 0; week <= 12; week++) {
    // 成熟は指数関数的に進行
    const progress = 1 - Math.exp(-0.3 * week);
    const probability = Math.min(baseProb + (1 - baseProb) * progress * 0.5, 0.95);
    
    // 血流量も時間とともに増加（静脈拡張による）
    const flowIncrease = 1 + progress * 0.4;
    
    timeline.push({
      week,
      probability,
      flowRate: 500 * flowIncrease, // 仮の基準値
    });
  }
  
  return timeline;
}
