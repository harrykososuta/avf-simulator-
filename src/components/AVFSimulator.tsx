'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  Settings2,
  Zap,
  Thermometer,
  CalendarDays,
  BookOpen
} from 'lucide-react';

/**
 * 臨床文献に基づく定数
 * Rule of 4s (Japan): Flow > 400ml/min, Dia > 4mm
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CLINICAL_CONSTS = {
  SUCCESS_TARGET_WSS: 33.0, // Pa (Northrup et al.)
  MIN_STIMULUS_WSS: 10.0,
  RULE_OF_4_FLOW: 400,      // ml/min
  RULE_OF_4_DIA: 4.0,       // mm
  OPTIMAL_AV_RATIO: 0.8     // Target: <= 0.8
};

type ViewMode = 'wss' | 'osi' | 'rrt';

interface SimParams {
  arteryDia: number;
  veinDia: number;
  angle: number;
  flowRate: number;
  hct: number;
}

interface TimePoint {
  label: string;
  week: number;
  flow: number;
  dia: number;
}

interface Metrics {
  tawss: number;
  osi: number;
  rrt: number;
  avRatio: number;
  prob: number;
  re: number;      // Reynolds Number
  de: number;      // Dean Number
  wssg: number;    // WSS Gradient
  effVisc: number; // Effective Viscosity
  report: string;
  status: 'neutral' | 'good' | 'warning' | 'bad';
  prediction: TimePoint[];
}

const AVFSimulator = () => {
  const [params, setParams] = useState<SimParams>({
    arteryDia: 2.0,
    veinDia: 2.5,
    angle: 45,
    flowRate: 350,
    hct: 35,
  });

  const [viewMode, setViewMode] = useState<ViewMode>('wss');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLCanvasElement>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const [metrics, setMetrics] = useState<Metrics>({
    tawss: 0,
    osi: 0,
    rrt: 0,
    avRatio: 0,
    prob: 0,
    re: 0,
    de: 0,
    wssg: 0,
    effVisc: 0,
    report: "",
    status: "neutral",
    prediction: []
  });

  // --- 物理計算 & 成熟予測 ---
  useEffect(() => {
    const { arteryDia, veinDia, angle, flowRate, hct } = params;

    // 1. A/V 比
    const avRatio = arteryDia / veinDia;

    // 2. TAWSS精密計算 (SI単位系)
    const r_v = (veinDia / 1000) / 2;
    const flow_m3s = flowRate * (1e-6 / 60);
    const area_v = Math.PI * r_v * r_v;
    const velocity_v = flow_m3s / area_v;
    const mu = 0.0035 * Math.pow(1.1, (hct - 35) / 5);

    const geomFactor = (2.0 / arteryDia) * Math.pow(45 / angle, 0.3) * 2.6;
    const tawss = (4 * mu * velocity_v / r_v) * geomFactor;

    const osi = Math.min(0.5, Math.max(0.01, (angle - 25) / 160 + (0.04 / (velocity_v + 0.05))));
    const rrt = 1 / (Math.max(0.01, (1 - 2 * osi) * tawss));

    // 3. 成熟予測 (厳格化版)
    let score = 0;

    // 血管径 (必須条件)
    if (arteryDia >= 2.5) score += 15;
    else if (arteryDia >= 2.0) score += 10;
    else score -= 20; // 2.0mm未満はペナルティ大

    if (veinDia >= 3.0) score += 10;
    else if (veinDia >= 2.5) score += 5;

    // A/V比 (0.8以下が理想)
    if (avRatio <= 0.8) score += 15;
    else score -= 5;

    // TAWSS (Northrup基準: 33Pa付近がベスト)
    if (tawss >= 25 && tawss <= 45) score += 25; // 理想的
    else if (tawss >= 15 && tawss < 25) score += 10; // まずまず
    else if (tawss < 10) score -= 15; // 低すぎる(不全リスク)
    else if (tawss > 60) score -= 10; // 高すぎる(損傷リスク)

    // OSI
    if (osi <= 0.1) score += 10;
    else score -= 5;

    // 吻合角度 (Sadaghianloo基準: 極端な鋭角はリスク)
    if (angle >= 30 && angle <= 50) score += 10; // 推奨域
    else if (angle < 30) score -= 10; // 鋭角すぎる(狭窄リスク)
    else if (angle > 70) score -= 5;  // 鈍角すぎる

    // 確率変換 (シグモイド関数の調整: 中心をずらして厳しくする)
    const prob = 1 / (1 + Math.exp(-(score - 40) / 12)) * 100;

    // 上限キャップ (どんなに良くても98%程度)
    const finalProb = Math.min(98, Math.max(1, prob));

    // 4. 経過予測
    const growthFactor = (finalProb / 100);
    const maxFlow = flowRate * (1 + growthFactor * 3.0); // 成功なら初期の4倍程度まで伸びる
    const maxDia = veinDia * (1 + growthFactor * 1.8);

    const timePoints: TimePoint[] = [
      { label: 'Op', week: 0, flow: flowRate, dia: veinDia },
      { label: '1D', week: 0.14, flow: flowRate * 1.1, dia: veinDia * 1.02 },
      { label: '2W', week: 2, flow: flowRate + (maxFlow - flowRate) * 0.6, dia: veinDia + (maxDia - veinDia) * 0.5 },
      { label: '6W', week: 6, flow: flowRate + (maxFlow - flowRate) * 0.9, dia: veinDia + (maxDia - veinDia) * 0.85 },
      { label: '3M', week: 12, flow: maxFlow * 0.98, dia: maxDia * 0.98 },
      { label: '6M', week: 24, flow: maxFlow, dia: maxDia }
    ];

    // レポート
    let report = "";
    let status: Metrics['status'] = "neutral";

    if (arteryDia < 2.0) {
      report = "動脈径が2.0mm未満です。RCAVFのガイドライン基準を下回っており、成熟不全のリスクが極めて高い状態です。";
      status = "bad";
    } else if (angle < 30) {
      report = "吻合角度が鋭角すぎます(<30°)。Sadaghianlooらの報告では、吻合部狭窄および再介入のリスクが増加します。";
      status = "warning";
    } else if (tawss < 12) {
      report = "予測WSSが低値です。Northrupらの成功群データ(約33Pa)と比較して拡張シグナルが不足しています。";
      status = "bad";
    } else {
      report = `成功確率は${Math.round(finalProb)}%です。適切な角度(30-50°)とWSSが確保されており、順調な成熟が期待されます。`;
      status = finalProb > 70 ? "good" : "warning";
    }

    // --- 追加パラメータ計算 (New) ---
    // Reynolds Number (Re)
    const rho = 1060; // kg/m3 (Blood density)
    const re = (rho * velocity_v * (veinDia / 1000)) / mu;

    // Dean Number (De)
    // Curvature approximation: R ~ D / sin(angle)
    const angleRad = (angle * Math.PI) / 180;
    const curvatureRatio = Math.sin(angleRad) / 4; // Simplified
    const de = re * Math.sqrt(curvatureRatio);

    // WSS Gradient (WSSG)
    // Approx: Impingement WSS decay over distance D
    const wssg = (1.5 * tawss) / (veinDia / 1000);

    // Effective Viscosity (mPa.s)
    const effVisc = mu * 1000;

    setMetrics({ tawss, osi, rrt, avRatio, prob: finalProb, re, de, wssg, effVisc, report, status, prediction: timePoints });

  }, [params, viewMode]);

  // --- Canvas描画 ---
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // コンテナサイズに合わせてCanvasの内部解像度を設定
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const { arteryDia, veinDia, angle } = params;
    const { tawss, osi } = metrics;

    // オリジナル800x380基準でスケーリング
    const sx = w / 800;
    const sy = h / 380;
    const s = Math.min(sx, sy); // 均一スケール

    const scale = 38 * s;
    const centerY = h / 2 + 100 * sy;
    const centerX = w / 2 - 150 * sx;
    const angleRad = (angle * Math.PI) / 180;

    const artH = arteryDia * scale;
    const veinW = veinDia * scale;

    const getMapColor = (val: number, max: number): string => {
      const n = Math.min(1, val / max);
      if (n > 0.8) return '#ef4444';
      if (n > 0.5) return '#f59e0b';
      if (n > 0.2) return '#10b981';
      return '#3b82f6';
    };

    // 1. 動脈
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, centerY - artH / 2, w, artH);

    // ヒートマップ
    const segs = 60;
    for (let i = 0; i < segs; i++) {
      const x = (w / segs) * i;
      let val = tawss * 0.25;
      if (viewMode === 'wss' && Math.abs(x - centerX) < 50 * sx) val = tawss * 1.2;
      if (viewMode === 'osi' && x < centerX && x > centerX - 60 * sx) val = osi * 1.8;

      ctx.globalAlpha = 0.4;
      ctx.fillStyle = getMapColor(val, viewMode === 'wss' ? 40 : 0.3);
      ctx.fillRect(x, centerY - artH / 2, w / segs + 1, artH);
    }
    ctx.globalAlpha = 1.0;

    // 2. 静脈
    const connY = centerY - artH / 2;
    const mouthLen = veinW / Math.sin(angleRad);

    const heelP = { x: centerX - mouthLen / 2, y: connY };
    const toeP = { x: centerX + mouthLen / 2, y: connY };
    const startP = { x: centerX, y: connY };

    const vecX = Math.cos(angleRad);
    const vecY = -Math.sin(angleRad);
    const normX = -vecY;
    const normY = vecX;

    // 高さの動的計算
    const minHeight = 40 * s;
    const maxHeight = 250 * s;
    const currentHeight = minHeight + (maxHeight - minHeight) * ((angle - 20) / 70);

    const endX = centerX + 480 * sx;
    const endY = connY - currentHeight;

    // 描画
    ctx.save();
    const grad = ctx.createLinearGradient(centerX, connY, endX, endY);
    grad.addColorStop(0, getMapColor(tawss, 40));
    grad.addColorStop(0.5, '#1e40af');
    grad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = grad;

    ctx.beginPath();

    // --- 上壁 (Upper Wall) ---
    ctx.moveTo(heelP.x, heelP.y);
    const mergeDist = 25 * s;
    const pMergeLeft = {
      x: startP.x + vecX * mergeDist - normX * (veinW / 2),
      y: startP.y + vecY * mergeDist - normY * (veinW / 2)
    };

    ctx.quadraticCurveTo(
      heelP.x + vecX * (mergeDist * 0.6), heelP.y + vecY * (mergeDist * 0.6),
      pMergeLeft.x, pMergeLeft.y
    );

    const cp1L = { x: pMergeLeft.x + vecX * currentHeight * 0.5, y: pMergeLeft.y + vecY * currentHeight * 0.5 };
    const cp2L = { x: endX - 100 * sx, y: endY - veinW / 2 };
    const endL = { x: endX, y: endY - veinW / 2 };

    ctx.bezierCurveTo(cp1L.x, cp1L.y, cp2L.x, cp2L.y, endL.x, endL.y);
    ctx.lineTo(endX, endY + veinW / 2);

    // --- 下壁 (Lower Wall) ---
    const pMergeRightRaw = {
      x: startP.x + vecX * mergeDist + normX * (veinW / 2),
      y: startP.y + vecY * mergeDist + normY * (veinW / 2)
    };

    // ガード処理: 下壁の制御点が動脈壁(connY)より下に行かないように
    const pMergeRight = {
      x: pMergeRightRaw.x,
      y: Math.min(pMergeRightRaw.y, connY - 2)
    };

    const cp1R = {
      x: pMergeRight.x + vecX * currentHeight * 0.5,
      y: Math.min(pMergeRight.y + vecY * currentHeight * 0.5, connY - 5)
    };
    const cp2R = { x: endX - 100 * sx, y: endY + veinW / 2 };

    ctx.bezierCurveTo(cp2R.x, cp2R.y, cp1R.x, cp1R.y, pMergeRight.x, pMergeRight.y);

    // Toeへの収束
    const toeControl = {
      x: toeP.x + vecX * (mergeDist * 0.4),
      y: Math.min(toeP.y + vecY * (mergeDist * 0.4), connY)
    };

    ctx.quadraticCurveTo(
      toeControl.x, toeControl.y,
      toeP.x, toeP.y
    );

    ctx.closePath();
    ctx.fill();

    // 輪郭線
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 動脈壁
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, centerY + artH / 2); ctx.lineTo(w, centerY + artH / 2);
    ctx.moveTo(0, connY); ctx.lineTo(heelP.x, connY);
    ctx.moveTo(toeP.x, connY); ctx.lineTo(w, connY);
    ctx.stroke();

    // マーカー
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(heelP.x, heelP.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = `bold ${Math.round(11 * s)}px sans-serif`;
    ctx.fillText("Heel", heelP.x - 30 * s, heelP.y - 15 * s);

    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(toeP.x, toeP.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillText("Toe", toeP.x + 10 * s, toeP.y - 15 * s);

    // 角度表示
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`${params.angle}°`, heelP.x + 10 * s, heelP.y - 10 * s);
  }, [params, metrics, viewMode]);

  // --- Canvas 2: グラフ ---
  const renderGraph = useCallback(() => {
    const canvas = graphRef.current;
    const container = graphContainerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // コンテナサイズに合わせてCanvasの内部解像度を設定
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const data = metrics.prediction;
    const padding = { top: 40, right: 50, bottom: 40, left: 60 };
    const graphW = w - padding.left - padding.right;
    const graphH = h - padding.top - padding.bottom;
    const maxFlowY = 1200;
    const maxDiaY = 8.0;
    const weeksTotal = 24;

    // Grid
    ctx.lineWidth = 1;
    const yFlow400 = padding.top + graphH - (400 / maxFlowY) * graphH;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(padding.left, yFlow400); ctx.lineTo(w - padding.right, yFlow400); ctx.stroke();
    ctx.fillStyle = '#10b981'; ctx.font = "12px sans-serif"; ctx.fillText("Rule of 4 (Flow > 400)", padding.left + 10, yFlow400 - 8);

    const yDia4 = padding.top + graphH - (4.0 / maxDiaY) * graphH;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.beginPath(); ctx.moveTo(padding.left, yDia4); ctx.lineTo(w - padding.right, yDia4); ctx.stroke();
    ctx.fillStyle = '#3b82f6'; ctx.fillText("Rule of 4 (Dia > 4mm)", w - padding.right - 140, yDia4 - 8);
    ctx.setLineDash([]);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top); ctx.lineTo(padding.left, h - padding.bottom); ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.moveTo(w - padding.right, padding.top); ctx.lineTo(w - padding.right, h - padding.bottom);
    ctx.stroke();

    const plotLine = (dataset: TimePoint[], key: 'flow' | 'dia', color: string, maxY: number) => {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 4;
      dataset.forEach((d, i) => {
        const x = padding.left + (d.week / weeksTotal) * graphW;
        const y = padding.top + graphH - (d[key] / maxY) * graphH;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = color;
      dataset.forEach((d) => {
        const x = padding.left + (d.week / weeksTotal) * graphW;
        const y = padding.top + graphH - (d[key] / maxY) * graphH;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      });
    };

    plotLine(data, 'flow', '#10b981', maxFlowY);
    plotLine(data, 'dia', '#3b82f6', maxDiaY);

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.font = "11px sans-serif";
    data.forEach(d => {
      const x = padding.left + (d.week / weeksTotal) * graphW;
      ctx.fillText(d.label, x, h - 15);
    });

    ctx.save(); ctx.translate(20, h / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = '#10b981'; ctx.fillText("Flow (ml/min)", 0, 0); ctx.restore();
    ctx.save(); ctx.translate(w - 15, h / 2); ctx.rotate(Math.PI / 2); ctx.fillStyle = '#3b82f6'; ctx.fillText("Diameter (mm)", 0, 0); ctx.restore();
  }, [metrics]);

  useEffect(() => {
    if (metrics.tawss > 0) {
      renderCanvas();
      renderGraph();
    }
  }, [metrics, viewMode, renderCanvas, renderGraph]);

  // ウィンドウリサイズ時に再描画
  useEffect(() => {
    const handleResize = () => {
      if (metrics.tawss > 0) {
        renderCanvas();
        renderGraph();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [metrics, renderCanvas, renderGraph]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shadow-2xl z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-xl shadow-lg"><Activity className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white uppercase italic">AVF Shunt Simulator</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold">Maturation Prediction v4.2</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/references" className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 transition-colors group">
            <BookOpen className="w-3 h-3 text-slate-400 group-hover:text-white" />
            <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">References</span>
          </Link>
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shadow-inner">
            <ViewBtn active={viewMode === 'wss'} label="TAWSS" onClick={() => setViewMode('wss')} />
            <ViewBtn active={viewMode === 'osi'} label="OSI" onClick={() => setViewMode('osi')} />
            <ViewBtn active={viewMode === 'rrt'} label="RRT" onClick={() => setViewMode('rrt')} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-slate-900/95 border-r border-slate-800 p-5 overflow-y-auto shrink-0 scrollbar-thin">
          <section className="mb-8">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> Input Parameters
            </h2>
            <div className="space-y-6">
              <ControlSlider label="橈骨動脈径" value={params.arteryDia} min={1.0} max={4.0} step={0.1} unit="mm" onChange={(v) => setParams({ ...params, arteryDia: v })} highlight={params.arteryDia < 2.0} />
              <ControlSlider label="静脈径" value={params.veinDia} min={1.0} max={6.0} step={0.1} unit="mm" onChange={(v) => setParams({ ...params, veinDia: v })} highlight={params.veinDia < 2.0} />
              <ControlSlider label="吻合角度" value={params.angle} min={20} max={90} step={5} unit="°" onChange={(v) => setParams({ ...params, angle: v })} />
              <ControlSlider label="初期血流量" value={params.flowRate} min={50} max={1200} step={10} unit="ml/min" onChange={(v) => setParams({ ...params, flowRate: v })} />
              <ControlSlider label="ヘマトクリット" value={params.hct} min={20} max={55} step={1} unit="%" onChange={(v) => setParams({ ...params, hct: v })} />
            </div>
          </section>

          {/* A/V Ratio */}
          <section className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">A/V Ratio</span>
              <span className={`font-mono text-sm font-black ${metrics.avRatio <= 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {metrics.avRatio.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-700 ease-out ${metrics.avRatio <= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: metrics.avRatio > 1.2 ? '100%' : `${(metrics.avRatio / 1.2) * 100}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-500 font-bold italic tracking-tight opacity-70">{"Target: A/V Ratio <= 0.8"}</p>
          </section>
        </aside>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto gap-6 bg-slate-950 scrollbar-thin">

          {/* Geometry Canvas */}
          <div ref={canvasContainerRef} className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden relative shadow-2xl shrink-0 h-[380px]">
            <div className="absolute top-6 left-6 z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/90 rounded-full border border-slate-800 backdrop-blur-xl">
                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Geometry Simulation</span>
              </div>
            </div>
            <canvas ref={canvasRef} className="absolute top-0 left-0" />
            <div className="absolute bottom-6 right-6 w-56 bg-slate-950/90 p-3 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
              <div className="flex justify-between text-[9px] font-black text-slate-500 mb-1 uppercase tracking-widest">
                <span>Low</span>
                <span>High Intensity</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-600 via-green-500 via-yellow-400 to-red-500 shadow-inner" />
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-4 gap-4 shrink-0">
            <MetricCard
              label="予測 TAWSS" value={metrics.tawss.toFixed(1)} unit="Pa"
              status={metrics.tawss >= 25 && metrics.tawss <= 45 ? 'good' : metrics.tawss < 10 ? 'bad' : 'warning'}
              desc="Success: ~33 Pa"
            />
            <MetricCard
              label="予測 OSI" value={metrics.osi.toFixed(3)} unit="Idx"
              status={metrics.osi <= 0.1 ? 'good' : 'warning'}
              desc="Risk: > 0.1"
            />
            <MetricCard
              label="予測 RRT" value={metrics.rrt.toFixed(2)} unit="s⁻¹"
              status={metrics.rrt < 1.0 ? 'good' : 'bad'}
              desc="Relative Residence Time"
            />
            <MetricCard
              label="成功確率" value={String(Math.round(metrics.prob))} unit="%"
              status={metrics.prob > 70 ? 'good' : 'bad'}
              desc="Strict Scoring"
            />
            {/* New Row: Hemodynamic Parameters */}
            <MetricCard
              label="Reynolds No." value={String(Math.round(metrics.re))} unit=""
              status={metrics.re > 2000 ? 'warning' : 'good'}
              desc="Turbulence > 2000"
            />
            <MetricCard
              label="Dean Number" value={String(Math.round(metrics.de))} unit=""
              status={'neutral'}
              desc="Secondary Flow"
            />
            <MetricCard
              label="WSS Gradient" value={metrics.wssg.toFixed(1)} unit="Pa/m"
              status={metrics.wssg > 3000 ? 'warning' : 'good'}
              desc="Spatial Gradient"
            />
            <MetricCard
              label="Eff. Viscosity" value={metrics.effVisc.toFixed(2)} unit="mPa·s"
              status={'neutral'}
              desc="Blood Viscosity"
            />
          </div>

          {/* Bottom Section: Graph + Report */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px] shrink-0">
            {/* Graph */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2rem] p-5 relative flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">{"6\u30F6\u6708\u9593\u306E\u767A\u80B2\u4E88\u6E2C (Rule of 4s)"}</span>
                </div>
                <div className="flex gap-4 text-[10px] font-bold">
                  <span className="text-emerald-500 flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Flow (ml/min)</span>
                  <span className="text-blue-500 flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> Diameter (mm)</span>
                </div>
              </div>
              <div ref={graphContainerRef} className="flex-1 w-full h-full relative">
                <canvas ref={graphRef} className="absolute top-0 left-0" />
              </div>
            </div>

            {/* Report */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 shadow-inner overflow-y-auto">
              <div className="flex items-center gap-2 text-slate-400 mb-4">
                <Thermometer className="w-4 h-4 text-red-500" />
                <span className="text-xs font-black uppercase tracking-widest">Maturation Report</span>
              </div>
              <p className={`text-xs leading-relaxed font-bold ${metrics.status === 'bad' ? 'text-red-400' : metrics.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {metrics.report}
              </p>
              <div className="mt-5 pt-5 border-t border-slate-800 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-300 font-black uppercase">{"\u89D2\u5EA6\u30EA\u30B9\u30AF:"}</span>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    {"30\u5EA6\u672A\u6E80\u306E\u6975\u7AEF\u306A\u92ED\u89D2\u306F\u72ED\u7A84\u30EA\u30B9\u30AF\u3092\u9AD8\u3081\u308B\u305F\u3081\u3001\u30B9\u30B3\u30A2\u30EA\u30F3\u30B0\u3067\u6E1B\u70B9\u3057\u3066\u3044\u307E\u3059(Sadaghianloo et al.)\u3002"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-300 font-black uppercase">{"\u78BA\u7387\u7CBE\u5EA6:"}</span>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    {"Northrup\u3084He\u3089\u306E\u7814\u7A76\u306B\u57FA\u3065\u304D\u3001\u8840\u7BA1\u5F84\u30FBWSS\u30FB\u89D2\u5EA6\u306E\u8907\u5408\u8A55\u4FA1\u3092\u53B3\u683C\u5316\u3057\u3001\u697D\u89B3\u7684\u3059\u304E\u308B\u4E88\u6E2C\u3092\u6392\u9664\u3057\u307E\u3057\u305F\u3002"}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Sub-components ---

const ViewBtn = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button onClick={onClick} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all duration-300 ${active ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] translate-y-[-1px]' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
    {label}
  </button>
);

const ControlSlider = ({ label, value, min, max, step, unit, onChange, highlight }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  highlight?: boolean;
}) => (
  <div className="space-y-2 group">
    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 group-hover:text-red-400 transition-colors tracking-widest">
      <span className={highlight ? "text-amber-500 font-black" : ""}>{label}</span>
      <span className="text-white font-mono lowercase">{value.toFixed(1)}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-red-600 hover:accent-red-500 transition-all" />
  </div>
);

const MetricCard = ({ label, value, unit, status, desc }: {
  label: string;
  value: string;
  unit: string;
  status: 'good' | 'warning' | 'bad' | 'neutral';
  desc: string;
}) => {
  const styles: Record<string, string> = {
    good: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
    warning: 'border-amber-500/30 text-amber-400 bg-amber-500/5',
    bad: 'border-red-500/30 text-red-400 bg-red-500/5',
    neutral: 'border-slate-700 text-slate-400 bg-slate-800/30'
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-500 hover:translate-y-[-2px] ${styles[status]}`}>
      <div className="text-[9px] uppercase font-black opacity-60 mb-1 tracking-widest">{label}</div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-black tracking-tighter font-mono">{value}</span>
        <span className="text-[10px] font-bold opacity-60">{unit}</span>
      </div>
      <p className="text-[9px] leading-tight opacity-70 font-bold uppercase tracking-tight">{desc}</p>
    </div>
  );
};

export default AVFSimulator;
