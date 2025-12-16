# 인증 시스템 문서

## 개요

Supabase Auth를 사용한 통합 로그인(SSO) 시스템입니다.
한 번 로그인하면 여러 서비스를 추가 인증 없이 사용할 수 있습니다.

```
┌─────────────────────────────────────────────────────────────┐
│                    통합 로그인 구조                          │
│                                                             │
│                    ┌─────────────┐                          │
│                    │  Supabase   │                          │
│                    │    Auth     │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│            ┌──────────────┼──────────────┐                  │
│            ▼              ▼              ▼                  │
│     Delivery-Note    Image-Server    Project-C              │
│                                                             │
│     1회 로그인으로 모든 서비스 이용 가능                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 인증 Flow

### 1. 이메일/비밀번호 로그인

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   사용자                  Delivery-Note                  Supabase       │
│     │                          │                            │          │
│     │  이메일/비밀번호 입력     │                            │          │
│     │ ────────────────────────▶│                            │          │
│     │                          │                            │          │
│     │                          │  signInWithPassword()      │          │
│     │                          │ ──────────────────────────▶│          │
│     │                          │                            │          │
│     │                          │                     ┌──────┴───────┐  │
│     │                          │                     │ 비밀번호 검증 │  │
│     │                          │                     └──────┬───────┘  │
│     │                          │                            │          │
│     │                          │   { access_token,          │          │
│     │                          │     refresh_token,         │          │
│     │                          │     user }                 │          │
│     │                          │ ◀──────────────────────────│          │
│     │                          │                            │          │
│     │                   ┌──────┴───────┐                    │          │
│     │                   │ 토큰 저장     │                    │          │
│     │                   │ (localStorage)│                    │          │
│     │                   └──────┬───────┘                    │          │
│     │                          │                            │          │
│     │  로그인 완료              │                            │          │
│     │ ◀────────────────────────│                            │          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2. 소셜 로그인 (Google, Kakao 등)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  사용자        Delivery-Note        Supabase           Google/Kakao     │
│    │                │                  │                    │           │
│    │ "Google 로그인" │                  │                    │           │
│    │ ──────────────▶│                  │                    │           │
│    │                │                  │                    │           │
│    │                │ signInWithOAuth()│                    │           │
│    │                │ ────────────────▶│                    │           │
│    │                │                  │                    │           │
│    │                │    리다이렉트 URL │                    │           │
│    │                │ ◀────────────────│                    │           │
│    │                │                  │                    │           │
│    │ ◀──────────────┼──────────────────┼────────────────────│           │
│    │           Google 로그인 페이지로 이동                   │           │
│    │                │                  │                    │           │
│    │ Google 계정 선택│                  │                    │           │
│    │ ───────────────┼──────────────────┼───────────────────▶│           │
│    │                │                  │                    │           │
│    │                │                  │    인증 코드        │           │
│    │                │                  │ ◀──────────────────│           │
│    │                │                  │                    │           │
│    │                │                  │  ┌───────────────┐ │           │
│    │                │                  │  │토큰 교환      │ │           │
│    │                │                  │  │사용자 정보 저장│ │           │
│    │                │                  │  └───────────────┘ │           │
│    │                │                  │                    │           │
│    │ ◀──────────────┼──────────────────│                    │           │
│    │         콜백 URL로 리다이렉트 (토큰 포함)               │           │
│    │                │                  │                    │           │
│    │                │  세션 설정        │                    │           │
│    │                │ ────────────────▶│                    │           │
│    │                │                  │                    │           │
│    │ 로그인 완료     │                  │                    │           │
│    │ ◀──────────────│                  │                    │           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3. 다른 서비스 이용 시 (Image Server)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    이미 로그인된 상태에서                                 │
│                                                                         │
│  사용자           Delivery-Note         Image Server         Supabase   │
│    │                  │                      │                   │      │
│    │ 이미지 업로드     │                      │                   │      │
│    │ ────────────────▶│                      │                   │      │
│    │                  │                      │                   │      │
│    │           ┌──────┴───────┐              │                   │      │
│    │           │ 저장된 토큰   │              │                   │      │
│    │           │ 가져오기     │              │                   │      │
│    │           └──────┬───────┘              │                   │      │
│    │                  │                      │                   │      │
│    │                  │  POST /upload        │                   │      │
│    │                  │  Authorization: JWT  │                   │      │
│    │                  │ ────────────────────▶│                   │      │
│    │                  │                      │                   │      │
│    │                  │               ┌──────┴───────┐           │      │
│    │                  │               │ JWT 검증     │           │      │
│    │                  │               │ (서명 확인)  │           │      │
│    │                  │               │ (만료 확인)  │           │      │
│    │                  │               └──────┬───────┘           │      │
│    │                  │                      │                   │      │
│    │                  │                      │  ※ Supabase 호출  │      │
│    │                  │                      │    불필요!        │      │
│    │                  │                      │   (서명만 검증)   │      │
│    │                  │                      │                   │      │
│    │                  │  업로드 완료          │                   │      │
│    │                  │ ◀────────────────────│                   │      │
│    │                  │                      │                   │      │
│    │ 완료             │                      │                   │      │
│    │ ◀────────────────│                      │                   │      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## JWT 토큰 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase JWT                              │
│                                                             │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.                      │
│  eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUu...│
│  SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c                │
│                                                             │
│  ┌─────────────┐ ┌─────────────────┐ ┌────────────────────┐ │
│  │   Header    │ │    Payload      │ │    Signature       │ │
│  │  (알고리즘)  │ │  (사용자 정보)   │ │  (서명)            │ │
│  └─────────────┘ └─────────────────┘ └────────────────────┘ │
│        │                 │                    │             │
│        ▼                 ▼                    ▼             │
│   { "alg": "HS256" }  { "sub": "user-id",   HMAC-SHA256(   │
│                         "email": "...",      header+payload,│
│                         "exp": 1702700000 }  JWT_SECRET)    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Payload 내용

| 필드 | 설명 | 예시 |
|------|------|------|
| `sub` | 사용자 고유 ID | `"a1b2c3d4-..."` |
| `email` | 이메일 주소 | `"user@example.com"` |
| `exp` | 만료 시간 (Unix timestamp) | `1702700000` |
| `iat` | 발급 시간 | `1702696400` |
| `aud` | 대상 (audience) | `"authenticated"` |
| `role` | 역할 | `"authenticated"` |

---

## 토큰 갱신 Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   토큰 자동 갱신                             │
│                                                             │
│   Access Token: 1시간 유효                                  │
│   Refresh Token: 7일 유효 (설정 가능)                        │
│                                                             │
│   ┌─────────┐         ┌─────────┐         ┌─────────┐      │
│   │ 로그인   │ ──────▶ │ 1시간   │ ──────▶ │ 만료    │      │
│   └─────────┘         │ 사용    │         └────┬────┘      │
│                       └─────────┘              │            │
│                                                ▼            │
│                                    ┌───────────────────┐   │
│                                    │ Refresh Token으로  │   │
│                                    │ 새 Access Token    │   │
│                                    │ 자동 발급          │   │
│                                    └───────────────────┘   │
│                                                             │
│   ※ Supabase 클라이언트가 자동 처리                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## JWT 검증 과정 (Image Server)

```
┌─────────────────────────────────────────────────────────────┐
│                     JWT 검증 단계                            │
│                                                             │
│  1. Authorization 헤더에서 Bearer 토큰 추출                  │
│     Authorization: Bearer eyJhbGciOiJIUzI1NiIs...           │
│                                                             │
│  2. JWT를 3부분으로 분리                                     │
│     Header.Payload.Signature                                │
│                                                             │
│  3. 서명 검증 (HMAC-SHA256)                                  │
│     - SUPABASE_JWT_SECRET으로 서명 재생성                    │
│     - 원본 서명과 비교                                       │
│                                                             │
│  4. 만료 시간 확인                                           │
│     - payload.exp > 현재 시간                               │
│                                                             │
│  5. 모두 통과하면 요청 허용                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 검증 코드 (TypeScript)

```typescript
async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;

  // 1. Payload 디코딩
  const payload = JSON.parse(atob(payloadB64));

  // 2. 만료 시간 확인
  if (payload.exp < Date.now() / 1000) return null;

  // 3. 서명 검증
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(signatureB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  );

  return isValid ? payload : null;
}
```

---

## 엔드포인트별 인증 요구사항

| 서비스 | 엔드포인트 | 인증 | 이유 |
|--------|-----------|:----:|------|
| Image Server | `POST /upload` | ✅ | 무단 업로드 방지 |
| Image Server | `DELETE /image/*` | ✅ | 무단 삭제 방지 |
| Image Server | `GET /images` | ✅ | 목록 노출 방지 |
| Image Server | `GET /stats` | ✅ | 통계 보호 |
| Image Server | `GET /image/*` | ❌ | CDN 캐싱, img 태그 사용 |
| Image Server | `GET /health` | ❌ | 헬스체크 |

---

## 클라이언트 구현 예시

### Supabase 로그인

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 이메일/비밀번호 로그인
async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

// Google 로그인
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  });
  return { data, error };
}

// 로그아웃
async function signOut() {
  await supabase.auth.signOut();
}
```

### 토큰 가져오기

```typescript
async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
```

### Image Server 호출

```typescript
async function uploadImage(file: File, projectId: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('로그인이 필요합니다');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);

  const response = await fetch('https://image-server.badeagle85.workers.dev/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return response.json();
}
```

---

## 보안 고려사항

### API Key vs JWT

| 방식 | 문제점 | 해결책 |
|------|--------|--------|
| **API Key** | 클라이언트 노출 시 탈취 가능 | - |
| **JWT** | 사용자별 토큰, 만료 있음 | ✅ 채택 |

### 토큰 저장 위치

| 위치 | 장점 | 단점 |
|------|------|------|
| localStorage | 간단함 | XSS 공격에 취약 |
| httpOnly Cookie | XSS 방어 | CSRF 고려 필요 |
| Memory | 가장 안전 | 새로고침 시 사라짐 |

> Supabase 기본값: localStorage (자동 갱신 포함)

### 추가 보안 옵션

1. **Refresh Token Rotation** - 사용 시마다 새 토큰 발급
2. **IP 제한** - 특정 IP에서만 허용
3. **Rate Limiting** - 요청 횟수 제한

---

## Supabase Auth 무료 범위

| 항목 | 무료 한도 |
|------|----------|
| 월간 활성 사용자 (MAU) | 50,000명 |
| 소셜 로그인 | 무제한 |
| 이메일 인증 | 무료 |
| JWT 토큰 발급 | 무료 |

---

## 설정 방법

### 1. Supabase 프로젝트에서 Auth 활성화

Supabase Dashboard → Authentication → Providers

### 2. 소셜 로그인 설정 (선택)

- Google: GCP Console에서 OAuth 클라이언트 생성
- Kakao: Kakao Developers에서 앱 등록

### 3. Image Server에 JWT Secret 설정

```bash
# Supabase Dashboard → Settings → API → JWT Secret 복사
wrangler secret put SUPABASE_JWT_SECRET
```

### 4. 클라이언트에 Supabase 연동

```bash
npm install @supabase/supabase-js
```

```typescript
// .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```
