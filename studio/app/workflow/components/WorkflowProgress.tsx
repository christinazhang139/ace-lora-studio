"use client";

import type { StepId, StepStatus } from "../hooks/useWorkflow";

const STEPS: { id: StepId; label: string }[] = [
  { id: "dataset", label: "Dataset" },
  { id: "preprocess", label: "Preprocess" },
  { id: "train", label: "Train" },
  { id: "export", label: "Export" },
];

interface WorkflowProgressProps {
  statuses: Record<StepId, StepStatus>;
}

export function WorkflowProgress({ statuses }: WorkflowProgressProps) {
  return (
    <div className="flex items-center justify-center gap-0 py-2">
      {STEPS.map((step, i) => {
        const s = statuses[step.id];
        const isCompleted = s === "completed";
        const isActive = s === "active";

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium ${
                  isCompleted ? "text-green-600" : isActive ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-2 mb-5 transition-colors ${
                  isCompleted ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
