"use client";

import { useState } from "react";
import { Button, Card, Input, Slider, Tabs, Badge, Spinner, StatusBanner } from "@ace/ui";
import { LossChart } from "../../components/LossChart";
import type { useTrainStep } from "../hooks/useTrainStep";

const hint = "text-xs text-gray-400 mt-0.5";
function Hint({ children }: { children: React.ReactNode }) {
  return <p className={hint}>{children}</p>;
}

function LoRAForm({ onStart, disabled }: { onStart: (config: Record<string, unknown>) => void; disabled: boolean }) {
  const [rank, setRank] = useState(32);
  const [alpha, setAlpha] = useState(32);
  const [lr, setLr] = useState("1e-4");
  const [epochs, setEpochs] = useState(100);
  const [batchSize, setBatchSize] = useState(1);
  const [dropout, setDropout] = useState(0);
  const [gradCkpt, setGradCkpt] = useState(true);
  const [fp8, setFp8] = useState(false);
  const [seed, setSeed] = useState(42);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Slider label="Rank" min={1} max={256} value={rank} onChange={(e) => setRank(Number(e.target.value))} />
          <Hint>Model capacity. 16-64 recommended.</Hint>
        </div>
        <div>
          <Slider label="Alpha" min={1} max={512} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} />
          <Hint>Scaling factor. Usually = Rank.</Hint>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Input label="Learning Rate" value={lr} onChange={(e) => setLr(e.target.value)} />
          <Hint>1e-4 is a safe default.</Hint>
        </div>
        <div>
          <Input label="Epochs" type="number" value={epochs} onChange={(e) => setEpochs(Number(e.target.value))} min={1} />
          <Hint>50-200 for most cases.</Hint>
        </div>
        <div>
          <Input label="Batch Size" type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} min={1} />
          <Hint>Keep at 1 unless VRAM allows.</Hint>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Slider label="Dropout" min={0} max={0.5} step={0.05} value={dropout} onChange={(e) => setDropout(Number(e.target.value))} />
          <Hint>0 for small datasets, 0.05-0.1 for larger.</Hint>
        </div>
        <div>
          <Input label="Seed" type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
          <Hint>Change to get different results.</Hint>
        </div>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={gradCkpt} onChange={(e) => setGradCkpt(e.target.checked)} className="accent-blue-600" />
          Gradient Checkpointing
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={fp8} onChange={(e) => setFp8(e.target.checked)} className="accent-blue-600" />
          FP8 Quantization
        </label>
      </div>
      <Button
        onClick={() =>
          onStart({
            tensor_dir: "",
            lora_rank: rank, lora_alpha: alpha,
            learning_rate: parseFloat(lr),
            train_epochs: epochs, train_batch_size: batchSize,
            lora_dropout: dropout,
            gradient_checkpointing: gradCkpt, use_fp8: fp8,
            training_seed: seed,
          })
        }
        disabled={disabled}
      >
        {disabled ? <Spinner size="sm" /> : "Start LoRA Training"}
      </Button>
    </div>
  );
}

function LoKRForm({ onStart, disabled }: { onStart: (config: Record<string, unknown>) => void; disabled: boolean }) {
  const [factor, setFactor] = useState(8);
  const [lr, setLr] = useState("1e-4");
  const [epochs, setEpochs] = useState(100);
  const [batchSize, setBatchSize] = useState(1);

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
        LoKR uses less VRAM than LoRA but may produce slightly less detailed results.
      </p>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Slider label="Factor" min={2} max={64} value={factor} onChange={(e) => setFactor(Number(e.target.value))} />
          <Hint>4-16 recommended.</Hint>
        </div>
        <div>
          <Input label="Learning Rate" value={lr} onChange={(e) => setLr(e.target.value)} />
          <Hint>1e-4 is a safe default.</Hint>
        </div>
        <div>
          <Input label="Epochs" type="number" value={epochs} onChange={(e) => setEpochs(Number(e.target.value))} min={1} />
          <Hint>50-200 recommended.</Hint>
        </div>
      </div>
      <div className="max-w-48">
        <Input label="Batch Size" type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} min={1} />
        <Hint>Keep at 1 for most setups.</Hint>
      </div>
      <Button
        onClick={() =>
          onStart({
            tensor_dir: "", lokr_factor: factor,
            learning_rate: parseFloat(lr),
            train_epochs: epochs, train_batch_size: batchSize,
          })
        }
        disabled={disabled}
      >
        {disabled ? <Spinner size="sm" /> : "Start LoKR Training"}
      </Button>
    </div>
  );
}

function formatETA(seconds: number): string {
  if (seconds <= 0) return "";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

type TrainStepProps = ReturnType<typeof useTrainStep>;

export function TrainStepContent(props: TrainStepProps) {
  const { training, status, error, handleStartLora, handleStartLokr, handleStop } = props;

  const totalEpochs = (status?.config?.epochs ?? status?.config?.train_epochs ?? 0) as number;
  const epochProgress = totalEpochs > 0 ? Math.round((status?.current_epoch ?? 0) / totalEpochs * 100) : 0;

  return (
    <div className="space-y-4">
      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      <Card>
        <Tabs
          tabs={[
            { id: "lora", label: "LoRA", content: <LoRAForm onStart={handleStartLora} disabled={training} /> },
            { id: "lokr", label: "LoKR", content: <LoKRForm onStart={handleStartLokr} disabled={training} /> },
          ]}
        />
      </Card>

      {(training || status) && (
        <Card
          title="Training Monitor"
          actions={training ? <Button size="sm" variant="danger" onClick={handleStop}>Stop</Button> : undefined}
        >
          <div className="space-y-4">
            {status && (
              <>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <Badge
                    variant={
                      status.is_training ? "info"
                        : error || status.status?.startsWith("❌") ? "error"
                        : status.current_step > 0 ? "success" : "default"
                    }
                  >
                    {status.is_training
                      ? status.current_step === 0 ? "Starting..." : "Training"
                      : error || status.status?.startsWith("❌") ? "Failed"
                      : status.current_step > 0 ? "Completed" : "Idle"}
                  </Badge>
                  {status.is_training && status.current_step === 0 && (
                    <span className="text-gray-500">Loading model into GPU...</span>
                  )}
                  {(status.current_step > 0 || status.current_epoch > 0) && (
                    <>
                      <span className="text-gray-600">Epoch {status.current_epoch}{totalEpochs > 0 ? ` / ${totalEpochs}` : ""}</span>
                      <span className="text-gray-600">Step {status.current_step}</span>
                      {status.current_loss != null && status.current_loss > 0 && (
                        <span className="text-gray-600">Loss: {status.current_loss.toFixed(4)}</span>
                      )}
                      {status.steps_per_second > 0 && (
                        <span className="text-gray-400">{status.steps_per_second.toFixed(2)} it/s</span>
                      )}
                    </>
                  )}
                </div>
                {status.is_training && totalEpochs > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{epochProgress}% complete</span>
                      {status.estimated_time_remaining > 0 && (
                        <span>ETA: {formatETA(status.estimated_time_remaining)}</span>
                      )}
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(epochProgress, status.current_step > 0 ? 1 : 0)}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            {status?.loss_history && status.loss_history.length > 1 && (
              <LossChart data={status.loss_history.map((e) => e.loss)} />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
