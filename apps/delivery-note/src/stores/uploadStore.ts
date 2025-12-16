import { create } from "zustand";

export interface UploadedFile {
  id: string;
  file: File;
  url?: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
}

interface UploadState {
  files: UploadedFile[];
  isUploading: boolean;

  // Actions
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  updateFileStatus: (id: string, status: UploadedFile["status"], url?: string) => void;
  updateFileProgress: (id: string, progress: number) => void;
  setFileError: (id: string, error: string) => void;
  clearFiles: () => void;
  setIsUploading: (value: boolean) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  files: [],
  isUploading: false,

  addFiles: (files) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "pending",
      progress: 0,
    }));
    set((state) => ({ files: [...state.files, ...newFiles] }));
  },

  removeFile: (id) => {
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    }));
  },

  updateFileStatus: (id, status, url) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, status, url: url ?? f.url } : f
      ),
    }));
  },

  updateFileProgress: (id, progress) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, progress } : f
      ),
    }));
  },

  setFileError: (id, error) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, status: "error", error } : f
      ),
    }));
  },

  clearFiles: () => {
    set({ files: [] });
  },

  setIsUploading: (value) => {
    set({ isUploading: value });
  },
}));
