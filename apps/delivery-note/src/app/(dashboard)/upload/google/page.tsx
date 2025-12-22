"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  Plus,
  Check,
  Loader2,
  CalendarDays,
  Trash2,
  Scan,
  X,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { DropZone } from "@/components/upload/DropZone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Autocomplete } from "@/components/ui/autocomplete";
import { useUploadStore } from "@/stores/uploadStore";
import {
  useGoogleVisionUsage,
  GOOGLE_VISION_MONTHLY_LIMIT,
} from "@/hooks/useApiUsage";
import {
  extractTextFromImage,
  parseInvoiceText,
  saveOcrScan,
  type OcrResult,
  type ParsedInvoice,
} from "@/lib/ocr";
import { getStandardProducts } from "@/lib/products";
import { getSuppliers, createSupplier } from "@/lib/suppliers";
import { getStores, createStore } from "@/lib/stores";
import { uploadImage } from "@/lib/imageServer";
import type { StandardProduct, Supplier, Store } from "@/types";

// 품목 아이템
interface ItemEntry {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  standardProductId?: string;
  originalQuantityText?: string;
  wasQuantityCorrected?: boolean;
}

export default function GoogleUploadPage() {
  const { files, clearFiles } = useUploadStore();
  const {
    remaining,
    limitReached,
    increment,
    isLoading: isUsageLoading,
  } = useGoogleVisionUsage();

  // 표준 품목
  const [standardProducts, setStandardProducts] = useState<StandardProduct[]>([]);

  // 공급업체
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>(""); // 직접 입력용

  // 지점
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [storeName, setStoreName] = useState<string>(""); // 직접 입력용

  // OCR 관련 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 필드별 에러 상태
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);

  // 추가 모드 상태
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newStoreName, setNewStoreName] = useState("");

  // 품목 상태 - 기본으로 빈 행 하나 표시
  const [items, setItems] = useState<ItemEntry[]>([
    { id: crypto.randomUUID(), name: "", quantity: 0, unit: "EA" },
  ]);
  const [documentDate, setDocumentDate] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [ocrTextOpen, setOcrTextOpen] = useState(false);

  const hasFiles = files.length > 0;
  const firstFile = files[0];

  // 데이터 로드
  useEffect(() => {
    Promise.all([getStandardProducts(), getSuppliers(), getStores()]).then(
      ([productsData, suppliersData, storesData]) => {
        setStandardProducts(productsData);
        setSuppliers(suppliersData);
        setStores(storesData);
      }
    );
  }, []);

  // 이미지 URL 생성
  useEffect(() => {
    if (firstFile?.file) {
      const url = URL.createObjectURL(firstFile.file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImageUrl(null);
    }
  }, [firstFile]);

  // OCR 처리
  async function handleOcr() {
    if (!firstFile?.file) return;

    const result = await increment();
    if (!result.success) {
      setError(
        `이번 달 사용 한도(${GOOGLE_VISION_MONTHLY_LIMIT}건)에 도달했습니다.`
      );
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const ocrResult = await extractTextFromImage(
        firstFile.file,
        "google",
        (percent) => setProgress(percent)
      );
      setOcrResult(ocrResult);
      setOcrText(ocrResult.text || "");

      const parsed = parseInvoiceText(ocrResult);
      setDocumentDate(parsed.date || "");

      // 공급업체 자동 매칭 (공급자 상호)
      if (parsed.supplier) {
        const matchedSupplier = suppliers.find(
          (s) => s.name.toLowerCase().includes(parsed.supplier!.toLowerCase()) ||
                 parsed.supplier!.toLowerCase().includes(s.name.toLowerCase())
        );
        if (matchedSupplier) {
          setSelectedSupplierId(matchedSupplier.id);
          setSupplierName(matchedSupplier.name);
          setIsAddingSupplier(false);
          console.log("공급업체 자동 매칭:", matchedSupplier.name);
        } else {
          // 매칭 안됨 → 추가 폼 열기
          setSelectedSupplierId("");
          setNewSupplierName(parsed.supplier);
          setIsAddingSupplier(true);
          console.log("공급업체 추가 필요:", parsed.supplier);
        }
      }

      // 지점 자동 매칭 (공급받는자 상호)
      if (parsed.storeName) {
        const matchedStore = stores.find(
          (s) => s.name.toLowerCase().includes(parsed.storeName!.toLowerCase()) ||
                 parsed.storeName!.toLowerCase().includes(s.name.toLowerCase())
        );
        if (matchedStore) {
          setSelectedStoreId(matchedStore.id);
          setStoreName(matchedStore.name);
          setIsAddingStore(false);
          console.log("지점 자동 매칭:", matchedStore.name);
        } else {
          // 매칭 안됨 → 추가 폼 열기
          setSelectedStoreId("");
          setNewStoreName(parsed.storeName);
          setIsAddingStore(true);
          console.log("지점 추가 필요:", parsed.storeName);
        }
      }

      // OCR 결과로 품목 목록 생성
      const newItems: ItemEntry[] = parsed.items.map((item) => ({
        id: crypto.randomUUID(),
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || "EA",
        originalQuantityText: item.originalQuantityText,
        wasQuantityCorrected: item.wasQuantityCorrected,
      }));

      setItems(newItems);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "OCR 처리 중 오류가 발생했습니다."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  // 저장
  async function handleSave() {
    // 1. 품목 검증
    const validItems = items.filter((item) => item.name.trim());
    if (validItems.length === 0) {
      setError("저장할 품목이 없습니다. 품목명을 입력해주세요.");
      return;
    }

    // 2. 공급업체/지점 검증 (필수) - 셀렉트박스에서 선택 필수
    let hasFieldError = false;

    if (!selectedSupplierId) {
      setSupplierError("공급업체를 선택해주세요");
      hasFieldError = true;
    } else {
      setSupplierError(null);
    }

    if (!selectedStoreId) {
      setStoreError("지점을 선택해주세요");
      hasFieldError = true;
    } else {
      setStoreError(null);
    }

    if (hasFieldError) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const finalSupplierId = selectedSupplierId;
      const finalStoreId = selectedStoreId;

      // 이미지 업로드 (파일이 있는 경우)
      let imageUrl: string | undefined;
      if (firstFile?.file) {
        const uploadResult = await uploadImage(firstFile.file);
        if (uploadResult.success && uploadResult.url) {
          imageUrl = uploadResult.url;
        } else {
          console.warn("이미지 업로드 실패:", uploadResult.error);
          // 이미지 업로드 실패해도 데이터는 저장 진행
        }
      }

      // 6. 데이터 저장
      const parsedData: ParsedInvoice = {
        date: documentDate,
        documentNumber: undefined,
        items: validItems.map((item, index) => ({
          sequence: index + 1,
          name: item.name.trim(),
          quantity: item.quantity || 0,
          unit: item.unit || "EA",
          unitPrice: 0,
          amount: 0,
          raw: `${item.name}: ${item.quantity}`,
        })),
        totalAmount: undefined,
      };

      const ocrData: OcrResult = ocrResult || {
        text: "",
        confidence: 0,
        lines: [],
      };

      const saveResult = await saveOcrScan(
        ocrData,
        parsedData,
        "google",
        finalSupplierId,
        finalStoreId || undefined,
        imageUrl
      );

      if (saveResult.success) {
        setSaveSuccess(true);
      } else {
        setError(saveResult.error || "저장에 실패했습니다.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  // 초기화
  function handleReset() {
    setOcrResult(null);
    setOcrText("");
    setError(null);
    setSupplierError(null);
    setStoreError(null);
    setProgress(0);
    setItems([{ id: crypto.randomUUID(), name: "", quantity: 0, unit: "EA" }]);
    setDocumentDate("");
    setSelectedSupplierId("");
    setSupplierName("");
    setSelectedStoreId("");
    setStoreName("");
    setSaveSuccess(false);
    setIsAddingSupplier(false);
    setIsAddingStore(false);
    setNewSupplierName("");
    setNewStoreName("");
    clearFiles();
  }

  // 공급업체 추가
  async function handleAddSupplier() {
    if (!newSupplierName.trim()) return;

    // 중복 체크
    const existing = suppliers.find(
      (s) => s.name.toLowerCase() === newSupplierName.trim().toLowerCase()
    );
    if (existing) {
      setSelectedSupplierId(existing.id);
      setSupplierName(existing.name);
      setIsAddingSupplier(false);
      setNewSupplierName("");
      return;
    }

    const newSupplier = await createSupplier({ name: newSupplierName.trim() });
    if (newSupplier) {
      setSuppliers([...suppliers, newSupplier]);
      setSelectedSupplierId(newSupplier.id);
      setSupplierName(newSupplier.name);
    }
    setIsAddingSupplier(false);
    setNewSupplierName("");
  }

  // 지점 추가
  async function handleAddStore() {
    if (!newStoreName.trim()) return;

    // 중복 체크
    const existing = stores.find(
      (s) => s.name.toLowerCase() === newStoreName.trim().toLowerCase()
    );
    if (existing) {
      setSelectedStoreId(existing.id);
      setStoreName(existing.name);
      setIsAddingStore(false);
      setNewStoreName("");
      return;
    }

    const newStore = await createStore({ name: newStoreName.trim() });
    if (newStore) {
      setStores([...stores, newStore]);
      setSelectedStoreId(newStore.id);
      setStoreName(newStore.name);
    }
    setIsAddingStore(false);
    setNewStoreName("");
  }

  // 품목 추가
  function addItem() {
    setItems([
      ...items,
      { id: crypto.randomUUID(), name: "", quantity: 0, unit: "EA" },
    ]);
  }

  // 품목 수정
  function updateItem(id: string, field: "name" | "quantity" | "standardProductId", value: string) {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        if (field === "quantity") {
          return { ...item, quantity: parseInt(value, 10) || 0 };
        }
        if (field === "standardProductId") {
          return { ...item, standardProductId: value || undefined };
        }
        return { ...item, name: value };
      })
    );
  }

  // 품목 삭제
  function removeItem(id: string) {
    setItems(items.filter((item) => item.id !== id));
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/upload">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Google Vision OCR</h1>
            <p className="text-muted-foreground mt-1">
              이미지에서 자동으로 텍스트를 추출합니다
            </p>
          </div>
        </div>
        {(hasFiles || items.length > 0) && (
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            초기화
          </Button>
        )}
      </div>

      {/* 사용량 표시 */}
      {!isUsageLoading && (
        <div
          className={`p-4 rounded-lg border ${
            limitReached
              ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900"
              : remaining <= 100
                ? "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900"
                : "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {limitReached && (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">이번 달 남은 사용량</span>
            </div>
            <span
              className={`text-lg font-bold ${
                limitReached
                  ? "text-red-600"
                  : remaining <= 100
                    ? "text-orange-600"
                    : "text-blue-600"
              }`}
            >
              {remaining} / {GOOGLE_VISION_MONTHLY_LIMIT}건
            </span>
          </div>
        </div>
      )}

      {/* 메인 레이아웃: 왼쪽 이미지 | 오른쪽 품목 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 이미지 업로드 / 미리보기 */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">이미지</CardTitle>
              <CardDescription>
                거래명세서 이미지를 업로드하고 OCR로 텍스트를 추출하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              {imageUrl ? (
                <div className="space-y-4">
                  <div className="relative border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt="거래명세서"
                      className={`w-full object-contain max-h-[60vh] transition-opacity ${
                        isProcessing ? "opacity-80" : ""
                      }`}
                    />
                    {/* 스캔 애니메이션 */}
                    {isProcessing && (
                      <>
                        {/* 스캔 라인 */}
                        <div
                          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan-line"
                          style={{
                            boxShadow: "0 0 20px 5px rgba(59, 130, 246, 0.5)",
                          }}
                        />
                        {/* 오버레이 그리드 효과 */}
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-blue-500/5 pointer-events-none" />
                        {/* 진행률 표시 */}
                        <div className="absolute bottom-2 left-2 right-2 bg-black/60 rounded-lg px-3 py-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-white font-medium">
                            {progress}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    onClick={handleOcr}
                    disabled={isProcessing || limitReached}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Scan className="w-4 h-4 mr-2 animate-pulse" />
                        스캔 중...
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4 mr-2" />
                        거래명세서에서 텍스트 추출
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <DropZone />
              )}
            </CardContent>
          </Card>

          {/* OCR 원본 텍스트 (아코디언) */}
          {ocrText && (
            <Card>
              <button
                onClick={() => setOcrTextOpen(!ocrTextOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="text-base font-semibold">OCR 원본 텍스트</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                    ocrTextOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  ocrTextOpen ? "max-h-96" : "max-h-0"
                }`}
              >
                <CardContent className="pt-0">
                  <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded-lg max-h-48 overflow-auto">
                    {ocrText}
                  </pre>
                </CardContent>
              </div>
            </Card>
          )}
        </div>

        {/* 오른쪽: 품목 목록 */}
        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="text-base">품목 목록</CardTitle>
              <CardDescription>
                거래명세서에서 추출하거나 수동으로 입력하세요
              </CardDescription>
            </div>

            {/* 공급업체 */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground w-20 shrink-0">공급업체</label>
              <div className="relative flex-1">
                {isAddingSupplier ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSupplier()}
                      placeholder="새 공급업체명"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddSupplier}
                      className="px-3"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingSupplier(false);
                        setNewSupplierName("");
                      }}
                      className="px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Autocomplete
                      options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                      value={selectedSupplierId}
                      onValueChange={(value) => {
                        setSelectedSupplierId(value);
                        setSupplierError(null);
                        const selected = suppliers.find(s => s.id === value);
                        setSupplierName(selected?.name || "");
                      }}
                      placeholder="공급업체 검색..."
                      emptyText="검색 결과 없음"
                      className="flex-1"
                      error={!!supplierError}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsAddingSupplier(true)}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {/* 툴팁 */}
                {supplierError && (
                  <div className="absolute left-0 -bottom-7 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
                    {supplierError}
                  </div>
                )}
              </div>
            </div>

            {/* 지점 */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground w-20 shrink-0">지점</label>
              <div className="relative flex-1">
                {isAddingStore ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddStore()}
                      placeholder="새 지점명"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddStore}
                      className="px-3"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingStore(false);
                        setNewStoreName("");
                      }}
                      className="px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Autocomplete
                      options={stores.map(s => ({ value: s.id, label: s.name }))}
                      value={selectedStoreId}
                      onValueChange={(value) => {
                        setSelectedStoreId(value);
                        setStoreError(null);
                        const selected = stores.find(s => s.id === value);
                        setStoreName(selected?.name || "");
                      }}
                      placeholder="지점 검색..."
                      emptyText="검색 결과 없음"
                      className="flex-1"
                      error={!!storeError}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsAddingStore(true)}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {/* 툴팁 */}
                {storeError && (
                  <div className="absolute left-0 -bottom-7 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
                    {storeError}
                  </div>
                )}
              </div>
            </div>

            {/* 날짜 */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground w-20 shrink-0">날짜</label>
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className="text-sm bg-transparent outline-none"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded-lg border bg-card"
              >
                <span className="w-5 text-xs text-muted-foreground text-center shrink-0">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  placeholder="품목명"
                  className="w-28 px-2 py-1.5 border rounded-md text-sm"
                />
                <span className="text-muted-foreground shrink-0">→</span>
                <select
                  value={item.standardProductId || ""}
                  onChange={(e) => updateItem(item.id, "standardProductId", e.target.value)}
                  className={`flex-1 px-2 py-1.5 border rounded-md text-sm ${
                    item.standardProductId
                      ? "bg-green-50 border-green-300"
                      : "bg-background"
                  }`}
                >
                  <option value="">표준 품목</option>
                  {standardProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <div className="relative shrink-0">
                  <input
                    type="number"
                    value={item.quantity || ""}
                    onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                    placeholder="수량"
                    className={`w-16 px-2 py-1.5 border rounded-md text-sm text-right ${
                      item.wasQuantityCorrected ? "border-blue-300 bg-blue-50" : ""
                    }`}
                  />
                  {item.wasQuantityCorrected && item.originalQuantityText && (
                    <span
                      title={`OCR 원본: "${item.originalQuantityText}" → "${item.quantity}"`}
                      className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full cursor-help"
                    >
                      {item.originalQuantityText}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  className="text-muted-foreground hover:text-destructive h-7 w-7 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addItem} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              품목 추가
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 성공 메시지 */}
      {saveSuccess && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/30">
          <CardContent className="pt-6">
            <p className="text-sm text-green-600">저장되었습니다!</p>
          </CardContent>
        </Card>
      )}

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={items.length === 0 || isSaving || saveSuccess}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              저장 완료
            </>
          ) : (
            "저장하기"
          )}
        </Button>
      </div>
    </div>
  );
}
