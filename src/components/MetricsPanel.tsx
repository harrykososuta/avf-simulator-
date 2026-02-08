'use client';

import React from 'react';
import { HemodynamicMetrics } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface MetricsPanelProps {
    metrics: HemodynamicMetrics;
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-400" />
                    Hemodynamic Metrics (血行動態指標)
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label={
                        <div className="flex flex-col">
                            <span>Mean WSS</span>
                            <span className="text-[10px] text-zinc-500">平均 WSS</span>
                        </div>
                    }
                    value={metrics.tawss.toFixed(2)}
                    unit="Pa"
                    status={getWSSStatus(metrics.tawss)}
                    description="Wall Shear Stress (壁せん断応力)"
                />
                <MetricCard
                    label={
                        <div className="flex flex-col">
                            <span>Mean OSI</span>
                            <span className="text-[10px] text-zinc-500">平均 OSI</span>
                        </div>
                    }
                    value={metrics.osi.toFixed(3)}
                    unit=""
                    status={getOSIStatus(metrics.osi)}
                    description="Oscillatory Shear Index (振動せん断指数)"
                />
                <MetricCard
                    label={
                        <div className="flex flex-col">
                            <span>Mean RRT</span>
                            <span className="text-[10px] text-zinc-500">平均 RRT</span>
                        </div>
                    }
                    value={metrics.rrt.toFixed(2)}
                    unit="Pa⁻¹"
                    status={getRRTStatus(metrics.rrt)}
                    description="Relative Residence Time (相対滞留時間)"
                />
                <MetricCard
                    label={
                        <div className="flex flex-col">
                            <span>Total Flow</span>
                            <span className="text-[10px] text-zinc-500">総血流量</span>
                        </div>
                    }
                    value={Math.round(metrics.totalFlowRate).toString()}
                    unit="mL/min"
                    status="normal"
                    description="Total Flow Rate (総流量)"
                />

                {/* 詳細解析パラメータ */}
                <MetricCard
                    label={
                        <div className="flex flex-col">
                            <span>Reynolds No. (Re)</span>
                            <span className="text-[10px] text-zinc-500">レイノルズ数</span>
                        </div>
                    }
                    value={Math.round(metrics.reynoldsNumber).toString()}
                    unit=""
                    status={metrics.reynoldsNumber > 2000 ? 'warning' : 'normal'}
                    description="Turbulence Indicator (乱流指標 >2000)"
                />
                <MetricCard
                    label={
                        <div className="flex flex-col">
                            <span>Dean Number (De)</span>
                            <span className="text-[10px] text-zinc-500">ディーン数</span>
                        </div>
                    }
                    value={Math.round(metrics.deanNumber).toString()}
                    unit=""
                    status="normal"
                    description="Secondary Flow Intensity (二次流れ強度)"
                />
                <MetricCard
                    label={
                        <div className="flex flex-col">
                            <span>WSS Gradient</span>
                            <span className="text-[10px] text-zinc-500">WSS勾配</span>
                        </div>
                    }
                    value={metrics.wssGradient.toFixed(1)}
                    unit="Pa/m"
                    status={metrics.wssGradient > 200 ? 'warning' : 'normal'}
                    description="WSS Spatial Gradient (空間勾配)"
                />
                <MetricCard
                    label={
                        <div className="flex flex-col">
                            <span>Eff. Viscosity</span>
                            <span className="text-[10px] text-zinc-500">実効粘度</span>
                        </div>
                    }
                    value={(metrics.effectiveViscosity * 1000).toFixed(1)}
                    unit="mPa·s"
                    status="normal"
                    description="Effective Viscosity (血液粘度)"
                />
            </CardContent>
        </Card>
    );
}

// ... (helper functions remain the same or can be updated)
function MetricCard({
    label,
    value,
    unit,
    status,
    description,
}: {
    label: React.ReactNode;
    value: string;
    unit: string;
    status: 'normal' | 'warning' | 'danger';
    description?: string;
}) {
    const statusColors = {
        normal: 'bg-zinc-800 border-zinc-700',
        warning: 'bg-yellow-900/20 border-yellow-700/50 text-yellow-500',
        danger: 'bg-red-900/20 border-red-700/50 text-red-500',
    };

    return (
        <div className={`p-3 rounded-lg border ${statusColors[status]} space-y-1`}>
            <div className="text-xs text-zinc-400">{label}</div>
            <div className="text-2xl font-bold flex items-end gap-1">
                {value}
                <span className="text-sm font-normal text-zinc-500 mb-1">{unit}</span>
            </div>
            {description && <div className="text-[10px] text-zinc-500 truncate" title={description}>{description}</div>}
        </div>
    );
}

function getWSSStatus(wss: number): 'normal' | 'warning' | 'danger' {
    if (wss < 0.5 || wss > 10) return 'danger';
    if (wss < 0.7 || wss > 3) return 'warning';
    return 'normal';
}

function getOSIStatus(osi: number): 'normal' | 'warning' | 'danger' {
    if (osi > 0.3) return 'danger';
    if (osi > 0.2) return 'warning';
    return 'normal';
}

function getRRTStatus(rrt: number): 'normal' | 'warning' | 'danger' {
    if (rrt > 10) return 'danger';
    if (rrt > 5) return 'warning';
    return 'normal';
}

/**
 * 血流量評価
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getFlowStatus(flow: number): 'good' | 'warning' | 'danger' {
    if (flow >= 500) return 'good';
    if (flow >= 400) return 'warning';
    return 'danger';
}
