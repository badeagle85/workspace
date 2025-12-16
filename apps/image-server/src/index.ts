export interface Env {
  IMAGES: R2Bucket;
  SUPABASE_JWT_SECRET: string;
  ENVIRONMENT: string;
  MAX_FILE_SIZE: string;
}

interface ImageMetadata {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  projectId?: string;
  createdAt: string;
}

interface JwtPayload {
  sub: string;
  email?: string;
  exp: number;
  iat: number;
  aud: string;
  role?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const PROJECT_ID_REGEX = /^[a-z0-9_-]{1,50}$/;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 라우팅
      if (path === "/upload" && request.method === "POST") {
        return await handleUpload(request, env);
      }

      if (path.startsWith("/image/") && request.method === "GET") {
        const key = path.replace("/image/", "");
        return await handleGetImage(key, env);
      }

      if (path.startsWith("/image/") && request.method === "DELETE") {
        const jwt = await verifyJwt(request, env);
        if (!jwt) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        const key = path.replace("/image/", "");
        return await handleDeleteImage(key, env);
      }

      if (path === "/images" && request.method === "GET") {
        const jwt = await verifyJwt(request, env);
        if (!jwt) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        return await handleListImages(url, env);
      }

      if (path === "/stats" && request.method === "GET") {
        const jwt = await verifyJwt(request, env);
        if (!jwt) {
          return jsonResponse({ success: false, error: "Unauthorized" }, 401);
        }
        return await handleStats(env);
      }

      if (path === "/health") {
        return jsonResponse({ success: true, message: "OK" });
      }

      return jsonResponse({ success: false, error: "Not Found" }, 404);
    } catch (error) {
      console.error("Error:", error);
      return jsonResponse(
        { success: false, error: error instanceof Error ? error.message : "Internal Server Error" },
        500
      );
    }
  },
};

async function verifyJwt(request: Request, env: Env): Promise<JwtPayload | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // JWT 파싱
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Base64URL 디코딩
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))) as JwtPayload;

    // 만료 시간 확인
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log("JWT expired");
      return null;
    }

    // HMAC-SHA256 서명 검증
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.SUPABASE_JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureData = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    const isValid = await crypto.subtle.verify("HMAC", key, signature, signatureData);

    if (!isValid) {
      console.log("JWT signature invalid");
      return null;
    }

    return payload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
  const startTime = Date.now();

  // JWT 검증 (업로드는 인증 필요)
  const jwt = await verifyJwt(request, env);
  if (!jwt) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const contentType = request.headers.get("Content-Type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return jsonResponse({ success: false, error: "Content-Type must be multipart/form-data" }, 400);
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;

  if (!file) {
    return jsonResponse({ success: false, error: "No file provided" }, 400);
  }

  // projectId 필수 검증
  if (!projectId) {
    return jsonResponse({ success: false, error: "projectId is required" }, 400);
  }

  // projectId 형식 검증 (영문 소문자, 숫자, -, _ 만 허용)
  if (!PROJECT_ID_REGEX.test(projectId)) {
    return jsonResponse(
      { success: false, error: "Invalid projectId. Only lowercase letters, numbers, hyphens, and underscores allowed (1-50 chars)" },
      400
    );
  }

  // 파일 타입 검증
  if (!ALLOWED_TYPES.includes(file.type)) {
    return jsonResponse(
      { success: false, error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
      400
    );
  }

  // 파일 크기 검증
  const maxSize = parseInt(env.MAX_FILE_SIZE || "10485760");
  if (file.size > maxSize) {
    return jsonResponse(
      { success: false, error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` },
      400
    );
  }

  const id = generateId();
  const extension = file.name.split(".").pop() || "jpg";
  const key = `${projectId}/${id}.${extension}`;

  const metadata: ImageMetadata = {
    id,
    filename: file.name,
    contentType: file.type,
    size: file.size,
    projectId: projectId || undefined,
    createdAt: new Date().toISOString(),
  };

  // R2에 업로드
  await env.IMAGES.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      filename: file.name,
      projectId: projectId || "",
      createdAt: metadata.createdAt,
    },
  });

  const uploadTime = Date.now() - startTime;

  return jsonResponse({
    success: true,
    data: {
      id,
      key,
      url: `/image/${key}`,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      projectId,
      uploadTime,
      createdAt: metadata.createdAt,
    },
  });
}

async function handleGetImage(key: string, env: Env): Promise<Response> {
  const object = await env.IMAGES.get(key);

  if (!object) {
    return jsonResponse({ success: false, error: "Image not found" }, 404);
  }

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
  headers.set("Cache-Control", "public, max-age=31536000"); // 1년 캐시
  headers.set("ETag", object.etag);

  return new Response(object.body, { headers });
}

async function handleDeleteImage(key: string, env: Env): Promise<Response> {
  const object = await env.IMAGES.get(key);

  if (!object) {
    return jsonResponse({ success: false, error: "Image not found" }, 404);
  }

  await env.IMAGES.delete(key);

  return jsonResponse({
    success: true,
    message: "Image deleted successfully",
  });
}

async function handleListImages(url: URL, env: Env): Promise<Response> {
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const cursor = url.searchParams.get("cursor") || undefined;
  const projectId = url.searchParams.get("projectId") || undefined;

  // projectId가 있으면 prefix로 필터링 (폴더 구조 활용)
  const listed = await env.IMAGES.list({
    limit,
    cursor,
    prefix: projectId ? `${projectId}/` : undefined,
  });

  const images = listed.objects.map((obj) => {
    // key에서 projectId 추출 (폴더명)
    const keyParts = obj.key.split("/");
    const objProjectId = keyParts.length > 1 ? keyParts[0] : null;

    return {
      key: obj.key,
      url: `/image/${obj.key}`,
      size: obj.size,
      projectId: objProjectId,
      createdAt: obj.customMetadata?.createdAt || obj.uploaded.toISOString(),
    };
  });

  return jsonResponse({
    success: true,
    data: {
      images,
      cursor: listed.truncated ? listed.cursor : null,
      hasMore: listed.truncated,
    },
  });
}

async function handleStats(env: Env): Promise<Response> {
  const listed = await env.IMAGES.list({ limit: 1000 });

  let totalSize = 0;
  for (const obj of listed.objects) {
    totalSize += obj.size;
  }

  const totalImages = listed.objects.length;
  const usedGB = totalSize / 1024 / 1024 / 1024;
  const remainingGB = 10 - usedGB;

  return jsonResponse({
    success: true,
    data: {
      totalImages,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      usedGB: usedGB.toFixed(2),
      remainingGB: remainingGB.toFixed(2),
      remainingFormatted: `${remainingGB.toFixed(1)}GB`,
    },
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
