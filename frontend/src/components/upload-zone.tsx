"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Upload, ImagePlus, Loader2, AlertCircle, X } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  error?: string | null;
  className?: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

export function UploadZone({
  onFileSelect,
  isUploading = false,
  error = null,
  className,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setValidationError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setValidationError("Invalid file type. Please upload a JPG, PNG, or WebP image.");
      return false;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setValidationError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      return false;
    }
    return true;
  };

  const handleFile = useCallback(
    (file: File) => {
      if (!validateFile(file)) return;

      // Create preview
      const url = URL.createObjectURL(file);
      setPreview(url);
      setFileName(file.name);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const clearSelection = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const displayError = error || validationError;

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-300",
          isDragging
            ? "border-[#45D9C0] bg-[#1A212B] scale-[1.01]"
            : "border-[#232B36] bg-[#090C10] hover:border-[#2E3742] hover:bg-[#1A212B]/40",
          isUploading && "pointer-events-none opacity-70",
          displayError && "border-red-500/40 bg-red-500/5"
        )}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          /* Uploading state */
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-clinical-indigo-light p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Analyzing image...</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Running AI-powered cataract detection
              </p>
            </div>
          </div>
        ) : preview ? (
          /* Preview state */
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="h-40 w-40 rounded-xl object-cover shadow-md"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
                className="absolute -right-2 -top-2 rounded-full bg-foreground/80 p-1 text-background shadow-sm hover:bg-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{fileName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Click to change or drop a new image
              </p>
            </div>
          </div>
        ) : (
          /* Default idle state */
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              "rounded-2xl p-5 transition-colors duration-300",
              isDragging ? "bg-primary/10" : "bg-surface"
            )}>
              {isDragging ? (
                <ImagePlus className="h-10 w-10 text-primary" />
              ) : (
                <Upload className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">
                {isDragging ? "Drop your image here" : "Upload eye scan image"}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Drag and drop or{" "}
                <span className="font-medium text-primary">browse files</span>
              </p>
              <p className="mt-3 text-xs text-muted-foreground/70">
                Supports JPG, PNG, WebP · Max {MAX_SIZE_MB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {displayError && (
        <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{displayError}</p>
        </div>
      )}
    </div>
  );
}
