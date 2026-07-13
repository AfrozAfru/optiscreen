"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { predictImage, type PredictionResult } from "@/lib/api";
import { UploadZone } from "@/components/upload-zone";
import { ResultsView } from "@/components/results-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

export default function DashboardPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("anonymous");

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, [supabase]);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setError(null);

    // Create a local preview URL
    const previewUrl = URL.createObjectURL(file);
    setUploadedImageUrl(previewUrl);

    try {
      const prediction = await predictImage(file, userId);
      setResult(prediction);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed. Please try again.";
      setError(message);
      setUploadedImageUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    setResult(null);
    setUploadedImageUrl(null);
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      {/* Page header */}
      {!result && (
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-[#232B36] bg-[#1A212B] p-2.5">
              <Stethoscope className="h-5 w-5 text-[#45D9C0]" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#E8ECF1]">
                Cataract Screening Instrument
              </h1>
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#8B96A5]">
                OPTICAL SCAN INGESTION // CLINICAL AI MODULE
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {result && uploadedImageUrl ? (
        <ResultsView
          result={result}
          uploadedImageUrl={uploadedImageUrl}
          onReset={handleReset}
        />
      ) : (
        <div className="rounded-xl border border-[#232B36] bg-[#12171F] p-6 shadow-xl">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-[#E8ECF1]">
              Upload Eye Scan
            </h2>
            <p className="mt-1 font-sans text-sm text-[#8B96A5]">
              Select a high-resolution fundus photograph or direct anterior slit-lamp image for instant deep learning analysis.
            </p>
          </div>
          <UploadZone
            onFileSelect={handleFileSelect}
            isUploading={isUploading}
            error={error}
          />
        </div>
      )}
    </div>
  );
}
