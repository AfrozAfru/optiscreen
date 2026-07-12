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
      {!result && (
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-clinical-indigo-light p-2.5">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Cataract Screening</h1>
              <p className="text-sm text-muted-foreground">
                Upload a fundus or slit-lamp image for AI-powered analysis
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
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Upload Eye Image</CardTitle>
            <CardDescription>
              Select a high-quality fundus photograph or slit-lamp image for analysis.
              The AI model will detect potential cataract indicators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadZone
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
              error={error}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
