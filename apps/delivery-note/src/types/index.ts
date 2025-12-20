// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Transaction Types
export interface TransactionItem {
  id: string;
  sequence: number;
  originalName: string;
  convertedName?: string;
  standardProductId?: string;
  standardProduct?: StandardProduct;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  matchConfidence?: number;
  isManualMatch: boolean;
}

export interface Transaction {
  id: string;
  supplierId?: string;
  supplier?: Supplier;
  transactionDate: string;
  documentNumber?: string;
  imageUrl?: string;
  items: TransactionItem[];
  totalAmount: number;
  itemCount: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus =
  | "pending"
  | "processing"
  | "converted"
  | "confirmed"
  | "exported";

// Product Types
export interface StandardProduct {
  id: string;
  name: string;
  category?: string;
  unit: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductMapping {
  id: string;
  supplierId: string;
  supplier?: Supplier;
  standardProductId: string;
  standardProduct?: StandardProduct;
  originalName: string;
  createdAt?: string;
  updatedAt?: string;
}

// Supplier Types
export interface Supplier {
  id: string;
  name: string;
  memo?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Store Types (지점)
export interface Store {
  id: string;
  name: string;
  memo?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// OCR Types
export interface OcrParsedItem {
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
  parsedData: {
    supplier?: string;
    date?: string;
    documentNumber?: string;
    items: OcrParsedItem[];
    totalAmount: number;
  };
  confidence: number;
  processedAt: string;
}

// Convert Types
export interface ConvertRequest {
  items: Array<{
    originalName: string;
    manufacturer?: string;
  }>;
}

export interface ConvertResult {
  originalName: string;
  convertedName?: string;
  standardProductId?: string;
  matchType: "exact" | "ai" | "none";
  confidence: number;
  mappingId?: string;
  suggestions?: Array<{
    name: string;
    confidence: number;
  }>;
}

export interface ConvertResponse {
  results: ConvertResult[];
  summary: {
    total: number;
    exactMatch: number;
    aiMatch: number;
    noMatch: number;
  };
}

// Filter Types
export interface TransactionFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  status?: TransactionStatus;
  search?: string;
}

export interface MappingFilters {
  page?: number;
  limit?: number;
  search?: string;
  manufacturer?: string;
  standardProductId?: string;
  isActive?: boolean;
}
