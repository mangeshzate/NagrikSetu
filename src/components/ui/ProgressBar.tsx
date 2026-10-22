import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  className?: string;
  color?: "civic" | "saffron" | "emerald" | "amber";
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = true,
  className,
  color = "civic",
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  const barColors = {
    civic: "bg-civic-600",
    saffron: "bg-saffron-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
  };

  return (
    <div className={twMerge(clsx("w-full space-y-1.5", className))}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
          {label && <span>{label}</span>}
          {showPercentage && <span className="tabular-nums">{clamped}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"
      >
        <div
          className={twMerge(
            clsx("h-full transition-all duration-500 ease-out rounded-full", barColors[color])
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
