"use client";

import { useRef, useEffect } from "react";
import type { StepStatus } from "../hooks/useWorkflow";

interface WorkflowStepProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  status: StepStatus;
  summary?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function WorkflowStep({
  stepNumber,
  title,
  subtitle,
  status,
  summary,
  expanded,
  onToggle,
  children,
}: WorkflowStepProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "active" && expanded && ref.current) {
      const timer = setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [status, expanded]);

  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isActive = status === "active";

  return (
    <div
      ref={ref}
      className={`rounded-xl border-2 transition-all duration-300 ${
        isLocked
          ? "border-gray-200 opacity-50"
          : isActive
          ? "border-blue-300 shadow-sm shadow-blue-100"
          : isCompleted
          ? "border-green-200"
          : "border-gray-200"
      }`}
    >
      <button
        type="button"
        onClick={isLocked ? undefined : onToggle}
        disabled={isLocked}
        className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-colors ${
          isLocked ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-50/50"
        }`}
      >
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
            isCompleted
              ? "bg-green-100 text-green-700"
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
            stepNumber
          )}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{title}</span>
            {isCompleted && !expanded && summary && (
              <span className="text-sm text-green-600 truncate">{summary}</span>
            )}
            {isActive && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Active
              </span>
            )}
            {isLocked && (
              <span className="text-xs text-gray-400">Locked</span>
            )}
          </div>
          {(isActive || (isLocked && !expanded)) && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        {!isLocked && (
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1 border-t border-gray-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
