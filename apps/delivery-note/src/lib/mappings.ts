import { supabase } from "@/lib/supabase";
import type { ProductMapping, StandardProduct } from "@/types";

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
