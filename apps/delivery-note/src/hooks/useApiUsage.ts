import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const MONTHLY_LIMIT = 900;
const PROVIDER = "google_vision";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

interface ApiUsage {
  id: string;
  provider: string;
  year_month: string;
  count: number;
}

async function fetchUsage(): Promise<ApiUsage | null> {
  const yearMonth = getCurrentMonth();

  const { data, error } = await supabase
    .from("delivery_note_api_usage")
    .select("*")
    .eq("provider", PROVIDER)
    .eq("year_month", yearMonth)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("Failed to fetch usage:", error);
  }

  return data;
}

async function incrementUsage(): Promise<{ success: boolean; count: number }> {
  const yearMonth = getCurrentMonth();

  // upsert: 있으면 count + 1, 없으면 새로 생성
  const { data: existing } = await supabase
    .from("delivery_note_api_usage")
    .select("id, count")
    .eq("provider", PROVIDER)
    .eq("year_month", yearMonth)
    .single();

  if (existing) {
    // 한도 체크
    if (existing.count >= MONTHLY_LIMIT) {
      return { success: false, count: existing.count };
    }

    // 기존 레코드 업데이트
    const { data, error } = await supabase
      .from("delivery_note_api_usage")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id)
      .select("count")
      .single();

    if (error) {
      console.error("Failed to increment usage:", error);
      return { success: false, count: existing.count };
    }

    return { success: true, count: data.count };
  } else {
    // 새 레코드 생성
    const { data, error } = await supabase
      .from("delivery_note_api_usage")
      .insert({ provider: PROVIDER, year_month: yearMonth, count: 1 })
      .select("count")
      .single();

    if (error) {
      console.error("Failed to create usage record:", error);
      return { success: false, count: 0 };
    }

    return { success: true, count: data.count };
  }
}

export function useGoogleVisionUsage() {
  const queryClient = useQueryClient();

  const { data: usage, isLoading } = useQuery({
    queryKey: ["api-usage", PROVIDER, getCurrentMonth()],
    queryFn: fetchUsage,
    staleTime: 1000 * 60, // 1분
  });

  const mutation = useMutation({
    mutationFn: incrementUsage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["api-usage", PROVIDER, getCurrentMonth()],
      });
    },
  });

  const count = usage?.count ?? 0;
  const remaining = Math.max(0, MONTHLY_LIMIT - count);
  const limitReached = count >= MONTHLY_LIMIT;

  return {
    count,
    remaining,
    limitReached,
    isLoading,
    increment: mutation.mutateAsync,
    isIncrementing: mutation.isPending,
  };
}

export const GOOGLE_VISION_MONTHLY_LIMIT = MONTHLY_LIMIT;
