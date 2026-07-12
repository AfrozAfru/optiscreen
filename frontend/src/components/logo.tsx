"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        {/* Outer eye shape */}
        <path
          d="M16 6C9.5 6 4.2 10.4 2 16c2.2 5.6 7.5 10 14 10s11.8-4.4 14-10c-2.2-5.6-7.5-10-14-10z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Iris */}
        <circle
          cx="16"
          cy="16"
          r="5"
          stroke="currentColor"
          strokeWidth="2"
          fill="currentColor"
          fillOpacity="0.1"
        />
        {/* Pupil */}
        <circle cx="16" cy="16" r="2" fill="currentColor" />
        {/* Scan line accent */}
        <line
          x1="16"
          y1="8"
          x2="16"
          y2="24"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.4"
        />
      </svg>
      {showText && (
        <span className="text-xl font-bold tracking-tight text-foreground">
          Opti<span className="text-primary">Screen</span>
        </span>
      )}
    </div>
  );
}
