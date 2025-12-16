import { create } from "zustand";

export interface OcrItem {
  sequence: number;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface OcrResult {
  id: string;
  imageUrl: string;
  rawText: string;
  supplier?: string;
  date?: string;
  documentNumber?: string;
  items: OcrItem[];
  totalAmount: number;
  confidence: number;
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
}

interface OcrState {
  results: OcrResult[];
  selectedResultId: string | null;
  isProcessing: boolean;

  // Actions
  addResult: (result: OcrResult) => void;
  updateResult: (id: string, updates: Partial<OcrResult>) => void;
  removeResult: (id: string) => void;
  selectResult: (id: string | null) => void;
  updateResultItem: (resultId: string, sequence: number, updates: Partial<OcrItem>) => void;
  clearResults: () => void;
  setIsProcessing: (value: boolean) => void;
}

export const useOcrStore = create<OcrState>((set) => ({
  results: [],
  selectedResultId: null,
  isProcessing: false,

  addResult: (result) => {
    set((state) => ({
      results: [...state.results, result],
    }));
  },

  updateResult: (id, updates) => {
    set((state) => ({
      results: state.results.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    }));
  },

  removeResult: (id) => {
    set((state) => ({
      results: state.results.filter((r) => r.id !== id),
      selectedResultId: state.selectedResultId === id ? null : state.selectedResultId,
    }));
  },

  selectResult: (id) => {
    set({ selectedResultId: id });
  },

  updateResultItem: (resultId, sequence, updates) => {
    set((state) => ({
      results: state.results.map((r) =>
        r.id === resultId
          ? {
              ...r,
              items: r.items.map((item) =>
                item.sequence === sequence ? { ...item, ...updates } : item
              ),
            }
          : r
      ),
    }));
  },

  clearResults: () => {
    set({ results: [], selectedResultId: null });
  },

  setIsProcessing: (value) => {
    set({ isProcessing: value });
  },
}));
