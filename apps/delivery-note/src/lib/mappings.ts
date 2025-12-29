import { supabase } from "@/lib/supabase";
import type { ProductMapping, StandardProduct } from "@/types";

/**
 * 품목명 정규화 (비교용)
 * - 소문자 변환
 * - 앞뒤 공백 제거
 * - 연속 공백을 단일 공백으로
 * - 괄호 앞 공백 제거: "침대 시트 (D)" -> "침대 시트(D)"
 */
export function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")           // 연속 공백 -> 단일 공백
    .replace(/\s+\(/g, "(")         // " (" -> "("
    .replace(/\)\s+/g, ")")         // ") " -> ")"
    .replace(/\s+\)/g, ")");        // " )" -> ")"
}

/**
 * 특정 공급업체의 매핑 목록 조회
 */
export async function getMappingsBySupplier(
  supplierId: string
): Promise<ProductMapping[]> {
  const { data, error } = await supabase
    .from("product_mappings")
    .select(
      `
      *,
      standard_products (*)
    `
    )
    .eq("supplier_id", supplierId)
    .order("original_name", { ascending: true });

  if (error) {
    console.error("매핑 조회 오류:", error);
    return [];
  }

  return data.map(mapDbToMapping);
}

/**
 * 매핑 생성
 */
export async function createMapping(
  supplierId: string,
  originalName: string,
  standardProductId: string
): Promise<ProductMapping | null> {
  const { data, error } = await supabase
    .from("product_mappings")
    .insert({
      supplier_id: supplierId,
      original_name: originalName,
      standard_product_id: standardProductId,
    })
    .select(
      `
      *,
      standard_products (*)
    `
    )
    .single();

  if (error) {
    console.error("매핑 생성 오류:", error);
    throw new Error(
      error.code === "23505"
        ? "이미 존재하는 매핑입니다."
        : "매핑 생성에 실패했습니다."
    );
  }

  return mapDbToMapping(data);
}

/**
 * 매핑 수정
 */
export async function updateMapping(
  id: string,
  standardProductId: string
): Promise<ProductMapping | null> {
  const { data, error } = await supabase
    .from("product_mappings")
    .update({ standard_product_id: standardProductId })
    .eq("id", id)
    .select(
      `
      *,
      standard_products (*)
    `
    )
    .single();

  if (error) {
    console.error("매핑 수정 오류:", error);
    throw new Error("매핑 수정에 실패했습니다.");
  }

  return mapDbToMapping(data);
}

/**
 * 매핑 삭제
 */
export async function deleteMapping(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("product_mappings")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("매핑 삭제 오류:", error);
    return false;
  }

  return true;
}

/**
 * 특정 공급업체의 원본 품목명으로 매핑 조회
 */
export async function findMapping(
  supplierId: string,
  originalName: string
): Promise<ProductMapping | null> {
  const { data, error } = await supabase
    .from("product_mappings")
    .select(
      `
      *,
      standard_products (*)
    `
    )
    .eq("supplier_id", supplierId)
    .eq("original_name", originalName)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // 결과 없음
      return null;
    }
    console.error("매핑 조회 오류:", error);
    return null;
  }

  return mapDbToMapping(data);
}

/**
 * OCR 결과 품목들에 매핑 적용
 */
export interface MappedItem {
  originalName: string;
  quantity: number;
  unit: string;
  standardProductId?: string;
  standardProductName?: string;
  isMapped: boolean;
}

export async function applyMappings(
  supplierId: string,
  items: Array<{ name: string; quantity: number; unit?: string }>
): Promise<MappedItem[]> {
  // 해당 공급업체의 모든 매핑을 한 번에 조회
  const mappings = await getMappingsBySupplier(supplierId);

  // 매핑을 원본 품목명으로 인덱싱
  const mappingMap = new Map<string, ProductMapping>();
  for (const mapping of mappings) {
    mappingMap.set(mapping.originalName.toLowerCase(), mapping);
  }

  // 각 품목에 매핑 적용
  return items.map((item) => {
    const mapping = mappingMap.get(item.name.toLowerCase());

    return {
      originalName: item.name,
      quantity: item.quantity,
      unit: item.unit || "EA",
      standardProductId: mapping?.standardProductId,
      standardProductName: mapping?.standardProduct?.name,
      isMapped: !!mapping,
    };
  });
}

/**
 * 이전 OCR 스캔에서 매핑 정보 가져오기 (product_mappings 테이블이 비어있을 때 fallback)
 * 표준품목 ID로 현재 이름 조회하여 최신 이름 사용
 */
export async function getMappingsFromHistory(
  supplierId: string
): Promise<Map<string, { standardProductId: string; standardProductName: string }>> {
  // 1. 이전 OCR 스캔에서 매핑된 품목 가져오기
  const { data: scansData, error: scansError } = await supabase
    .from("ocr_scans")
    .select("items")
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (scansError || !scansData) {
    console.error("이전 매핑 조회 오류:", scansError);
    return new Map();
  }

  // items에서 매핑된 것들 추출 (standardProductId 기준)
  const tempMap = new Map<string, string>(); // normalizedName -> standardProductId
  const productIds = new Set<string>();

  for (const scan of scansData) {
    const items = scan.items as Array<{
      name: string;
      standardProductId?: string;
      standardProductName?: string;
    }>;

    if (!items) continue;

    for (const item of items) {
      if (item.standardProductId) {
        const key = normalizeItemName(item.name);
        if (!tempMap.has(key)) {
          tempMap.set(key, item.standardProductId);
          productIds.add(item.standardProductId);
        }
      }
    }
  }

  if (productIds.size === 0) {
    return new Map();
  }

  // 2. 표준품목 현재 이름 조회
  const { data: productsData, error: productsError } = await supabase
    .from("standard_products")
    .select("id, name")
    .in("id", Array.from(productIds));

  if (productsError || !productsData) {
    console.error("표준품목 조회 오류:", productsError);
    return new Map();
  }

  const productNameMap = new Map<string, string>();
  for (const product of productsData) {
    productNameMap.set(product.id, product.name);
  }

  // 3. 최종 매핑 맵 생성
  const mappingMap = new Map<string, { standardProductId: string; standardProductName: string }>();
  for (const [normalizedName, productId] of tempMap) {
    const productName = productNameMap.get(productId);
    if (productName) {
      mappingMap.set(normalizedName, {
        standardProductId: productId,
        standardProductName: productName,
      });
    }
  }

  return mappingMap;
}

/**
 * 매핑 일괄 저장 (저장 시 product_mappings 테이블에도 저장)
 */
export async function saveMappings(
  supplierId: string,
  items: Array<{ name: string; standardProductId?: string }>
): Promise<void> {
  const mappingsToSave = items
    .filter((item) => item.standardProductId)
    .map((item) => ({
      supplier_id: supplierId,
      original_name: item.name.trim(),
      standard_product_id: item.standardProductId,
    }));

  if (mappingsToSave.length === 0) return;

  // upsert로 중복 처리
  const { error } = await supabase
    .from("product_mappings")
    .upsert(mappingsToSave, {
      onConflict: "supplier_id,original_name",
    });

  if (error) {
    console.error("매핑 저장 오류:", error);
  }
}

/**
 * DB 레코드를 ProductMapping 타입으로 변환
 */
function mapDbToMapping(data: Record<string, unknown>): ProductMapping {
  const standardProduct = data.standard_products as Record<string, unknown> | null;

  return {
    id: data.id as string,
    supplierId: data.supplier_id as string,
    standardProductId: data.standard_product_id as string,
    originalName: data.original_name as string,
    standardProduct: standardProduct
      ? {
          id: standardProduct.id as string,
          name: standardProduct.name as string,
          category: standardProduct.category as string | undefined,
          unit: standardProduct.unit as string,
          sortOrder: standardProduct.sort_order as number,
          isActive: standardProduct.is_active as boolean,
        }
      : undefined,
    createdAt: data.created_at as string | undefined,
    updatedAt: data.updated_at as string | undefined,
  };
}
