import { supabase } from "@/lib/supabase";
import type { Store } from "@/types";

/**
 * 지점 목록 조회
 */
export async function getStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("지점 조회 오류:", error);
    return [];
  }

  return data.map(mapDbToStore);
}

/**
 * 지점 단건 조회
 */
export async function getStoreById(id: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("지점 조회 오류:", error);
    return null;
  }

  return mapDbToStore(data);
}

/**
 * 지점 생성
 */
export async function createStore(
  store: Omit<Store, "id" | "createdAt" | "updatedAt" | "isActive">
): Promise<Store | null> {
  const { data, error } = await supabase
    .from("stores")
    .insert({
      name: store.name,
      memo: store.memo || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("지점 생성 오류:", error);
    throw new Error(
      error.code === "23505"
        ? "이미 존재하는 지점명입니다."
        : "지점 생성에 실패했습니다."
    );
  }

  return mapDbToStore(data);
}

/**
 * 지점 수정
 */
export async function updateStore(
  id: string,
  updates: Partial<Omit<Store, "id" | "createdAt" | "updatedAt">>
): Promise<Store | null> {
  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.memo !== undefined) updateData.memo = updates.memo;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { data, error } = await supabase
    .from("stores")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("지점 수정 오류:", error);
    throw new Error(
      error.code === "23505"
        ? "이미 존재하는 지점명입니다."
        : "지점 수정에 실패했습니다."
    );
  }

  return mapDbToStore(data);
}

/**
 * 지점 삭제 (소프트 삭제)
 */
export async function deleteStore(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("stores")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("지점 삭제 오류:", error);
    return false;
  }

  return true;
}

/**
 * DB 레코드를 Store 타입으로 변환
 */
function mapDbToStore(data: Record<string, unknown>): Store {
  return {
    id: data.id as string,
    name: data.name as string,
    memo: data.memo as string | undefined,
    isActive: data.is_active as boolean,
    createdAt: data.created_at as string | undefined,
    updatedAt: data.updated_at as string | undefined,
  };
}
