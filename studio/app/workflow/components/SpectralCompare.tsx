"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button, Card, Input, Spinner, StatusBanner } from "@ace/ui";
import { audioUrl } from "@ace/ui";
import { getSamples } from "../../lib/api";

interface BandEnergy {
  label: string;
  lo: number;
  hi: number;
  pct: number;
}

interface AnalysisResult {
  bands: BandEnergy[];
  rms: number;
}

const BANDS = [
  { label: "Sub-bass", lo: 0, hi: 60 },
  { label: "Bass", lo: 60, hi: 250 },
  { label: "Low-mid", lo: 250, hi: 500 },
  { label: "Mid", lo: 500, hi: 2000 },
  { label: "Upper-mid", lo: 2000, hi: 4000 },
  { label: "Presence", lo: 4000, hi: 6000 },
  { label: "Brilliance", lo: 6000, hi: 20000 },
];

async function analyzeAudio(url: string): Promise<AnalysisResult> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch audio: ${resp.status}`);
  const buf = await resp.arrayBuffer();

  const ctx = new OfflineAudioContext(1, 1, 48000);
  const decoded = await ctx.decodeAudioData(buf);

  const channel = decoded.getChannelData(0);
  const n = channel.length;
  const sr = decoded.sampleRate;

  const rms = Math.sqrt(channel.reduce((sum, v) => sum + v * v, 0) / n);

  const fftSize = Math.min(n, 8192);
  const fft = new Float64Array(fftSize);
  for (let i = 0; i < fftSize; i++) fft[i] = channel[i];

  const real = new Float64Array(fftSize);
  const imag = new Float64Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    real[i] = fft[i];
    imag[i] = 0;
  }
  dft(real, imag, fftSize);

  const power = new Float64Array(fftSize / 2);
  let totalPower = 0;
  for (let i = 0; i < fftSize / 2; i++) {
    power[i] = real[i] * real[i] + imag[i] * imag[i];
    totalPower += power[i];
  }

  const freqPerBin = sr / fftSize;

  const bands: BandEnergy[] = BANDS.map(({ label, lo, hi }) => {
    let bandPower = 0;
    const binLo = Math.floor(lo / freqPerBin);
    const binHi = Math.min(Math.ceil(hi / freqPerBin), fftSize / 2);
    for (let i = binLo; i < binHi; i++) bandPower += power[i];
    return { label, lo, hi, pct: totalPower > 0 ? (bandPower / totalPower) * 100 : 0 };
  });

  return { bands, rms };
}

function dft(real: Float64Array, imag: Float64Array, n: number) {
  const outR = new Float64Array(n);
  const outI = new Float64Array(n);

  if (n <= 1) return;

  if ((n & (n - 1)) === 0) {
    fftRadix2(real, imag, n);
    return;
  }

  for (let k = 0; k < n; k++) {
    let sumR = 0, sumI = 0;
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      sumR += real[t] * Math.cos(angle) + imag[t] * Math.sin(angle);
      sumI += -real[t] * Math.sin(angle) + imag[t] * Math.cos(angle);
    }
    outR[k] = sumR;
    outI[k] = sumI;
  }
  real.set(outR);
  imag.set(outI);
}

function fftRadix2(real: Float64Array, imag: Float64Array, n: number) {
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (j > i) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
    let m = n >> 1;
    while (m >= 1 && j >= m) {
      j -= m;
      m >>= 1;
    }
    j += m;
  }

  for (let size = 2; size <= n; size *= 2) {
    const half = size / 2;
    const step = (2 * Math.PI) / size;
    for (let i = 0; i < n; i += size) {
      for (let k = 0; k < half; k++) {
        const angle = -step * k;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const tR = real[i + k + half] * cos - imag[i + k + half] * sin;
        const tI = real[i + k + half] * sin + imag[i + k + half] * cos;
        real[i + k + half] = real[i + k] - tR;
        imag[i + k + half] = imag[i + k] - tI;
        real[i + k] += tR;
        imag[i + k] += tI;
      }
    }
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

interface SpectralCompareProps {
  loraAudioPath: string | null;
  baseAudioPath: string | null;
}

export function SpectralCompare({ loraAudioPath, baseAudioPath }: SpectralCompareProps) {
  const [refPath, setRefPath] = useState("");
  const [refLoaded, setRefLoaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (refLoaded) return;
    getSamples().then(res => {
      const first = res.data.samples?.[0];
      if (first?.audio_path) {
        setRefPath(first.audio_path);
        setRefLoaded(true);
      }
    }).catch(() => {});
  }, [refLoaded]);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    ref: AnalysisResult;
    lora: AnalysisResult;
    base: AnalysisResult;
    loraSim: number;
    baseSim: number;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAnalyze = useCallback(async () => {
    if (!refPath || !loraAudioPath || !baseAudioPath) return;
    setAnalyzing(true);
    setError(null);
    setResults(null);
    try {
      const [ref, lora, base] = await Promise.all([
        analyzeAudio(audioUrl(refPath)),
        analyzeAudio(audioUrl(loraAudioPath)),
        analyzeAudio(audioUrl(baseAudioPath)),
      ]);

      const refVec = ref.bands.map((b) => b.pct);
      const loraVec = lora.bands.map((b) => b.pct);
      const baseVec = base.bands.map((b) => b.pct);

      const loraSim = cosineSimilarity(loraVec, refVec);
      const baseSim = cosineSimilarity(baseVec, refVec);

      setResults({ ref, lora, base, loraSim, baseSim });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [refPath, loraAudioPath, baseAudioPath]);

  useEffect(() => {
    if (!results || !canvasRef.current) return;
    drawChart(canvasRef.current, results.ref, results.lora, results.base);
  }, [results]);

  const ready = !!loraAudioPath && !!baseAudioPath;

  const diff = results ? ((results.loraSim - results.baseSim) * 100) : 0;

  return (
    <Card title="Spectral Compare">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Compare frequency distribution of generated audio against your reference (training) audio.
        </p>
        {!ready && (
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Run A/B Compare first to generate LoRA and Base audio.
          </div>
        )}
        <Input
          label="Reference Audio Path (original song on server)"
          placeholder="/path/to/your/dataset/song.mp3"
          value={refPath}
          onChange={(e) => setRefPath(e.target.value)}
          disabled={!ready}
        />
        <Button onClick={handleAnalyze} disabled={analyzing || !refPath || !ready} variant="secondary">
          {analyzing ? (
            <span className="flex items-center gap-2"><Spinner size="sm" />Analyzing...</span>
          ) : "Analyze"}
        </Button>

        {error && <StatusBanner variant="error">{error}</StatusBanner>}

        {results && (
          <div className="space-y-4">
            <canvas
              ref={canvasRef}
              width={700}
              height={320}
              className="w-full border border-gray-100 rounded-lg"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border px-4 py-3 text-center"
                style={{ borderColor: diff > 0 ? "#86efac" : "#d1d5db", backgroundColor: diff > 0 ? "#f0fdf4" : "#f9fafb" }}>
                <div className="text-2xl font-bold" style={{ color: "#16a34a" }}>
                  {(results.loraSim * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">LoRA → Reference similarity</div>
              </div>
              <div className="rounded-lg border px-4 py-3 text-center"
                style={{ borderColor: diff < 0 ? "#86efac" : "#d1d5db", backgroundColor: diff < 0 ? "#f0fdf4" : "#f9fafb" }}>
                <div className="text-2xl font-bold" style={{ color: "#6b7280" }}>
                  {(results.baseSim * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Base → Reference similarity</div>
              </div>
            </div>

            {diff !== 0 && (
              <div className="text-sm text-center py-2">
                {diff > 0 ? (
                  <span className="text-green-700 font-medium">
                    LoRA output is {diff.toFixed(1)}% closer to reference than base model
                  </span>
                ) : (
                  <span className="text-gray-600">
                    Base model is {(-diff).toFixed(1)}% closer to reference than LoRA
                  </span>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-1 font-medium">Band</th>
                    <th className="pb-1 font-medium text-right">Reference</th>
                    <th className="pb-1 font-medium text-right">LoRA</th>
                    <th className="pb-1 font-medium text-right">Base</th>
                  </tr>
                </thead>
                <tbody>
                  {BANDS.map((b, i) => (
                    <tr key={b.label} className="border-b border-gray-50">
                      <td className="py-1 text-gray-700">{b.label} ({b.lo}-{b.hi}Hz)</td>
                      <td className="py-1 text-right tabular-nums" style={{ color: "#b45309" }}>
                        {results.ref.bands[i].pct.toFixed(1)}%
                      </td>
                      <td className="py-1 text-right tabular-nums" style={{ color: "#16a34a" }}>
                        {results.lora.bands[i].pct.toFixed(1)}%
                      </td>
                      <td className="py-1 text-right tabular-nums text-gray-500">
                        {results.base.bands[i].pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function drawChart(
  canvas: HTMLCanvasElement,
  ref: AnalysisResult,
  lora: AnalysisResult,
  base: AnalysisResult,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, w, h);

  const padL = 50, padR = 20, padT = 30, padB = 60;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const nBands = BANDS.length;
  const groupW = chartW / nBands;
  const barW = groupW * 0.22;
  const gap = groupW * 0.04;

  const maxPct = Math.max(
    ...ref.bands.map((b) => b.pct),
    ...lora.bands.map((b) => b.pct),
    ...base.bands.map((b) => b.pct),
    10,
  );

  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(padL, padT, chartW, chartH);

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 0.5;
  const nGrid = 5;
  for (let i = 0; i <= nGrid; i++) {
    const y = padT + chartH - (chartH * i) / nGrid;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + chartW, y);
    ctx.stroke();

    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${((maxPct * i) / nGrid).toFixed(0)}%`, padL - 6, y + 4);
  }

  const colors = {
    ref: "#d97706",
    lora: "#16a34a",
    base: "#9ca3af",
  };

  for (let i = 0; i < nBands; i++) {
    const gx = padL + i * groupW + groupW * 0.15;

    const vals = [
      { pct: ref.bands[i].pct, color: colors.ref },
      { pct: lora.bands[i].pct, color: colors.lora },
      { pct: base.bands[i].pct, color: colors.base },
    ];

    vals.forEach((v, j) => {
      const bh = (v.pct / maxPct) * chartH;
      const bx = gx + j * (barW + gap);
      const by = padT + chartH - bh;

      ctx.fillStyle = v.color;
      ctx.beginPath();
      const r = 2;
      ctx.moveTo(bx + r, by);
      ctx.lineTo(bx + barW - r, by);
      ctx.quadraticCurveTo(bx + barW, by, bx + barW, by + r);
      ctx.lineTo(bx + barW, padT + chartH);
      ctx.lineTo(bx, padT + chartH);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.fill();
    });

    ctx.fillStyle = "#4b5563";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    const label = BANDS[i].label.length > 7 ? BANDS[i].label.slice(0, 6) + "." : BANDS[i].label;
    ctx.fillText(label, padL + i * groupW + groupW / 2, padT + chartH + 14);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "9px sans-serif";
    const freqLabel = BANDS[i].hi >= 1000
      ? `${(BANDS[i].lo / 1000).toFixed(BANDS[i].lo >= 1000 ? 0 : 1)}-${(BANDS[i].hi / 1000).toFixed(0)}k`
      : `${BANDS[i].lo}-${BANDS[i].hi}`;
    ctx.fillText(freqLabel, padL + i * groupW + groupW / 2, padT + chartH + 26);
  }

  const legendY = 12;
  const legendItems = [
    { label: "Reference", color: colors.ref },
    { label: "LoRA", color: colors.lora },
    { label: "Base", color: colors.base },
  ];
  let lx = padL;
  ctx.font = "11px sans-serif";
  legendItems.forEach(({ label, color }) => {
    ctx.fillStyle = color;
    ctx.fillRect(lx, legendY - 8, 12, 12);
    ctx.fillStyle = "#374151";
    ctx.textAlign = "left";
    ctx.fillText(label, lx + 16, legendY + 2);
    lx += ctx.measureText(label).width + 32;
  });
}
