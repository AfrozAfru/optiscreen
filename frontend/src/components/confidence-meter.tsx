"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  value: number; // 0.0 - 1.0
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ConfidenceMeter({
  value,
  size = 160,
  strokeWidth = 10,
  className,
}: ConfidenceMeterProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Animate from 0 to value
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - animatedValue * circumference;
  const percentage = Math.round(animatedValue * 100);

  // Color based on confidence level
  const getColor = () => {
    if (animatedValue >= 0.85) return { stroke: "#10b981", label: "High" };    // emerald
    if (animatedValue >= 0.65) return { stroke: "#f59e0b", label: "Medium" };   // amber
    return { stroke: "#ef4444", label: "Low" };                                 // red
  };

  const { stroke, label } = getColor();

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90 transform"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          {/* Animated progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {percentage}%
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Confidence
          </span>
        </div>
      </div>
      {/* Label below */}
      <div
        className="rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          backgroundColor: `${stroke}15`,
          color: stroke,
        }}
      >
        {label} Confidence
      </div>
    </div>
  );
}
