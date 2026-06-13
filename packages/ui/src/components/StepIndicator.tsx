import { cn } from "../lib/cn";

interface Step {
  id: string;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  current: string;
  className?: string;
}

export function StepIndicator({ steps, current, className }: StepIndicatorProps) {
  const currentIdx = steps.findIndex((s) => s.id === current);

  return (
    <nav className={cn("space-y-1", className)}>
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm",
              active && "bg-accent/10 text-accent font-medium",
              done && "text-gray-500",
              !active && !done && "text-gray-400",
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                active && "bg-accent text-white",
                done && "bg-green-100 text-green-700",
                !active && !done && "bg-gray-100 text-gray-400",
              )}
            >
              {done ? "✓" : i + 1}
            </span>
            <span>{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}
