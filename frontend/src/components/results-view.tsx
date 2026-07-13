"use client";

import React, { useState } from "react";
import type { PredictionResult } from "@/lib/api";
import { FocusRingGauge } from "@/components/focus-ring-gauge";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  RefreshCw,
  Scan,
} from "lucide-react";

interface ResultsViewProps {
  result: PredictionResult;
  uploadedImageUrl: string;
  onReset: () => void;
}

export function ResultsView({ result, uploadedImageUrl, onReset }: ResultsViewProps) {
  const [viewMode, setViewMode] = useState<"original" | "gradcam">("gradcam");

  const isCataract = result.disease_detected === "Cataract";
  const accentColor = isCataract ? "#F2A65A" : "#45D9C0";
  const accentTextClass = isCataract ? "text-[#F2A65A]" : "text-[#45D9C0]";
  const accentBorderClass = isCataract ? "border-[#F2A65A]/40" : "border-[#45D9C0]/40";
  const accentBgSubtleClass = isCataract ? "bg-[#F2A65A]/10" : "bg-[#45D9C0]/10";

  const heatmapSrc = `data:image/png;base64,${result.heatmap_base64}`;

  return (
    <div className="space-y-6 pb-8">
      {/* Page Title Row */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#E8ECF1]">
            Diagnostic Results
          </h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-[#8B96A5]">
            INSTRUMENT OUTPUT // SCAN ANALYSIS COMPLETE
          </p>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-md border border-[#232B36] bg-[#1A212B] px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-[#E8ECF1] transition-colors hover:border-[#2E3742] hover:bg-[#232B36] focus:outline-none focus:ring-2 focus:ring-[#45D9C0]/50"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#8B96A5]" />
          Analyze Another
        </button>
      </div>

      {/* Main Content: Two-Column Grid (3:2 ratio on desktop, collapses below 860px) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left Column (3 cols) — Scan Viewer Card */}
        <div className="flex flex-col rounded-xl border border-[#232B36] bg-[#12171F] p-5 shadow-lg lg:col-span-3">
          {/* Viewer Header + Pill Toggle */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[#8B96A5]">
              <Scan className="h-4 w-4 text-[#8B96A5]" />
              SCAN VIEWER
            </div>

            {/* Segmented Pill Toggle */}
            <div className="flex rounded-lg border border-[#232B36] bg-[#090C10] p-1">
              <button
                type="button"
                onClick={() => setViewMode("original")}
                className={`rounded-md px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-all ${
                  viewMode === "original"
                    ? "bg-[#1A212B] text-[#E8ECF1] shadow-sm border border-[#2E3742]"
                    : "text-[#8B96A5] hover:text-[#E8ECF1]"
                }`}
              >
                ORIGINAL
              </button>
              <button
                type="button"
                onClick={() => setViewMode("gradcam")}
                className={`rounded-md px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-all ${
                  viewMode === "gradcam"
                    ? "bg-[#1A212B] text-[#E8ECF1] shadow-sm border border-[#2E3742]"
                    : "text-[#8B96A5] hover:text-[#E8ECF1]"
                }`}
              >
                GRAD-CAM
              </button>
            </div>
          </div>

          {/* Large Single Image Viewport */}
          <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[#232B36] bg-[#090C10]">
            <img
              src={viewMode === "original" ? uploadedImageUrl : heatmapSrc}
              alt={viewMode === "original" ? "Original eye scan" : "Grad-CAM thermal heatmap"}
              className="h-full w-full object-contain transition-opacity duration-300"
            />

            {/* Optical instrument overlay badge */}
            <div className="absolute top-3 left-3 rounded border border-[#232B36] bg-[#090C10]/80 px-2.5 py-1 font-mono text-[10px] tracking-widest text-[#8B96A5] backdrop-blur-sm">
              OPTICS VIEW: {viewMode === "original" ? "RAW SPECTRUM" : "GRAD-CAM ACTIVATION"}
            </div>
          </div>

          {/* Horizontal Gradient Legend Bar (Visible when GRAD-CAM is active) */}
          {viewMode === "gradcam" && (
            <div className="mt-4 space-y-1.5 border-t border-[#232B36] pt-3">
              <div className="flex justify-between font-mono text-[10px] tracking-[0.2em] text-[#8B96A5]">
                <span>LOW ACTIVATION</span>
                <span>HIGH ACTIVATION</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-blue-600 via-teal-400 via-amber-400 to-red-500" />
            </div>
          )}
        </div>

        {/* Right Column (2 cols) — Diagnosis Card */}
        <div className="flex flex-col justify-between rounded-xl border border-[#232B36] bg-[#12171F] p-6 shadow-lg lg:col-span-2">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[#8B96A5]">
              DIAGNOSIS
            </div>

            {/* Focus-Ring Gauge */}
            <div className="my-2 flex justify-center">
              <FocusRingGauge
                confidence={result.confidence_score}
                isCataract={isCataract}
              />
            </div>

            {/* Diagnosis Display Type Label + Status Icon */}
            <div className="mt-2 flex flex-col items-center text-center">
              <div className="flex items-center gap-2.5">
                {isCataract ? (
                  <AlertTriangle className="h-6 w-6 text-[#F2A65A]" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-[#45D9C0]" />
                )}
                <h2
                  className="font-display text-2xl font-bold tracking-tight sm:text-3xl"
                  style={{ color: accentColor }}
                >
                  {isCataract ? "Cataract Detected" : "Clear Lens"}
                </h2>
              </div>

              {/* Severity Pill */}
              <div
                className={`mt-3 inline-flex items-center rounded-full border px-3.5 py-1 font-mono text-xs font-semibold uppercase tracking-widest ${accentTextClass} ${accentBorderClass} ${accentBgSubtleClass}`}
              >
                {isCataract ? `${result.severity.toUpperCase()} SEVERITY` : "HEALTHY READING"}
              </div>
            </div>
          </div>

          {/* Technical Instrumentation Footer Readouts */}
          <div className="mt-8 border-t border-[#232B36] pt-4 font-mono text-[11px] text-[#8B96A5]">
            <div className="flex justify-between py-1">
              <span>SCAN CLASSIFICATION</span>
              <span className="text-[#E8ECF1]">{result.disease_detected}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>MODEL CONFIDENCE</span>
              <span className="text-[#E8ECF1]">
                {(result.confidence_score * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Two-Column Row: AI Explanation + Recommendations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AI Explanation Card */}
        <div className="rounded-xl border border-[#232B36] bg-[#12171F] p-6 shadow-lg">
          <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#8B96A5]">
            AI EXPLANATION
          </div>
          <p className="font-sans text-sm leading-relaxed text-[#E8ECF1]/90">
            {result.explanation ||
              (isCataract
                ? "The AI model has detected signs consistent with cataract formation. The analysis highlights significant lens opacity and light scattering across the crystalline lens."
                : "The scan exhibits a clear crystalline lens structure without significant cortical, nuclear, or subcapsular opacification.")}
          </p>
        </div>

        {/* Recommendations Card */}
        <div className="rounded-xl border border-[#232B36] bg-[#12171F] p-6 shadow-lg">
          <div className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[#8B96A5]">
            CLINICAL ACTION PLAN
          </div>
          <ul className="space-y-3 font-sans text-sm text-[#E8ECF1]/90">
            {(result.recommendations && result.recommendations.length > 0
              ? result.recommendations
              : [
                  "Schedule a comprehensive clinical evaluation with a licensed ophthalmologist.",
                  "Perform slit-lamp biomicroscopy and visual acuity contrast testing.",
                ]
            ).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <ChevronRight
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: accentColor }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <footer className="pt-4 text-center font-mono text-[11px] tracking-wider text-[#5A6472]">
        OPTISCREEN v1.0 // THIS IS AN AI-ASSISTED SCREENING INSTRUMENT, NOT A DIAGNOSTIC SUBSTITUTE FOR A LICENSED PROFESSIONAL.
      </footer>
    </div>
  );
}
