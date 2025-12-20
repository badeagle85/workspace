import { supabase } from "@/lib/supabase";

const IMAGE_SERVER_URL = "https://image-server.badeagle85.workers.dev";
const PROJECT_ID = "delivery-note";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 이미지를 이미지 서버에 업로드
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  try {
    // Supabase 세션에서 JWT 가져오기
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: "로그인이 필요합니다" };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", PROJECT_ID);

    const response = await fetch(`${IMAGE_SERVER_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      return { success: false, error: result.error || "업로드 실패" };
    }

    // 전체 URL 반환
    const imageUrl = `${IMAGE_SERVER_URL}${result.data.url}`;
    return { success: true, url: imageUrl };
  } catch (error) {
    console.error("이미지 업로드 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "업로드 중 오류 발생",
    };
  }
}

/**
 * 이미지 삭제
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return false;
    }

    // URL에서 key 추출
    const key = imageUrl.replace(`${IMAGE_SERVER_URL}/image/`, "");

    const response = await fetch(`${IMAGE_SERVER_URL}/image/${key}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("이미지 삭제 오류:", error);
    return false;
  }
}
