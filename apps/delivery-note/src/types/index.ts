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
  subCategory?: string;
  unit: string;
  specifications?: ProductSpecifications;
  keywords: string[];
  isActive: boolean;
}

export interface ProductSpecifications {
  type?: string;
  poles?: string;
  frame?: string;
  size?: string;
  rating?: string;
  [key: string]: string | undefined;
}

export interface ProductMapping {
  id: string;
  standardProductId: string;
  standardProduct?: StandardProduct;
  originalName: string;
  manufacturer?: string;
  pattern?: string;
  confidence: number;
  matchCount: number;
  isActive: boolean;
  createdAt: string;
}

// Supplier Types
export interface Supplier {
  id: string;
  name: string;
  code?: string;
  contact?: string;
  address?: string;
  memo?: string;
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
