import { supabase } from "@/lib/supabase";
import type { Supplier } from "@/types";

/**
 * 공급업체 목록 조회
 */
export async function getSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("공급업체 조회 오류:", error);
    return [];
  }

  return data.map(mapDbToSupplier);
}

/**
 * 공급업체 단건 조회
 */
export async function getSupplierById(id: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("공급업체 조회 오류:", error);
    return null;
  }

  return mapDbToSupplier(data);
}

/**
 * 공급업체 생성
 */
export async function createSupplier(
  supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt" | "isActive">
): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name: supplier.name,
      memo: supplier.memo || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("공급업체 생성 오류:", error);
    throw new Error(
      error.code === "23505"
        ? "이미 존재하는 공급업체명입니다."
        : "공급업체 생성에 실패했습니다."
    );
  }

  return mapDbToSupplier(data);
}

/**
 * 공급업체 수정
 */
export async function updateSupplier(
  id: string,
  updates: Partial<Omit<Supplier, "id" | "createdAt" | "updatedAt">>
): Promise<Supplier | null> {
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.memo !== undefined) updateData.memo = updates.memo;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { data, error } = await supabase
    .from("suppliers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("공급업체 수정 오류:", error);
    throw new Error(
      error.code === "23505"
        ? "이미 존재하는 공급업체명입니다."
        : "공급업체 수정에 실패했습니다."
    );
  }

  return mapDbToSupplier(data);
}

/**
 * 공급업체 삭제 (소프트 삭제)
 */
export async function deleteSupplier(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("suppliers")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("공급업체 삭제 오류:", error);
    return false;
  }

  return true;
}

/**
 * DB 레코드를 Supplier 타입으로 변환
 */
function mapDbToSupplier(data: Record<string, unknown>): Supplier {
  return {
    id: data.id as string,
    name: data.name as string,
    memo: data.memo as string | undefined,
    isActive: data.is_active as boolean,
    createdAt: data.created_at as string | undefined,
    updatedAt: data.updated_at as string | undefined,
  };
}
