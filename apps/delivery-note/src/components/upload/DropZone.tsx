"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUploadStore, type UploadedFile } from "@/stores/uploadStore";

const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/pdf": [".pdf"],
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function DropZone() {
  const { files, addFiles, removeFile } = useUploadStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addFiles(acceptedFiles);
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
  });

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
              isDragActive ? "bg-primary/10" : "bg-muted"
            )}
          >
            <Upload
              className={cn(
                "w-8 h-8",
                isDragActive ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div>
            <p className="text-lg font-medium">
              {isDragActive
                ? "파일을 여기에 놓으세요"
                : "거래명세서 이미지를 업로드하세요"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              드래그 앤 드롭 또는 클릭하여 파일 선택
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG, PDF (최대 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">업로드된 파일 ({files.length})</h3>
          <div className="space-y-2">
            {files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FileItem({
  file,
  onRemove,
}: {
  file: UploadedFile;
  onRemove: () => void;
}) {
  const StatusIcon = {
    pending: Image,
    uploading: Loader2,
    completed: CheckCircle,
    error: AlertCircle,
  }[file.status];

  const statusColor = {
    pending: "text-muted-foreground",
    uploading: "text-primary animate-spin",
    completed: "text-green-500",
    error: "text-destructive",
  }[file.status];

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <StatusIcon className={cn("w-5 h-5 flex-shrink-0", statusColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(file.file.size / 1024 / 1024).toFixed(2)} MB
          {file.status === "uploading" && ` • ${file.progress}%`}
          {file.error && ` • ${file.error}`}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 h-8 w-8"
        onClick={onRemove}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
