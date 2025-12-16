# Delivery-Note 기술 아키텍처

## 1. 시스템 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Zustand   │  │ React Query │  │     React Components    │  │
│  │   (State)   │  │  (Cache)    │  │     + Tailwind CSS      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js 14 (App Router)                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API Routes                            │    │
│  │  /api/upload  /api/ocr  /api/convert  /api/mappings     │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Server Actions                        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │  Cloud Storage  │  │  External APIs  │
│   (Supabase)    │  │  (R2 / S3)      │  │  (OCR / AI)     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 2. 기술 스택 상세

### 2.1 프론트엔드

| 기술 | 버전 | 용도 |
|-----|------|-----|
| Next.js | 14.x | React 프레임워크, App Router |
| React | 18.x | UI 라이브러리 |
| TypeScript | 5.x | 타입 안정성 |
| Tailwind CSS | 3.x | 유틸리티 기반 스타일링 |
| Zustand | 4.x | 전역 상태 관리 |
| TanStack Query | 5.x | 서버 상태 관리, 캐싱 |
| shadcn/ui | latest | UI 컴포넌트 라이브러리 |
| React Hook Form | 7.x | 폼 상태 관리 |
| Zod | 3.x | 스키마 유효성 검증 |

### 2.2 백엔드

| 기술 | 버전 | 용도 |
|-----|------|-----|
| Next.js API Routes | 14.x | API 엔드포인트 |
| Prisma | 5.x | ORM, 데이터베이스 관리 |
| PostgreSQL | 15.x | 관계형 데이터베이스 |
| Supabase | latest | BaaS, 인증, 스토리지 |

### 2.3 외부 서비스

| 서비스 | 용도 |
|--------|-----|
| Google Cloud Vision API | OCR 텍스트 추출 |
| OpenAI API | 품명 유사도 분석, 자동 매칭 |
| Cloudflare R2 | 이미지 저장소 |
| Vercel | 호스팅, 배포 |

---

## 3. 폴더 구조

```
delivery-note/
├── docs/                      # 프로젝트 문서
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   └── API.md
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # 인증 관련 라우트 그룹
│   │   │   ├── login/
│   │   │   └── register/
│   │   │
│   │   ├── (dashboard)/      # 대시보드 라우트 그룹
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx      # 메인 대시보드
│   │   │   ├── upload/       # 업로드 페이지
│   │   │   ├── history/      # 처리 이력
│   │   │   ├── mappings/     # 품명 매핑 관리
│   │   │   └── settings/     # 설정
│   │   │
│   │   ├── api/              # API Routes
│   │   │   ├── upload/
│   │   │   ├── ocr/
│   │   │   ├── convert/
│   │   │   ├── mappings/
│   │   │   └── export/
│   │   │
│   │   ├── layout.tsx        # 루트 레이아웃
│   │   ├── page.tsx          # 랜딩 페이지
│   │   └── globals.css
│   │
│   ├── components/           # React 컴포넌트
│   │   ├── ui/              # shadcn/ui 컴포넌트
│   │   ├── layout/          # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── upload/          # 업로드 관련 컴포넌트
│   │   │   ├── DropZone.tsx
│   │   │   ├── ImagePreview.tsx
│   │   │   └── UploadProgress.tsx
│   │   ├── ocr/             # OCR 관련 컴포넌트
│   │   │   ├── OcrResult.tsx
│   │   │   └── OcrEditor.tsx
│   │   ├── convert/         # 변환 관련 컴포넌트
│   │   │   ├── ConvertTable.tsx
│   │   │   ├── MappingModal.tsx
│   │   │   └── ProductMatcher.tsx
│   │   └── common/          # 공통 컴포넌트
│   │       ├── DataTable.tsx
│   │       ├── SearchBar.tsx
│   │       └── ExportButton.tsx
│   │
│   ├── hooks/               # Custom Hooks
│   │   ├── useUpload.ts
│   │   ├── useOcr.ts
│   │   ├── useConvert.ts
│   │   └── useMappings.ts
│   │
│   ├── stores/              # Zustand Stores
│   │   ├── uploadStore.ts
│   │   ├── ocrStore.ts
│   │   └── uiStore.ts
│   │
│   ├── lib/                 # 유틸리티 및 설정
│   │   ├── prisma.ts        # Prisma 클라이언트
│   │   ├── supabase.ts      # Supabase 클라이언트
│   │   ├── openai.ts        # OpenAI 클라이언트
│   │   ├── ocr.ts           # OCR 처리 로직
│   │   ├── utils.ts         # 공통 유틸리티
│   │   └── constants.ts     # 상수 정의
│   │
│   ├── services/            # 비즈니스 로직
│   │   ├── uploadService.ts
│   │   ├── ocrService.ts
│   │   ├── convertService.ts
│   │   └── mappingService.ts
│   │
│   └── types/               # TypeScript 타입 정의
│       ├── database.ts
│       ├── api.ts
│       └── common.ts
│
├── prisma/
│   ├── schema.prisma        # 데이터베이스 스키마
│   ├── migrations/          # 마이그레이션 파일
│   └── seed.ts              # 시드 데이터
│
├── public/                  # 정적 파일
│
├── .env.local              # 환경 변수 (로컬)
├── .env.example            # 환경 변수 예시
├── next.config.js          # Next.js 설정
├── tailwind.config.ts      # Tailwind 설정
├── tsconfig.json           # TypeScript 설정
└── package.json
```

---

## 4. 데이터 흐름

### 4.1 이미지 업로드 → 품명 변환 흐름

```
1. 이미지 업로드
   User → DropZone → uploadStore → POST /api/upload → Cloud Storage

2. OCR 처리
   Cloud Storage URL → POST /api/ocr → Google Vision API → OCR 결과 반환

3. 품명 추출 및 파싱
   OCR 텍스트 → 테이블 구조 파싱 → 품명 목록 추출

4. 품명 변환
   품명 목록 → POST /api/convert → DB 매핑 조회 + AI 유사도 분석 → 변환 결과

5. 결과 저장
   변환 결과 확인 → POST /api/transactions → PostgreSQL 저장
```

### 4.2 상태 관리 구조

```typescript
// Zustand Store 구조

// uploadStore - 업로드 상태 관리
{
  files: File[],
  uploadProgress: number,
  isUploading: boolean,
  uploadedUrls: string[],
}

// ocrStore - OCR 결과 관리
{
  ocrResults: OcrResult[],
  isProcessing: boolean,
  selectedResult: OcrResult | null,
}

// uiStore - UI 상태 관리
{
  sidebarOpen: boolean,
  theme: 'light' | 'dark',
  activeTab: string,
}
```

### 4.3 React Query 캐싱 전략

```typescript
// 캐싱 키 구조
{
  mappings: ['mappings'],                    // 매핑 목록
  mapping: ['mapping', id],                  // 단일 매핑
  transactions: ['transactions', filters],   // 거래 목록
  transaction: ['transaction', id],          // 단일 거래
  standardProducts: ['standardProducts'],    // 표준 품명 목록
}

// staleTime / gcTime 설정
{
  mappings: { staleTime: 5분, gcTime: 30분 },       // 자주 변경되지 않음
  transactions: { staleTime: 1분, gcTime: 10분 },   // 비교적 자주 조회
  standardProducts: { staleTime: 10분, gcTime: 1시간 }, // 거의 변경 안됨
}
```

---

## 5. API 설계 원칙

### 5.1 RESTful 규칙
- 리소스 기반 URL 설계
- HTTP 메서드 활용 (GET, POST, PUT, DELETE)
- 일관된 응답 형식

### 5.2 응답 형식

```typescript
// 성공 응답
{
  success: true,
  data: T,
  meta?: {
    page: number,
    limit: number,
    total: number,
  }
}

// 에러 응답
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any,
  }
}
```

### 5.3 에러 처리
- 400: 잘못된 요청
- 401: 인증 필요
- 403: 권한 없음
- 404: 리소스 없음
- 500: 서버 에러

---

## 6. 보안 고려사항

### 6.1 인증 및 인가
- Supabase Auth 활용
- JWT 토큰 기반 인증
- Row Level Security (RLS)

### 6.2 데이터 보안
- HTTPS 적용
- 환경 변수로 시크릿 관리
- 입력값 검증 (Zod)

### 6.3 파일 업로드 보안
- 파일 타입 검증
- 파일 크기 제한
- 바이러스 스캔 (선택)

---

## 7. 성능 최적화

### 7.1 프론트엔드
- 이미지 최적화 (Next.js Image)
- 코드 스플리팅
- React Query 캐싱

### 7.2 백엔드
- 데이터베이스 인덱싱
- 쿼리 최적화
- 페이지네이션

### 7.3 인프라
- CDN 활용
- Edge Functions (Vercel)
- 이미지 압축
