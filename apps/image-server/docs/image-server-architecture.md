# 이미지 서버 아키텍처 문서

## 개요

여러 프로젝트에서 공용으로 사용할 수 있는 이미지 서버 구축 가이드입니다.

---

## 사전 요구사항

구축을 시작하기 전에 다음이 필요합니다:

### 필수

| 항목 | 설명 | 확인 |
|------|------|------|
| **Cloudflare 계정** | https://dash.cloudflare.com 에서 무료 가입 | [ ] |
| **Node.js 18+** | Wrangler CLI 실행에 필요 | [ ] |
| **npm 또는 pnpm** | 패키지 관리자 | [ ] |

### Cloudflare 계정 생성 방법

1. https://dash.cloudflare.com 접속
2. "Sign up" 클릭
3. 이메일, 비밀번호 입력
4. 이메일 인증 완료
5. 무료 플랜 선택 (Free)

### Node.js 설치 확인

```bash
node --version  # v18.0.0 이상
npm --version   # 9.0.0 이상
```

---

## 요구사항

1. **CDN 설정** - 글로벌 엣지 네트워크로 빠른 이미지 제공
2. **업로드 속도 측정** - 업로드 성능 모니터링
3. **무료** - 초기 비용 없이 시작
4. **API 제공** - 다양한 프로젝트에서 호출 가능

---

## 선택한 기술 스택

### Cloudflare R2 + Workers

```
┌─────────────────────────────────────────────────────────┐
│                      Cloudflare                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Workers   │───▶│     R2      │───▶│     CDN     │  │
│  │  (API 서버) │    │  (스토리지)  │    │  (자동제공)  │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
└─────────────────────────────────────────────────────────┘
         ▲
         │
    ┌────┴────┐
    │ 클라이언트 │
    │ (여러 프로젝트) │
    └─────────┘
```

---

## 왜 Cloudflare인가?

### 다른 옵션과 비교

| 서비스 | 스토리지 | API 서버 | CDN | 무료 범위 |
|--------|---------|----------|-----|----------|
| **Cloudflare R2 + Workers** | 10GB | 10만 요청/일 | 자동 | 충분 |
| Supabase Storage | 1GB | Edge Functions | X | 부족 |
| AWS S3 + Lambda | 5GB (1년) | 100만/월 | 유료 | 복잡 |
| Vercel Blob | 1GB | Serverless | 자동 | 부족 |

### Cloudflare 선택 이유

1. **무료 범위 넉넉** - 10GB 저장, 10만 요청/일
2. **CDN 자동 제공** - 별도 설정 불필요
3. **서버리스** - 별도 서버 관리 불필요
4. **글로벌 엣지** - 전 세계 어디서나 빠름
5. **전송 비용 무료** - egress 비용 없음

---

## 무료 범위 상세

### Cloudflare R2 (스토리지)

```
저장 용량: 10GB/월
읽기 요청: 1,000만 회/월
쓰기 요청: 100만 회/월
전송 비용: 무료 (!)
```

### Cloudflare Workers (API 서버)

```
요청 수: 10만 회/일 (약 300만/월)
CPU 시간: 10ms/요청
메모리: 128MB
```

### 저장 가능 이미지 수

| 이미지 크기 | 저장 가능 장수 |
|------------|---------------|
| 500KB | 20,480장 |
| 1MB | 10,240장 |
| 2MB | 5,120장 |

---

## API 설계

### 엔드포인트

```
BASE_URL: https://image-server.{account}.workers.dev
```

### 1. 이미지 업로드

```http
POST /upload
Content-Type: multipart/form-data
X-API-Key: {api-key}

Body:
- file: (binary)
- projectId: string (선택)
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "url": "https://image-server.xxx.workers.dev/image/abc123",
    "size": 2048576,
    "uploadTime": 230,
    "createdAt": "2025-12-16T10:00:00Z"
  }
}
```

### 2. 이미지 조회

```http
GET /image/:id
```

**응답:** 이미지 바이너리 (CDN 캐시됨)

### 3. 이미지 삭제

```http
DELETE /image/:id
X-API-Key: {api-key}
```

**응답:**
```json
{
  "success": true,
  "message": "이미지가 삭제되었습니다."
}
```

### 4. 통계 조회

```http
GET /stats
X-API-Key: {api-key}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "totalImages": 150,
    "totalSize": 307200000,
    "totalSizeFormatted": "293MB",
    "remainingSpace": "9.7GB",
    "averageUploadTime": 180
  }
}
```

### 5. 이미지 목록

```http
GET /images?limit=20&offset=0&projectId=delivery-note
X-API-Key: {api-key}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "abc123",
        "url": "...",
        "size": 2048576,
        "projectId": "delivery-note",
        "createdAt": "2025-12-16T10:00:00Z"
      }
    ],
    "total": 150,
    "hasMore": true
  }
}
```

---

## 프로젝트 구조

```
image-server/
├── wrangler.toml           # Cloudflare Workers 설정
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts            # 메인 엔트리, 라우팅
│   ├── handlers/
│   │   ├── upload.ts       # 업로드 처리
│   │   ├── image.ts        # 이미지 조회/삭제
│   │   └── stats.ts        # 통계
│   ├── utils/
│   │   ├── auth.ts         # API Key 인증
│   │   ├── storage.ts      # R2 연동
│   │   └── response.ts     # 응답 헬퍼
│   └── types.ts            # 타입 정의
└── README.md
```

---

## 설정 파일 예시

### wrangler.toml

```toml
name = "image-server"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "image-storage"

[vars]
ENVIRONMENT = "production"
```

### 환경 변수 (Secrets)

```
API_KEY = "your-secret-api-key"
```

---

## 클라이언트 사용 예시

### JavaScript/TypeScript

```typescript
// 이미지 업로드
async function uploadImage(file: File, projectId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (projectId) {
    formData.append('projectId', projectId);
  }

  const response = await fetch('https://image-server.xxx.workers.dev/upload', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.IMAGE_SERVER_API_KEY!
    },
    body: formData
  });

  return response.json();
}

// 사용
const result = await uploadImage(file, 'delivery-note');
console.log(result.data.url); // 이미지 URL
console.log(result.data.uploadTime); // 업로드 시간 (ms)
```

### React Hook 예시

```typescript
function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadTime, setUploadTime] = useState<number | null>(null);

  const upload = async (file: File) => {
    setIsUploading(true);
    const startTime = Date.now();

    try {
      const result = await uploadImage(file);
      setUploadTime(Date.now() - startTime);
      return result;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, uploadTime };
}
```

---

## 속도 측정 방법

### 서버 측 (Workers)

```typescript
export async function handleUpload(request: Request, env: Env) {
  const startTime = Date.now();

  // 업로드 처리...
  await env.IMAGES.put(key, file);

  const uploadTime = Date.now() - startTime;

  // 통계 저장 (KV 사용)
  await saveUploadStats(env, { uploadTime, size: file.size });

  return {
    success: true,
    data: {
      id: key,
      url: `${BASE_URL}/image/${key}`,
      uploadTime, // ms 단위
    }
  };
}
```

### 클라이언트 측

```typescript
const startTime = performance.now();
const result = await uploadImage(file);
const clientTime = performance.now() - startTime;

console.log('서버 처리 시간:', result.data.uploadTime, 'ms');
console.log('전체 시간 (네트워크 포함):', clientTime, 'ms');
```

---

## 이미지 최적화 (선택)

업로드 전 클라이언트에서 압축:

```typescript
async function compressImage(file: File, maxWidth = 1920): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        0.8 // 품질 80%
      );
    };
  });
}

// 사용: 2MB → ~500KB
const compressed = await compressImage(originalFile);
await uploadImage(compressed);
```

---

## 보안

### API Key 인증

```typescript
function validateApiKey(request: Request, env: Env): boolean {
  const apiKey = request.headers.get('X-API-Key');
  return apiKey === env.API_KEY;
}
```

### CORS 설정

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // 또는 특정 도메인
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};
```

### 파일 검증

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: '허용되지 않는 파일 형식입니다.' };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: '파일 크기가 10MB를 초과합니다.' };
  }
  return { valid: true };
}
```

---

## 배포 단계

### 1. Cloudflare 계정 생성
- https://dash.cloudflare.com 가입

### 2. Wrangler CLI 설치
```bash
npm install -g wrangler
wrangler login
```

### 3. R2 버킷 생성
```bash
wrangler r2 bucket create image-storage
```

### 4. 프로젝트 초기화
```bash
mkdir image-server && cd image-server
npm init -y
npm install wrangler typescript @cloudflare/workers-types
```

### 5. 배포
```bash
wrangler deploy
```

### 6. API Key 설정
```bash
wrangler secret put API_KEY
# 프롬프트에 시크릿 값 입력
```

---

## 비용 예측

### 무료 범위 내

| 사용량 | 월 비용 |
|--------|--------|
| 5GB 저장, 1만 회 업로드 | $0 |
| 10GB 저장, 10만 회 업로드 | $0 |

### 무료 초과 시

| 항목 | 가격 |
|------|------|
| 저장 (10GB 초과분) | $0.015/GB |
| 쓰기 (100만 초과분) | $4.50/100만 |
| 읽기 (1000만 초과분) | $0.36/100만 |

**예시:** 50GB 저장, 월 500만 읽기 = 약 $0.60/월

---

## 향후 확장

1. **이미지 리사이징** - Workers에서 on-the-fly 리사이징
2. **썸네일 자동 생성** - 업로드 시 여러 크기 생성
3. **이미지 포맷 변환** - WebP 자동 변환
4. **사용량 대시보드** - 프로젝트별 통계 UI

---

## 참고 링크

- [Cloudflare R2 문서](https://developers.cloudflare.com/r2/)
- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
