# badeagle85 Workspace

개인 프로젝트들을 관리하는 모노레포입니다.

## 프로젝트

| 프로젝트 | 설명 | 배포 URL | 스택 |
|---------|------|----------|------|
| **card** | 디지털 카드 생성/공유 서비스 | - | Next.js, Supabase |
| **chaos** | WC3 Chaos 게임 팀 밸런서 | [wc3-chaos.vercel.app](https://wc3-chaos.vercel.app) | Next.js, Supabase |
| **delivery-note** | 배송장 OCR 인식 서비스 | [delivery-note-ebon.vercel.app](https://delivery-note-ebon.vercel.app) | Next.js, Tesseract.js |
| **image-server** | 이미지 업로드/저장 API | [image-server.badeagle85.workers.dev](https://image-server.badeagle85.workers.dev) | Cloudflare Workers, R2 |

## 기술 스택

- **Monorepo**: pnpm workspace + Turborepo
- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Backend**: Supabase, Cloudflare Workers
- **Storage**: Supabase Storage, Cloudflare R2
- **Auth**: Supabase Auth (Google OAuth)

## 시작하기

```bash
# 의존성 설치
pnpm install

# 전체 개발 서버 실행
pnpm dev

# 특정 앱만 실행
pnpm --filter @workspace/chaos dev
pnpm --filter @workspace/delivery-note dev
```

## 빌드

```bash
# 전체 빌드
pnpm build

# 특정 앱만 빌드
pnpm --filter @workspace/chaos build
```

## 프로젝트 구조

```
├── apps/
│   ├── card/            # 디지털 카드 서비스
│   ├── chaos/           # WC3 팀 밸런서
│   ├── delivery-note/   # 배송장 OCR
│   └── image-server/    # 이미지 API (Cloudflare Workers)
├── packages/
│   └── tsconfig/        # 공유 TypeScript 설정
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 배포

| 앱 | 플랫폼 |
|----|--------|
| card | Vercel |
| chaos | Vercel |
| delivery-note | Vercel |
| image-server | Cloudflare Workers |
