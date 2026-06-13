"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  showValue?: boolean;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, id, showValue = true, value, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between">
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {showValue && (
            <span className="text-sm text-gray-500 tabular-nums">{value}</span>
          )}
        </div>
      )}
      <input
        ref={ref}
        type="range"
        id={id}
        value={value}
        className={cn(
          "w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200",
          "accent-blue-600",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
Slider.displayName = "Slider";
