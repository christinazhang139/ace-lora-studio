import { cn } from "../lib/cn";

type Variant = "info" | "success" | "warning" | "error";

interface StatusBannerProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const styles: Record<Variant, string> = {
  info: "bg-blue-50 text-blue-800 border-blue-200",
  success: "bg-green-50 text-green-800 border-green-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-red-50 text-red-800 border-red-200",
};

export function StatusBanner({ variant = "info", children, className }: StatusBannerProps) {
  return (
    <div className={cn("px-4 py-3 rounded-lg border text-sm", styles[variant], className)}>
      {children}
    </div>
  );
}
