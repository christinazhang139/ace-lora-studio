"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@ace/ui";
import { useApiHealth } from "@ace/ui";

const steps = [
  { id: "dataset", label: "Dataset", href: "/dataset", num: 1 },
  { id: "preprocess", label: "Preprocess", href: "/preprocess", num: 2 },
  { id: "train", label: "Train", href: "/train", num: 3 },
  { id: "export", label: "Export", href: "/export", num: 4 },
];

const workflowLink = { id: "workflow", label: "Workflow", href: "/workflow" };

export function Sidebar() {
  const pathname = usePathname();
  const { ok } = useApiHealth(8000);

  return (
    <aside className="w-56 h-screen flex flex-col border-r border-gray-200 bg-gray-50/50">
      <div className="px-5 py-6">
        <h1 className="text-lg font-bold tracking-tight">ACE LoRA Training</h1>
        <p className="text-xs text-gray-400 mt-0.5">Studio</p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        <Link
          href={workflowLink.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
            pathname.startsWith(workflowLink.href)
              ? "bg-accent/10 text-accent font-medium"
              : "text-gray-600 hover:bg-gray-100",
          )}
        >
          <span
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
              pathname.startsWith(workflowLink.href) ? "bg-accent text-white" : "bg-gray-200 text-gray-500",
            )}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </span>
          {workflowLink.label}
        </Link>
        <div className="border-t border-gray-200 my-2" />
        {steps.map((step) => {
          const active = pathname.startsWith(step.href);
          return (
            <Link
              key={step.id}
              href={step.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                  active ? "bg-accent text-white" : "bg-gray-200 text-gray-500",
                )}
              >
                {step.num}
              </span>
              {step.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs">
          <span className={cn("w-2 h-2 rounded-full", ok ? "bg-green-500" : "bg-red-400")} />
          <span className="text-gray-500">
            {ok ? "API Connected" : "API Offline"}
          </span>
        </div>
      </div>
    </aside>
  );
}
