'use client';

import React from 'react';
import { SimulationParams } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ParameterControlsProps {
    params: SimulationParams;
    onChange: (params: SimulationParams) => void;
}

export default function ParameterControls({ params, onChange }: ParameterControlsProps) {
    const updateParam = (key: keyof SimulationParams, value: number) => {
        onChange({ ...params, [key]: value });
    };

    return (
        <div className="space-y-6 p-6 bg-zinc-900 rounded-lg border border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Parameter Settings (パラメータ設定)</h2>

            {/* Artery Diameter */}
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <Label htmlFor="artery-diameter" className="text-sm font-medium text-zinc-300 flex flex-col">
                        <span>Artery Diameter</span>
                        <span className="text-xs text-zinc-500">動脈径</span>
                    </Label>
                    <span className="text-sm text-zinc-400">{params.arteryDiameter.toFixed(1)} mm</span>
                </div>
                <Slider
                    id="artery-diameter"
                    min={1.5}
                    max={5.0}
                    step={0.1}
                    value={[params.arteryDiameter]}
                    onValueChange={([value]) => updateParam('arteryDiameter', value)}
                    className="w-full"
                />
            </div>

            {/* Vein Diameter */}
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <Label htmlFor="vein-diameter" className="text-sm font-medium text-zinc-300 flex flex-col">
                        <span>Vein Diameter</span>
                        <span className="text-xs text-zinc-500">静脈径</span>
                    </Label>
                    <span className="text-sm text-zinc-400">{params.veinDiameter.toFixed(1)} mm</span>
                </div>
                <Slider
                    id="vein-diameter"
                    min={1.0}
                    max={6.0}
                    step={0.1}
                    value={[params.veinDiameter]}
                    onValueChange={([value]) => updateParam('veinDiameter', value)}
                    className="w-full"
                />
            </div>

            {/* Anastomosis Angle */}
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <Label htmlFor="angle" className="text-sm font-medium text-zinc-300 flex flex-col">
                        <span>Anastomosis Angle</span>
                        <span className="text-xs text-zinc-500">吻合角度</span>
                    </Label>
                    <span className="text-sm text-zinc-400">{params.anastomosisAngle.toFixed(0)}°</span>
                </div>
                <Slider
                    id="angle"
                    min={15}
                    max={90}
                    step={5}
                    value={[params.anastomosisAngle]}
                    onValueChange={([value]) => updateParam('anastomosisAngle', value)}
                    className="w-full"
                />
            </div>

            {/* Initial Flow Rate */}
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <Label htmlFor="flow-rate" className="text-sm font-medium text-zinc-300 flex flex-col">
                        <span>Initial Flow Rate</span>
                        <span className="text-xs text-zinc-500">初期血流量</span>
                    </Label>
                    <span className="text-sm text-zinc-400">{params.baseFlowRate.toFixed(0)} mL/min</span>
                </div>
                <Slider
                    id="flow-rate"
                    min={100}
                    max={1000}
                    step={50}
                    value={[params.baseFlowRate]}
                    onValueChange={([value]) => updateParam('baseFlowRate', value)}
                    className="w-full"
                />
            </div>

            {/* Hematocrit */}
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <Label htmlFor="hematocrit" className="text-sm font-medium text-zinc-300 flex flex-col">
                        <span>Hematocrit</span>
                        <span className="text-xs text-zinc-500">ヘマトクリット</span>
                    </Label>
                    <span className="text-sm text-zinc-400">{(params.hematocrit * 100).toFixed(1)}%</span>
                </div>
                <Slider
                    id="hematocrit"
                    min={0.25}
                    max={0.55}
                    step={0.01}
                    value={[params.hematocrit]}
                    onValueChange={([value]) => updateParam('hematocrit', value)}
                    className="w-full"
                />
            </div>

            {/* Heart Rate */}
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <Label htmlFor="heart-rate" className="text-sm font-medium text-zinc-300 flex flex-col">
                        <span>Heart Rate</span>
                        <span className="text-xs text-zinc-500">心拍数</span>
                    </Label>
                    <span className="text-sm text-zinc-400">{params.heartRate.toFixed(0)} bpm</span>
                </div>
                <Slider
                    id="heart-rate"
                    min={50}
                    max={120}
                    step={5}
                    value={[params.heartRate]}
                    onValueChange={([value]) => updateParam('heartRate', value)}
                    className="w-full"
                />
            </div>

            {/* Mean Blood Pressure */}
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <Label htmlFor="blood-pressure" className="text-sm font-medium text-zinc-300 flex flex-col">
                        <span>Mean Blood Pressure</span>
                        <span className="text-xs text-zinc-500">平均血圧</span>
                    </Label>
                    <span className="text-sm text-zinc-400">{params.bloodPressure.toFixed(0)} mmHg</span>
                </div>
                <Slider
                    id="blood-pressure"
                    min={60}
                    max={140}
                    step={5}
                    value={[params.bloodPressure]}
                    onValueChange={([value]) => updateParam('bloodPressure', value)}
                    className="w-full"
                />
            </div>
        </div>
    );
}
