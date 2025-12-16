# Image Server

Cloudflare Workers + R2 기반의 이미지 서버입니다.

## 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        클라이언트                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Delivery-Note│  │ 프로젝트 B  │  │ 프로젝트 C  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          │  Authorization: Bearer {JWT}    │
          └────────────────┼────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Cloudflare Edge Network                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Workers (API 서버)                       │  │
│  │           https://image-server.badeagle85.workers.dev      │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │              Supabase JWT 검증                        │ │  │
│  │  │  1. Authorization 헤더에서 Bearer 토큰 추출            │ │  │
│  │  │  2. JWT 서명 검증 (HMAC-SHA256)                       │ │  │
│  │  │  3. 만료 시간 확인                                    │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │  │
│  │  │ /upload  │ │ /image/* │ │ /images  │ │ /stats   │      │  │
│  │  │  (인증)   │ │  (공개)  │ │  (인증)   │ │  (인증)   │      │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘      │  │
│  └───────┼────────────┼────────────┼────────────┼─────────────┘  │
│          │            │            │            │                │
│          ▼            ▼            ▼            ▼                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   R2 Storage (10GB)                        │  │
│  │                                                            │  │
│  │  📁 delivery-note/                                         │  │
│  │  ├── 1702700001-abc.jpg                                   │  │
│  │  └── 1702700002-def.png                                   │  │
│  │                                                            │  │
│  │  📁 project-b/                                             │  │
│  │  └── 1702700003-ghi.jpg                                   │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   CDN (자동 캐싱)                          │  │
│  │                   글로벌 300+ 엣지                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 인증 방식

### Supabase JWT 인증

이미지 서버는 Supabase에서 발급한 JWT 토큰으로 인증합니다.

```
┌─────────────────────────────────────────────────────────────┐
│                     인증 흐름                                │
│                                                             │
│  1. 사용자가 Supabase로 로그인                               │
│     └─▶ Supabase가 JWT 토큰 발급                            │
│                                                             │
│  2. 클라이언트가 이미지 서버 API 호출                         │
│     └─▶ Authorization: Bearer {supabase_jwt}                │
│                                                             │
│  3. 이미지 서버가 JWT 검증                                   │
│     ├─▶ 서명 검증 (SUPABASE_JWT_SECRET 사용)                 │
│     └─▶ 만료 시간 확인                                      │
│                                                             │
│  4. 검증 성공 시 요청 처리                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 엔드포인트별 인증 요구사항

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|:----:|
| GET | `/health` | 상태 확인 | ❌ |
| POST | `/upload` | 이미지 업로드 | ✅ |
| GET | `/image/:projectId/:key` | 이미지 조회 | ❌ |
| DELETE | `/image/:projectId/:key` | 이미지 삭제 | ✅ |
| GET | `/images` | 목록 조회 | ✅ |
| GET | `/stats` | 통계 조회 | ✅ |

## 사용법

### 이미지 업로드

```bash
curl -X POST https://image-server.badeagle85.workers.dev/upload \
  -H "Authorization: Bearer {SUPABASE_JWT}" \
  -F "file=@image.jpg" \
  -F "projectId=delivery-note"
```

> **projectId 필수**: 영문 소문자, 숫자, `-`, `_` 만 허용 (1-50자)

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "1702700000000-abc123",
    "key": "delivery-note/1702700000000-abc123.jpg",
    "url": "/image/delivery-note/1702700000000-abc123.jpg",
    "filename": "image.jpg",
    "contentType": "image/jpeg",
    "size": 204800,
    "projectId": "delivery-note",
    "uploadTime": 150,
    "createdAt": "2024-12-16T10:00:00.000Z"
  }
}
```

### 이미지 조회 (인증 불필요)

```bash
curl https://image-server.badeagle85.workers.dev/image/delivery-note/1702700000000-abc123.jpg
```

### 이미지 삭제

```bash
curl -X DELETE https://image-server.badeagle85.workers.dev/image/delivery-note/1702700000000-abc123.jpg \
  -H "Authorization: Bearer {SUPABASE_JWT}"
```

### 이미지 목록

```bash
curl "https://image-server.badeagle85.workers.dev/images?limit=20&projectId=delivery-note" \
  -H "Authorization: Bearer {SUPABASE_JWT}"
```

### 통계 조회

```bash
curl https://image-server.badeagle85.workers.dev/stats \
  -H "Authorization: Bearer {SUPABASE_JWT}"
```

**응답:**
```json
{
  "success": true,
  "data": {
    "totalImages": 150,
    "totalSize": 307200000,
    "totalSizeFormatted": "293 MB",
    "usedGB": "0.29",
    "remainingGB": "9.71",
    "remainingFormatted": "9.7GB"
  }
}
```

## 클라이언트 사용 예시

### JavaScript/TypeScript (with Supabase)

```typescript
import { supabase } from './supabaseClient';

const IMAGE_SERVER_URL = 'https://image-server.badeagle85.workers.dev';

async function uploadImage(file: File, projectId: string) {
  // Supabase 세션에서 JWT 가져오기
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('로그인이 필요합니다');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);

  const response = await fetch(`${IMAGE_SERVER_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    },
    body: formData
  });

  return response.json();
}

// 사용 예시
const result = await uploadImage(file, 'delivery-note');
console.log(result.data.url); // /image/delivery-note/1702700000-abc.jpg
```

### React Hook

```typescript
import { useSession } from '@supabase/auth-helpers-react';

function useImageUpload(projectId: string) {
  const session = useSession();
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (file: File) => {
    if (!session) {
      throw new Error('로그인이 필요합니다');
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);

      const response = await fetch(`${IMAGE_SERVER_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      return response.json();
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, isAuthenticated: !!session };
}

// 사용 예시
const { upload, isUploading } = useImageUpload('delivery-note');
```

## 개발

### 설치

```bash
npm install
```

### 로컬 실행

```bash
npm run dev
```

### 배포

```bash
npm run deploy
```

### 환경 변수 설정

```bash
# Supabase JWT Secret 설정 (Supabase Dashboard → Settings → API → JWT Secret)
wrangler secret put SUPABASE_JWT_SECRET
```

## 제한 사항

- 최대 파일 크기: 1MB
- 허용 파일 형식: JPEG, PNG, WebP, GIF
- 무료 저장 용량: 10GB
- **projectId 필수**: 영문 소문자, 숫자, `-`, `_` (1-50자)

## 사용량 모니터링

### Cloudflare 대시보드 경로

| 항목 | 경로 |
|------|------|
| **R2 사용량** | [Dashboard](https://dash.cloudflare.com) → R2 Object Storage → Overview |
| **Workers 요청** | [Dashboard](https://dash.cloudflare.com) → Workers & Pages → image-server → Metrics |
| **알림 설정** | [Dashboard](https://dash.cloudflare.com) → Notifications → Add |

### 무료 티어 한도

| 항목 | 무료 한도 | 초과 시 비용 |
|------|----------|-------------|
| R2 저장소 | 10GB | $0.015/GB/월 |
| Class A 작업 (업로드/삭제/목록) | 100만 회/월 | $4.50/백만 |
| Class B 작업 (조회) | 1,000만 회/월 | $0.36/백만 |
| Workers 요청 | 10만 회/일 | 유료 플랜 필요 |
| 대역폭 | 무제한 | 무료 |

### API로 사용량 확인

```bash
curl https://image-server.badeagle85.workers.dev/stats \
  -H "Authorization: Bearer {SUPABASE_JWT}"
```

## 보안

### 왜 API Key 대신 JWT를 사용하나요?

| 방식 | 문제점 |
|------|--------|
| **API Key** | 클라이언트(브라우저)에 노출되면 탈취 가능 |
| **JWT** | 사용자별 토큰, 만료 시간 있음, 서명 검증 |

### JWT 검증 과정

```
1. Authorization 헤더에서 Bearer 토큰 추출
2. JWT를 Header, Payload, Signature로 분리
3. SUPABASE_JWT_SECRET으로 서명 검증 (HMAC-SHA256)
4. 만료 시간(exp) 확인
5. 모두 통과하면 요청 허용
```

## 기술 스택

- [Cloudflare Workers](https://workers.cloudflare.com/) - 서버리스 런타임
- [Cloudflare R2](https://www.cloudflare.com/products/r2/) - 오브젝트 스토리지
- [Supabase Auth](https://supabase.com/auth) - JWT 인증
- [TypeScript](https://www.typescriptlang.org/) - 타입 안전성
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - CLI 도구

## 라이선스

MIT
