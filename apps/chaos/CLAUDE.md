# WC3 카오스 프로젝트 가이드

## 개발 환경

### 필수 명령어

```bash
pnpm dev          # 개발 서버
pnpm build        # 프로덕션 빌드
pnpm lint         # ESLint 검사 + 자동 수정
pnpm format       # Prettier 포맷팅
pnpm format:check # 포맷팅 검사만
```

### 코드 품질 도구

- **ESLint**: Next.js + TypeScript 규칙
- **Prettier**: 코드 포맷팅 (semi: false, singleQuote: false)
- **Husky**: pre-commit 훅으로 lint-staged 실행
- **lint-staged**: 커밋 시 변경된 파일만 검사

### 커밋 전 자동 검사

커밋 시 자동으로 실행됨:

- `.ts`, `.tsx` → ESLint + Prettier
- `.json`, `.md`, `.css` → Prettier

## 코딩 컨벤션

### 파일/폴더 네이밍

- 컴포넌트: `PascalCase.tsx` (예: `TierList.tsx`)
- 훅/유틸: `kebab-case.ts` (예: `use-balancer.ts`)
- 폴더: `kebab-case` (예: `tier-list`)

### 컴포넌트 구조

```typescript
// 1. imports (외부 → 내부 순서)
import { useState } from "react"
import { Button } from "@/shared/ui"
import { usePlayerContext } from "@/entities/player"

// 2. types/interfaces
interface Props { ... }

// 3. component
export function ComponentName({ ... }: Props) {
  // hooks → state → handlers → render
}
```

### Import 경로 (path alias)

```typescript
@/app/*        // 페이지
@/components/* // 레이아웃 컴포넌트
@/entities/*   // 엔티티
@/features/*   // 기능
@/shared/*     // 공유 (ui, types, config, lib)
@/widgets/*    // 위젯
```

### UI 컴포넌트 규칙

- shadcn/ui 컴포넌트는 `src/shared/ui/`에 위치
- 새 UI 추가 시: `npx shadcn@latest add [component]`
- `src/components/ui/` 사용 금지 (삭제됨)

## 데이터 관리

### React Query 사용

- 모든 서버 데이터는 React Query로 관리
- staleTime: 60초 (1분 캐시)
- 플레이어 데이터: `usePlayerContext()` 사용

### API 엔드포인트

| 경로                  | 메서드 | 설명               |
| --------------------- | ------ | ------------------ |
| `/api/players`        | GET    | 전체 플레이어 목록 |
| `/api/players/[name]` | PATCH  | 플레이어 티어 수정 |
| `/api/players/add`    | POST   | 새 플레이어 추가   |
| `/api/auth/verify`    | POST   | 비밀번호 인증      |

## Supabase 규칙

이 프로젝트는 다른 프로젝트와 Supabase를 공유합니다.

### 테이블 네이밍 규칙

- **prefix**: `chaos_`
- 예: `chaos_players`, `chaos_users`, `chaos_announcements`

### 테이블 목록

| 테이블명              | 설명                      |
| --------------------- | ------------------------- |
| `chaos_users`         | 로그인/권한 관리용 유저   |
| `chaos_players`       | 게임 내 플레이어 (티어표) |
| `chaos_tier_scores`   | 티어별 점수 설정          |
| `chaos_announcements` | 공지사항                  |
| `chaos_tournaments`   | 대회 정보                 |

### Enum 타입

- `chaos_user_role`: admin, master, staff, user, banned
- `chaos_player_status`: active, resting, banned, new
- `chaos_tier_level`: 1, 2, 2.5, 3, 3.5, 4, 5, 6, 7

### 스키마 파일

- `supabase/schema.sql` - 전체 스키마 정의

## 인증 방식

1차: 단순 비밀번호 인증 (`.env.local`)

- `ADMIN_PASSWORD`
- `MASTER_PASSWORD`
- `STAFF_PASSWORD`

## 프로젝트 구조 (FSD)

```
src/
├── app/           # 페이지 라우트
├── components/    # 레이아웃 컴포넌트 (app-sidebar, query-provider 등)
├── entities/      # 엔티티 (player)
├── features/      # 기능 (team-balancer, tier-filter, auth)
├── shared/        # 공유 (ui, types, config, lib)
└── widgets/       # 위젯 (tier-list, balancer-panel)
```

## 주요 타입

```typescript
enum Tier {
  TIER_1 = "1",
  TIER_2 = "2",
  TIER_2_5 = "2.5",
  TIER_3 = "3",
  TIER_3_5 = "3.5",
  TIER_4 = "4",
  TIER_5 = "5",
  TIER_6 = "6",
  TIER_7 = "7",
  NEW = "new",
  BANNED = "banned",
}

enum Team {
  NIGHT_ELF = "nightelf",
  UNDEAD = "undead",
}
enum MoveStatus {
  STAY = "stay",
  MOVE = "move",
}
enum TierListMode {
  STANDALONE = "standalone",
  BALANCER = "balancer",
}
```

## 주의사항

1. **정적 데이터 사용 금지**: `players.json`, `player-data.ts` 삭제됨. `usePlayerContext()` 사용
2. **환경변수**: Vercel 프로덕션에도 동일하게 설정 필요
3. **한국어 UI**: 모든 사용자 facing 텍스트는 한국어로
