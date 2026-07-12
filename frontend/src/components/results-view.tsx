"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ConfidenceMeter } from "@/components/confidence-meter";
import type { PredictionResult } from "@/lib/api";
import {
  Activity,
  Brain,
  CheckCircle2,
  FileImage,
  RefreshCw,
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  CircleAlert,
} from "lucide-react";

interface ResultsViewProps {
  result: PredictionResult;
  uploadedImageUrl: string;
  onReset: () => void;
}

export function ResultsView({ result, uploadedImageUrl, onReset }: ResultsViewProps) {
  const isCataract = result.disease_detected === "Cataract";

  const severityConfig = {
    None: { variant: "success" as const, icon: ShieldCheck, color: "text-clinical-emerald" },
    Mild: { variant: "warning" as const, icon: AlertTriangle, color: "text-clinical-amber" },
    Moderate: { variant: "warning" as const, icon: CircleAlert, color: "text-clinical-amber" },
    Severe: { variant: "danger" as const, icon: CircleAlert, color: "text-clinical-red" },
  };

  const config = severityConfig[result.severity as keyof typeof severityConfig] || severityConfig.None;
  const SeverityIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Diagnostic Results</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-powered analysis complete. Review findings below.
          </p>
        </div>
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Analyze Another
        </Button>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Cell 1: Image Comparison (spans 2 cols) */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileImage className="h-4 w-4 text-primary" />
              Image Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Original Scan
                </p>
                <div className="overflow-hidden rounded-xl border border-border">
                  <img
                    src={uploadedImageUrl}
                    alt="Original eye scan"
                    className="aspect-square w-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Grad-CAM Heatmap
                </p>
                <div className="overflow-hidden rounded-xl border border-border">
                  <img
                    src={`data:image/png;base64,${result.heatmap_base64}`}
                    alt="Grad-CAM heatmap overlay"
                    className="aspect-square w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cell 2: Confidence Meter (1 col) */}
        <Card className="flex flex-col items-center justify-center">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Model Confidence
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <ConfidenceMeter value={result.confidence_score} />
          </CardContent>
        </Card>

        {/* Cell 3: Diagnosis Card (1 col) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-4 w-4 text-primary" />
              Diagnosis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Condition Detected
              </p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-foreground">
                  {result.disease_detected}
                </span>
                <Badge variant={isCataract ? "danger" : "success"}>
                  {isCataract ? "Detected" : "Clear"}
                </Badge>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Severity Level
              </p>
              <div className="flex items-center gap-2">
                <SeverityIcon className={`h-5 w-5 ${config.color}`} />
                <span className="text-lg font-semibold text-foreground">
                  {result.severity}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cell 4: AI Explanation (spans 2 cols) */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-primary" />
              AI Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {result.explanation}
            </p>
          </CardContent>
        </Card>

        {/* Cell 5: Recommendations (spans full width on lg, 1 col on md) */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-clinical-emerald" />
              Clinical Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-clinical-emerald-light">
                    <CheckCircle2 className="h-3 w-3 text-clinical-emerald" />
                  </div>
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {rec}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Clinical Disclaimer */}
      <div className="rounded-xl border border-border/60 bg-surface px-6 py-4">
        <p className="text-xs text-muted-foreground/80">
          <span className="font-semibold">Disclaimer:</span> This AI-generated analysis is for
          clinical decision support purposes only. It does not constitute a medical diagnosis.
          Always consult a qualified ophthalmologist for definitive assessment and treatment
          recommendations.
        </p>
      </div>
    </div>
  );
}
