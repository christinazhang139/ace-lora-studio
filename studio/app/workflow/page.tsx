"use client";

import { useEffect } from "react";
import { useWorkflow } from "./hooks/useWorkflow";
import { useDatasetStep } from "./hooks/useDatasetStep";
import { usePreprocessStep } from "./hooks/usePreprocessStep";
import { useTrainStep } from "./hooks/useTrainStep";
import { useExportStep } from "./hooks/useExportStep";
import { WorkflowProgress } from "./components/WorkflowProgress";
import { WorkflowStep } from "./components/WorkflowStep";
import { DatasetStepContent } from "./components/DatasetStepContent";
import { PreprocessStepContent } from "./components/PreprocessStepContent";
import { TrainStepContent } from "./components/TrainStepContent";
import { ExportStepContent } from "./components/ExportStepContent";

export default function WorkflowPage() {
  const workflow = useWorkflow();
  const dataset = useDatasetStep();
  const preprocess = usePreprocessStep();
  const train = useTrainStep();
  const exportStep = useExportStep();

  useEffect(() => {
    if (dataset.isComplete && workflow.statuses.dataset !== "completed") {
      workflow.completeStep("dataset");
    }
  }, [dataset.isComplete]);

  useEffect(() => {
    if (preprocess.isComplete && workflow.statuses.preprocess !== "completed") {
      workflow.completeStep("preprocess");
    }
  }, [preprocess.isComplete]);

  useEffect(() => {
    if (train.isComplete && workflow.statuses.train !== "completed") {
      workflow.completeStep("train");
    }
  }, [train.isComplete]);

  useEffect(() => {
    if (exportStep.isComplete && workflow.statuses.export !== "completed") {
      workflow.completeStep("export");
    }
  }, [exportStep.isComplete]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Workflow</h2>
        <p className="text-sm text-gray-500 mt-1">Train a LoRA adapter from start to finish</p>
      </div>

      <WorkflowProgress statuses={workflow.statuses} />

      <div className="space-y-4">
        <WorkflowStep
          stepNumber={1}
          title="Dataset"
          subtitle="Upload audio files and label metadata"
          status={workflow.statuses.dataset}
          summary={dataset.summary}
          expanded={workflow.expanded.dataset}
          onToggle={() => workflow.toggleExpanded("dataset")}
        >
          <DatasetStepContent {...dataset} />
        </WorkflowStep>

        <WorkflowStep
          stepNumber={2}
          title="Preprocess"
          subtitle="Convert audio to training tensors"
          status={workflow.statuses.preprocess}
          summary={preprocess.summary}
          expanded={workflow.expanded.preprocess}
          onToggle={() => workflow.toggleExpanded("preprocess")}
        >
          <PreprocessStepContent {...preprocess} />
        </WorkflowStep>

        <WorkflowStep
          stepNumber={3}
          title="Train"
          subtitle="Fine-tune LoRA or LoKR adapters"
          status={workflow.statuses.train}
          summary={train.summary}
          expanded={workflow.expanded.train}
          onToggle={() => workflow.toggleExpanded("train")}
        >
          <TrainStepContent {...train} />
        </WorkflowStep>

        <WorkflowStep
          stepNumber={4}
          title="Export"
          subtitle="Export weights and A/B compare"
          status={workflow.statuses.export}
          summary={exportStep.summary}
          expanded={workflow.expanded.export}
          onToggle={() => workflow.toggleExpanded("export")}
        >
          <ExportStepContent {...exportStep} />
        </WorkflowStep>
      </div>
    </div>
  );
}
