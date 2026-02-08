'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimulationParams, HemodynamicMetrics, VesselGeometry, WallPoint, WSSData } from '@/types';
import { DEFAULT_PARAMS } from '@/lib/constants';
import { generateGeometry } from '@/lib/simulation/geometry';
import { calculateHemodynamics } from '@/lib/simulation/wss-calculator';
import { predictMaturation, predictTimeline } from '@/lib/simulation/prediction';

import ParameterControls from './ParameterControls';
import VesselCanvas from './VesselCanvas';
import MetricsPanel from './MetricsPanel';
import PredictionPanel from './PredictionPanel';
import TimelineChart from './TimelineChart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SimulatorPanel() {
    const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
    const [displayMode, setDisplayMode] = useState<'wss' | 'osi' | 'velocity'>('wss');
    const [geometry, setGeometry] = useState<VesselGeometry | null>(null);
    const [metrics, setMetrics] = useState<HemodynamicMetrics | null>(null);
    const [wallWSS, setWallWSS] = useState<{ point: WallPoint; data: WSSData }[]>([]);

    // シミュレーション実行
    useEffect(() => {
        // ジオメトリ生成
        const geo = generateGeometry(
            params.arteryDiameter,
            params.veinDiameter,
            params.anastomosisAngle
        );

        // 血行動態計算
        const result = calculateHemodynamics(params);

        setGeometry(geo);
        setMetrics(result.metrics);
        setWallWSS(result.wallWSS);
    }, [params]);

    const prediction = metrics ? predictMaturation(params, metrics) : null;
    const timeline = prediction ? predictTimeline(prediction) : [];

    return (
        <div className="h-screen overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col">
            {/* ヘッダー - Compact */}
            <header className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                        AVF Pre-op Simulator (AVFシャント術前シミュレータ)
                    </h1>
                    <p className="text-xs text-zinc-400">
                        Arteriovenous Fistula Hemodynamics Simulation
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/references">
                        <Button variant="outline" size="sm" className="gap-2 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100">
                            <BookOpen className="w-4 h-4" />
                            References (参考文献)
                        </Button>
                    </Link>
                </div>
            </header>

            {/* メインコンテンツ - Grid Fixed Height */}
            <div className="flex-1 overflow-hidden p-4 grid grid-cols-12 gap-4">
                {/* 左パネル: パラメータ制御 (3/12 columns) */}
                <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pr-2">
                    <ParameterControls params={params} onChange={setParams} />
                    {prediction && (
                        <PredictionPanel prediction={prediction} />
                    )}
                </div>

                {/* 中央・右パネル: 可視化とメトリクス (9/12 columns) */}
                <div className="col-span-9 flex flex-col gap-4 h-full overflow-hidden">

                    {/* 上段: キャンバスとタイムライン (Flex row) */}
                    <div className="flex-1 min-h-0 flex gap-4">
                        {/* キャンバスエリア */}
                        <div className="flex-[3] relative bg-black rounded-lg border border-zinc-800 flex flex-col min-h-0">
                            <div className="absolute top-2 left-2 z-10">
                                <Tabs value={displayMode} onValueChange={(v) => setDisplayMode(v as 'wss' | 'osi' | 'velocity')}>
                                    <TabsList className="bg-zinc-900/80 backdrop-blur border border-zinc-700 h-8">
                                        <TabsTrigger value="wss" className="text-xs px-2 h-6">WSS</TabsTrigger>
                                        <TabsTrigger value="osi" className="text-xs px-2 h-6">OSI</TabsTrigger>
                                        <TabsTrigger value="velocity" className="text-xs px-2 h-6">流速</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            <div className="flex-1 w-full h-full min-h-0">
                                {geometry && metrics && (
                                    <VesselCanvas
                                        params={params}
                                        metrics={metrics}
                                        geometry={geometry}
                                        wallWSS={wallWSS}
                                        displayMode={displayMode}
                                    />
                                )}
                            </div>
                        </div>

                        {/* タイムラインチャート (右側配置、幅狭め) */}
                        <div className="flex-[1.5] bg-zinc-900 rounded-lg border border-zinc-800 p-3 min-h-0 overflow-hidden flex flex-col">
                            <h3 className="text-sm font-medium text-zinc-400 mb-2 shrink-0">成熟予測推移</h3>
                            <div className="flex-1 min-h-0 relative">
                                {timeline.length > 0 && <TimelineChart timeline={timeline} />}
                            </div>
                        </div>
                    </div>

                    {/* 下段: メトリクスパネル (Compact) */}
                    <div className="shrink-0 h-auto">
                        {metrics && <MetricsPanel metrics={metrics} />}
                    </div>
                </div>
            </div>
        </div>
    );
}
