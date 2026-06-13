"use client";

import { useReducer, useCallback } from "react";

export type StepId = "dataset" | "preprocess" | "train" | "export";
export type StepStatus = "locked" | "active" | "completed";

interface WorkflowState {
  statuses: Record<StepId, StepStatus>;
  expanded: Record<StepId, boolean>;
}

type Action =
  | { type: "COMPLETE_STEP"; step: StepId }
  | { type: "TOGGLE_EXPANDED"; step: StepId }
  | { type: "SET_EXPANDED"; step: StepId; expanded: boolean };

const STEP_ORDER: StepId[] = ["dataset", "preprocess", "train", "export"];

function nextStep(step: StepId): StepId | null {
  const idx = STEP_ORDER.indexOf(step);
  return idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : null;
}

function reducer(state: WorkflowState, action: Action): WorkflowState {
  switch (action.type) {
    case "COMPLETE_STEP": {
      const next = nextStep(action.step);
      return {
        statuses: {
          ...state.statuses,
          [action.step]: "completed",
          ...(next && state.statuses[next] === "locked" ? { [next]: "active" } : {}),
        },
        expanded: {
          ...state.expanded,
          [action.step]: false,
          ...(next ? { [next]: true } : {}),
        },
      };
    }
    case "TOGGLE_EXPANDED": {
      if (state.statuses[action.step] === "locked") return state;
      return {
        ...state,
        expanded: { ...state.expanded, [action.step]: !state.expanded[action.step] },
      };
    }
    case "SET_EXPANDED": {
      if (state.statuses[action.step] === "locked") return state;
      return {
        ...state,
        expanded: { ...state.expanded, [action.step]: action.expanded },
      };
    }
    default:
      return state;
  }
}

const initialState: WorkflowState = {
  statuses: { dataset: "active", preprocess: "locked", train: "locked", export: "locked" },
  expanded: { dataset: true, preprocess: false, train: false, export: false },
};

export function useWorkflow() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const completeStep = useCallback((step: StepId) => {
    dispatch({ type: "COMPLETE_STEP", step });
  }, []);

  const toggleExpanded = useCallback((step: StepId) => {
    dispatch({ type: "TOGGLE_EXPANDED", step });
  }, []);

  return {
    statuses: state.statuses,
    expanded: state.expanded,
    completeStep,
    toggleExpanded,
  };
}
