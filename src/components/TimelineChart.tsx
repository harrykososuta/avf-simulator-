'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface TimelineChartProps {
    timeline: Array<{ week: number; probability: number; flowRate: number }>;
}

export default function TimelineChart({ timeline }: TimelineChartProps) {
    const data = {
        labels: timeline.map((t) => `${t.week}週`),
        datasets: [
            {
                label: '成熟確率 (%)',
                data: timeline.map((t) => t.probability * 100),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                yAxisID: 'y',
                fill: true,
                tension: 0.4,
            },
            {
                label: '血流量 (mL/min)',
                data: timeline.map((t) => t.flowRate),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y1',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#e4e4e7',
                    font: {
                        size: 12,
                    },
                },
            },
            title: {
                display: true,
                text: '12週間成熟予測',
                color: '#e4e4e7',
                font: {
                    size: 16,
                    weight: 'bold' as const,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#e4e4e7',
                bodyColor: '#e4e4e7',
                borderColor: '#3f3f46',
                borderWidth: 1,
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(63, 63, 70, 0.5)',
                },
                ticks: {
                    color: '#a1a1aa',
                },
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                    display: true,
                    text: '成熟確率 (%)',
                    color: '#22c55e',
                },
                grid: {
                    color: 'rgba(63, 63, 70, 0.5)',
                },
                ticks: {
                    color: '#22c55e',
                },
                min: 0,
                max: 100,
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: {
                    display: true,
                    text: '血流量 (mL/min)',
                    color: '#3b82f6',
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    color: '#3b82f6',
                },
            },
        },
    };

    return (
        <div className="h-[300px] p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <Line data={data} options={options} />
        </div>
    );
}
