"use client";

import React, { useEffect, useState } from "react";

interface FocusRingGaugeProps {
  confidence: number; // 0.0 to 1.0
  isCataract: boolean;
}

export function FocusRingGauge({ confidence, isCataract }: FocusRingGaugeProps) {
  const totalSegments = 48;
  const percentage = Math.round(confidence * 100);
  const targetFilledCount = Math.round((confidence * totalSegments));
  const [filledCount, setFilledCount] = useState(0);

  const accentColor = isCataract ? "#F2A65A" : "#45D9C0";
  const unfilledColor = "#232B36";

  useEffect(() => {
    setFilledCount(0);
    let current = 0;
    const interval = setInterval(() => {
      if (current < targetFilledCount) {
        current += 1;
        setFilledCount(current);
      } else {
        clearInterval(interval);
      }
    }, 18); // slight hero stagger ~18ms per segment

    return () => clearInterval(interval);
  }, [targetFilledCount, isCataract]);

  const cx = 130;
  const cy = 130;
  const innerRadius = 78;
  const outerRadius = 104;

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <svg
        width="260"
        height="260"
        viewBox="0 0 260 260"
        className="overflow-visible"
        role="img"
        aria-label={`Confidence score focus ring gauge: ${percentage}%`}
      >
        {/* Outer subtle optical calibration circle */}
        <circle
          cx={cx}
          cy={cy}
          r={outerRadius + 8}
          fill="none"
          stroke="#1A212B"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Inner optical border */}
        <circle
          cx={cx}
          cy={cy}
          r={innerRadius - 8}
          fill="none"
          stroke="#1A212B"
          strokeWidth="1"
        />

        {/* 48 Knurled Aperture Segments */}
        {Array.from({ length: totalSegments }).map((_, i) => {
          const angleDeg = i * (360 / totalSegments) - 90;
          const angleRad = (angleDeg * Math.PI) / 180;

          const x1 = cx + innerRadius * Math.cos(angleRad);
          const y1 = cy + innerRadius * Math.sin(angleRad);
          const x2 = cx + outerRadius * Math.cos(angleRad);
          const y2 = cy + outerRadius * Math.sin(angleRad);

          const isFilled = i < filledCount;

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isFilled ? accentColor : unfilledColor}
              strokeWidth="3.2"
              strokeLinecap="round"
              className="transition-colors duration-150"
            />
          );
        })}
      </svg>

      {/* Center Digital Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div
          className="text-4xl font-bold font-mono tracking-tighter transition-colors duration-300"
          style={{ color: accentColor }}
        >
          {percentage}%
        </div>
        <div className="mt-1 text-[10px] font-mono tracking-[0.25em] text-[#8B96A5] uppercase">
          CONFIDENCE
        </div>
      </div>
    </div>
  );
}
