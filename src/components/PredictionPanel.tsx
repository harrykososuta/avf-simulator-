'use client';

import React from 'react';
import { MaturationPrediction } from '@/lib/simulation/prediction';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PredictionPanelProps {
    prediction: MaturationPrediction;
}

export default function PredictionPanel({ prediction }: PredictionPanelProps) {
    const probability = (prediction.probability * 100).toFixed(1);
    const status = getPredictionStatus(prediction.probability);

    return (
        <Card className="p-6 space-y-6 bg-zinc-900 border-zinc-800">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-100">Maturation Prediction (成熟予測)</h3>
                {status === 'good' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                {status === 'warning' && <AlertTriangle className="w-6 h-6 text-yellow-500" />}
                {status === 'danger' && <AlertCircle className="w-6 h-6 text-red-500" />}
            </div>

            {/* 成熟確率 */}
            <div className="text-center space-y-2">
                <p className="text-sm text-zinc-400">Probability (成熟確率)</p>
                <div className="text-5xl font-bold" style={{ color: getStatusColor(status) }}>
                    {probability}%
                </div>
                <p className="text-xs text-zinc-500">Score (スコア): {prediction.score.toFixed(0)}/100</p>
            </div>

            {/* プログレスバー */}
            <div className="relative w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className="h-full transition-all duration-500 ease-out"
                    style={{
                        width: `${probability}%`,
                        backgroundColor: getStatusColor(status),
                    }}
                />
            </div>

            {/* リスク因子 */}
            {prediction.riskFactors.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Risk Factors (リスク因子)
                    </h4>
                    <ul className="space-y-1">
                        {prediction.riskFactors.map((risk, index) => (
                            <li key={index} className="text-xs text-zinc-400 flex items-start gap-2">
                                <span className="text-red-400 mt-0.5">•</span>
                                <span>{risk}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* スコア内訳 */}
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-300">Score Breakdown (スコア内訳)</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <ScoreItem label="Vein Dia. (静脈径)" value={prediction.factors.veinDiameter} max={20} />
                    <ScoreItem label="Artery Dia. (動脈径)" value={prediction.factors.arteryDiameter} max={15} />
                    <ScoreItem label="Flow (血流量)" value={prediction.factors.flowRate} max={20} />
                    <ScoreItem label="TAWSS" value={prediction.factors.tawss} max={15} />
                    <ScoreItem label="OSI" value={prediction.factors.osi} max={10} />
                    <ScoreItem label="Angle (角度)" value={prediction.factors.anastomosisAngle} max={10} />
                    <ScoreItem label="Hct" value={prediction.factors.hematocrit} max={10} />
                </div>
            </div>
        </Card>
    );
}

interface ScoreItemProps {
    label: string;
    value: number;
    max: number;
}

function ScoreItem({ label, value, max }: ScoreItemProps) {
    const percentage = (value / max) * 100;
    return (
        <div className="flex items-center justify-between p-2 bg-zinc-800/50 rounded">
            <span className="text-zinc-400">{label}</span>
            <div className="flex items-center gap-1">
                <div className="w-12 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <span className="text-zinc-300 w-8 text-right">{value}/{max}</span>
            </div>
        </div>
    );
}

function getPredictionStatus(probability: number): 'good' | 'warning' | 'danger' {
    if (probability >= 0.7) return 'good';
    if (probability >= 0.5) return 'warning';
    return 'danger';
}

function getStatusColor(status: 'good' | 'warning' | 'danger'): string {
    switch (status) {
        case 'good':
            return '#22c55e';
        case 'warning':
            return '#eab308';
        case 'danger':
            return '#ef4444';
    }
}
