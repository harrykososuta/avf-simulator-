'use client';

import React, { useRef, useEffect } from 'react';
import { SimulationParams, HemodynamicMetrics, VesselGeometry, WallPoint, WSSData } from '@/types';

interface VesselCanvasProps {
    params: SimulationParams;
    metrics: HemodynamicMetrics;
    geometry: VesselGeometry;
    wallWSS: { point: WallPoint; data: WSSData }[];
    displayMode: 'wss' | 'osi' | 'velocity';
}

export default function VesselCanvas({ params, metrics, geometry, wallWSS, displayMode }: VesselCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // キャンバスクリア
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (displayMode === 'velocity') {
            // 速度モード: 血管形状全体 + ベクトル
            drawVesselsOutline(ctx, geometry);
            drawFlowVectors(ctx, geometry, params);
        } else {
            // WSS/OSIモード: 詳細カラーマップ
            drawColoredVessels(ctx, wallWSS, displayMode);
        }

        drawLegend(ctx, displayMode, canvas.width, canvas.height);
    }, [params, metrics, geometry, wallWSS, displayMode]);

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-full bg-black rounded-lg border border-zinc-800"
        />
    );
}

/**
 * 血管形状(輪郭のみ)
 */
function drawVesselsOutline(ctx: CanvasRenderingContext2D, geometry: VesselGeometry) {
    const scale = 80; // mm to pixel
    const offsetX = 200;
    const offsetY = 300;

    // 動脈
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX + geometry.arteryLength * scale, offsetY);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = geometry.arteryDiameter * scale;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 静脈
    const angleRad = (geometry.anastomosisAngle * Math.PI) / 180;
    const veinEndX = offsetX + geometry.arteryLength * scale + Math.cos(angleRad) * geometry.veinLength * scale;
    const veinEndY = offsetY - Math.sin(angleRad) * geometry.veinLength * scale;

    ctx.beginPath();
    ctx.moveTo(offsetX + geometry.arteryLength * scale, offsetY);
    ctx.lineTo(veinEndX, veinEndY);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = geometry.veinDiameter * scale;
    ctx.stroke();
}

/**
 * 血管描画 (詳細カラーマップ)
 */
function drawColoredVessels(
    ctx: CanvasRenderingContext2D,
    wallWSS: { point: WallPoint; data: WSSData }[],
    mode: 'wss' | 'osi'
) {
    if (!wallWSS || wallWSS.length === 0) return;

    // ポイントサイズ (描画用)
    const pointSize = 3;

    for (let i = 0; i < wallWSS.length; i++) {
        const p = wallWSS[i];
        const val = mode === 'wss' ? p.data.tawss : p.data.osi;
        const color = getColorForMetric(val, mode);

        // 点として描画
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.point.point.x, p.point.point.y, pointSize, 0, Math.PI * 2);
        ctx.fill();

        // 隣接点とつなぐ (同じ領域内なら)
        if (i < wallWSS.length - 1) {
            const pNext = wallWSS[i + 1];
            if (p.point.regionType === pNext.point.regionType) {
                const valNext = mode === 'wss' ? pNext.data.tawss : pNext.data.osi;
                const colorNext = getColorForMetric(valNext, mode);

                // グラデーションで線を引く
                const grad = ctx.createLinearGradient(p.point.point.x, p.point.point.y, pNext.point.point.x, pNext.point.point.y);
                grad.addColorStop(0, color);
                grad.addColorStop(1, colorNext);

                ctx.strokeStyle = grad;
                ctx.lineWidth = pointSize * 2;
                ctx.beginPath();
                ctx.moveTo(p.point.point.x, p.point.point.y);
                ctx.lineTo(pNext.point.point.x, pNext.point.point.y);
                ctx.stroke();
            }
        }
    }
}

/**
 * 流速ベクトル描画
 */
function drawFlowVectors(
    ctx: CanvasRenderingContext2D,
    geometry: VesselGeometry,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _params: SimulationParams
) {
    const scale = 80;
    const offsetX = 200;
    const offsetY = 300;

    // 動脈内の流速ベクトル
    for (let i = 1; i <= 4; i++) {
        const x = offsetX + (geometry.arteryLength / 5) * i * scale;
        drawArrow(ctx, x, offsetY, x + 30, offsetY, '#3b82f6', 2);
    }

    // 静脈内の流速ベクトル
    const angleRad = (geometry.anastomosisAngle * Math.PI) / 180;
    for (let i = 1; i <= 3; i++) {
        const baseX = offsetX + geometry.arteryLength * scale;
        const baseY = offsetY;
        const t = i / 4;
        const x = baseX + Math.cos(angleRad) * geometry.veinLength * scale * t;
        const y = baseY - Math.sin(angleRad) * geometry.veinLength * scale * t;
        const endX = x + Math.cos(angleRad) * 25;
        const endY = y - Math.sin(angleRad) * 25;
        drawArrow(ctx, x, y, endX, endY, '#10b981', 2);
    }
}

/**
 * 矢印描画
 */
function drawArrow(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    width: number
) {
    const headLen = 8;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    // 線
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 矢印の頭
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLen * Math.cos(angle - Math.PI / 6),
        y2 - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x2 - headLen * Math.cos(angle + Math.PI / 6),
        y2 - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
}

/**
 * 凡例描画
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function drawLegend(ctx: CanvasRenderingContext2D, mode: string, width: number, _height: number) {
    const legendX = width - 150;
    const legendY = 30;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(legendX - 10, legendY - 10, 140, 120);

    ctx.fillStyle = '#e4e4e7';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(mode.toUpperCase() + ' カラーマップ', legendX, legendY + 10);

    // グラデーションバー
    const gradient = ctx.createLinearGradient(legendX, legendY + 25, legendX, legendY + 95);

    if (mode === 'velocity') {
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#10b981');
    } else {
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(0.5, '#fbbf24');
        gradient.addColorStop(1, '#3b82f6');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(legendX, legendY + 25, 20, 70);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#e4e4e7';
    if (mode === 'osi') {
        ctx.fillText('高 (0.5)', legendX + 30, legendY + 35);
        ctx.fillText('中 (0.25)', legendX + 30, legendY + 65);
        ctx.fillText('低 (0.0)', legendX + 30, legendY + 90);
    } else if (mode === 'wss') {
        ctx.fillText('高 (10Pa)', legendX + 30, legendY + 35);
        ctx.fillText('中 (5Pa)', legendX + 30, legendY + 65);
        ctx.fillText('低 (0Pa)', legendX + 30, legendY + 90);
    } else {
        ctx.fillText('V_max', legendX + 30, legendY + 35);
        ctx.fillText('V_mean', legendX + 30, legendY + 65);
        ctx.fillText('0', legendX + 30, legendY + 90);
    }
}

/**
 * メトリクスに応じた色を返す
 */
function getColorForMetric(value: number, mode: string): string {
    let normalized = 0;

    if (mode === 'wss') {
        // WSS: 0-10 Pa -> 赤(高)～青(低)
        // 通常、低い方が青、高い方が赤
        normalized = Math.min(value / 10, 1);
    } else if (mode === 'osi') {
        // OSI: 0-0.5 -> 赤(高:悪い)～青(低:良い)
        normalized = Math.min(value / 0.5, 1);
    } else {
        return '#3b82f6';
    }

    // ヒートマップ: 青 -> 緑 -> 黄 -> 赤
    // 0.0 -> 0.33 -> 0.66 -> 1.0
    const h = (1.0 - normalized) * 240; // 240(青) -> 0(赤)
    return `hsl(${h}, 100%, 50%)`;
}
