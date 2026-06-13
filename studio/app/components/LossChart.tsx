"use client";

import { useRef, useEffect } from "react";

interface LossChartProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function LossChart({ data, width = 600, height = 200, className }: LossChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const pad = { top: 10, right: 10, bottom: 25, left: 50 };
    const w = width - pad.left - pad.right;
    const h = height - pad.top - pad.bottom;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Grid
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + w, y);
      ctx.stroke();

      ctx.fillStyle = "#9ca3af";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "right";
      const val = max - (range / 4) * i;
      ctx.fillText(val.toFixed(3), pad.left - 6, y + 4);
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    data.forEach((v, i) => {
      const x = pad.left + (i / (data.length - 1)) * w;
      const y = pad.top + h - ((v - min) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Step", pad.left + w / 2, height - 4);
    ctx.fillText("0", pad.left, height - 4);
    ctx.fillText(String(data.length - 1), pad.left + w, height - 4);
  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={className}
    />
  );
}
