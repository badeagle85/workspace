import { supabase } from "@/lib/supabase";
import type { StandardProduct } from "@/types";

/**
 * 표준 품목 목록 조회
 */
export async function getStandardProducts(): Promise<StandardProduct[]> {
  const { data, error } = await supabase
    .from("standard_products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("표준 품목 조회 오류:", error);
    return [];
  }

  return data.map(mapDbToProduct);
}

/**
 * 표준 품목 단건 조회
 */
export async function getStandardProductById(
  id: string
): Promise<StandardProduct | null> {
  const { data, error } = await supabase
    .from("standard_products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("표준 품목 조회 오류:", error);
    return null;
  }

  return mapDbToProduct(data);
}

/**
 * 표준 품목 생성
 */
export async function createStandardProduct(
  product: Omit<StandardProduct, "id" | "createdAt" | "updatedAt">
): Promise<StandardProduct | null> {
  const { data, error } = await supabase
    .from("standard_products")
    .insert({
      name: product.name,
      category: product.category || null,
      unit: product.unit || "EA",
      sort_order: product.sortOrder || 0,
      is_active: product.isActive ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error("표준 품목 생성 오류:", error);
    throw new Error(
      error.code === "23505"
        ? "이미 존재하는 품목명입니다."
        : "품목 생성에 실패했습니다."
    );
  }

  return mapDbToProduct(data);
}

/**
 * 표준 품목 수정
 */
export async function updateStandardProduct(
  id: string,
  updates: Partial<Omit<StandardProduct, "id" | "createdAt" | "updatedAt">>
): Promise<StandardProduct | null> {
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.unit !== undefined) updateData.unit = updates.unit;
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { data, error } = await supabase
    .from("standard_products")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("표준 품목 수정 오류:", error);
    throw new Error(
      error.code === "23505"
        ? "이미 존재하는 품목명입니다."
        : "품목 수정에 실패했습니다."
    );
  }

  return mapDbToProduct(data);
}

/**
 * 표준 품목 삭제 (소프트 삭제)
 */
export async function deleteStandardProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("standard_products")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("표준 품목 삭제 오류:", error);
    return false;
  }

  return true;
}

/**
 * 표준 품목 완전 삭제
 */
export async function hardDeleteStandardProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("standard_products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("표준 품목 삭제 오류:", error);
    return false;
  }

  return true;
}

/**
 * DB 레코드를 StandardProduct 타입으로 변환
 */
function mapDbToProduct(data: Record<string, unknown>): StandardProduct {
  return {
    id: data.id as string,
    name: data.name as string,
    category: data.category as string | undefined,
    unit: data.unit as string,
    sortOrder: data.sort_order as number,
    isActive: data.is_active as boolean,
    createdAt: data.created_at as string | undefined,
    updatedAt: data.updated_at as string | undefined,
  };
}
