# Delivery-Note 데이터베이스 설계

## 1. ERD (Entity Relationship Diagram)

```
┌─────────────────────┐       ┌─────────────────────┐
│      suppliers      │       │   standard_products │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ name                │       │ name                │
│ code                │       │ category            │
│ contact             │       │ unit                │
│ address             │       │ specifications      │
│ created_at          │       │ created_at          │
│ updated_at          │       │ updated_at          │
└─────────────────────┘       └─────────────────────┘
         │                              │
         │                              │
         ▼                              ▼
┌─────────────────────┐       ┌─────────────────────┐
│    transactions     │       │   product_mappings  │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ supplier_id (FK)    │       │ standard_product_id │
│ transaction_date    │       │ original_name       │
│ image_url           │       │ manufacturer        │
│ ocr_raw_text        │       │ pattern             │
│ total_amount        │       │ confidence          │
│ status              │       │ is_active           │
│ created_at          │       │ created_at          │
│ updated_at          │       │ updated_at          │
└─────────────────────┘       └─────────────────────┘
         │
         │
         ▼
┌─────────────────────┐
│  transaction_items  │
├─────────────────────┤
│ id (PK)             │
│ transaction_id (FK) │
│ original_name       │
│ converted_name      │
│ standard_product_id │
│ quantity            │
│ unit_price          │
│ amount              │
│ match_confidence    │
│ is_manual_match     │
│ created_at          │
└─────────────────────┘
```

---

## 2. 테이블 상세 설계

### 2.1 suppliers (거래처)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 고유 식별자 |
| name | VARCHAR(100) | NOT NULL | 거래처명 |
| code | VARCHAR(50) | UNIQUE | 거래처 코드 |
| contact | VARCHAR(50) | | 연락처 |
| address | TEXT | | 주소 |
| memo | TEXT | | 메모 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 수정일시 |

**인덱스:**
- `idx_suppliers_name` ON name
- `idx_suppliers_code` ON code

---

### 2.2 standard_products (표준 품명)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 고유 식별자 |
| name | VARCHAR(200) | NOT NULL, UNIQUE | 표준 품명 |
| category | VARCHAR(100) | | 카테고리 (차단기, 전선 등) |
| sub_category | VARCHAR(100) | | 하위 카테고리 |
| unit | VARCHAR(20) | DEFAULT 'EA' | 단위 |
| specifications | JSONB | | 상세 스펙 (용량, 극수 등) |
| keywords | TEXT[] | | 검색 키워드 배열 |
| is_active | BOOLEAN | DEFAULT true | 활성 상태 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 수정일시 |

**인덱스:**
- `idx_standard_products_name` ON name
- `idx_standard_products_category` ON category
- `idx_standard_products_keywords` ON keywords (GIN)

**specifications JSONB 예시:**
```json
{
  "type": "누전차단기",
  "poles": "2P",
  "frame": "100AF",
  "size": "小",
  "rating": "60A"
}
```

---

### 2.3 product_mappings (품명 매핑)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 고유 식별자 |
| standard_product_id | UUID | FK → standard_products.id | 표준 품명 ID |
| original_name | VARCHAR(300) | NOT NULL | 원본 품명 (거래명세서) |
| manufacturer | VARCHAR(100) | | 제조사 |
| pattern | VARCHAR(300) | | 정규식 패턴 |
| confidence | DECIMAL(5,2) | DEFAULT 100.00 | 매칭 신뢰도 |
| match_count | INTEGER | DEFAULT 0 | 매칭 횟수 |
| is_active | BOOLEAN | DEFAULT true | 활성 상태 |
| created_by | VARCHAR(100) | | 등록자 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 수정일시 |

**인덱스:**
- `idx_product_mappings_original_name` ON original_name
- `idx_product_mappings_standard_product_id` ON standard_product_id
- `idx_product_mappings_manufacturer` ON manufacturer

**UNIQUE 제약조건:**
- `uq_mapping_original_manufacturer` ON (original_name, manufacturer)

---

### 2.4 transactions (거래)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 고유 식별자 |
| supplier_id | UUID | FK → suppliers.id | 거래처 ID |
| transaction_date | DATE | NOT NULL | 거래일자 |
| document_number | VARCHAR(100) | | 문서번호 |
| image_url | TEXT | | 원본 이미지 URL |
| ocr_raw_text | TEXT | | OCR 원본 텍스트 |
| total_amount | DECIMAL(15,2) | DEFAULT 0 | 총 금액 |
| item_count | INTEGER | DEFAULT 0 | 품목 수 |
| status | VARCHAR(20) | DEFAULT 'pending' | 상태 |
| memo | TEXT | | 메모 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 수정일시 |

**상태값:**
- `pending`: 처리 대기
- `processing`: OCR 처리 중
- `converted`: 변환 완료
- `confirmed`: 확정
- `exported`: 내보내기 완료

**인덱스:**
- `idx_transactions_supplier_id` ON supplier_id
- `idx_transactions_date` ON transaction_date
- `idx_transactions_status` ON status
- `idx_transactions_created_at` ON created_at DESC

---

### 2.5 transaction_items (거래 품목)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | 고유 식별자 |
| transaction_id | UUID | FK → transactions.id | 거래 ID |
| sequence | INTEGER | NOT NULL | 순번 |
| original_name | VARCHAR(300) | NOT NULL | 원본 품명 |
| converted_name | VARCHAR(300) | | 변환된 품명 |
| standard_product_id | UUID | FK → standard_products.id | 표준 품명 ID |
| quantity | DECIMAL(10,2) | DEFAULT 1 | 수량 |
| unit | VARCHAR(20) | DEFAULT 'EA' | 단위 |
| unit_price | DECIMAL(15,2) | DEFAULT 0 | 단가 |
| amount | DECIMAL(15,2) | DEFAULT 0 | 금액 |
| match_confidence | DECIMAL(5,2) | | 매칭 신뢰도 (%) |
| is_manual_match | BOOLEAN | DEFAULT false | 수동 매칭 여부 |
| mapping_id | UUID | FK → product_mappings.id | 사용된 매핑 ID |
| memo | TEXT | | 메모 |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성일시 |

**인덱스:**
- `idx_transaction_items_transaction_id` ON transaction_id
- `idx_transaction_items_standard_product_id` ON standard_product_id
- `idx_transaction_items_original_name` ON original_name

---

## 3. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Supplier {
  id           String        @id @default(uuid())
  name         String        @db.VarChar(100)
  code         String?       @unique @db.VarChar(50)
  contact      String?       @db.VarChar(50)
  address      String?
  memo         String?
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")
  transactions Transaction[]

  @@index([name])
  @@map("suppliers")
}

model StandardProduct {
  id             String           @id @default(uuid())
  name           String           @unique @db.VarChar(200)
  category       String?          @db.VarChar(100)
  subCategory    String?          @map("sub_category") @db.VarChar(100)
  unit           String           @default("EA") @db.VarChar(20)
  specifications Json?
  keywords       String[]
  isActive       Boolean          @default(true) @map("is_active")
  createdAt      DateTime         @default(now()) @map("created_at")
  updatedAt      DateTime         @updatedAt @map("updated_at")
  mappings       ProductMapping[]
  items          TransactionItem[]

  @@index([name])
  @@index([category])
  @@map("standard_products")
}

model ProductMapping {
  id                String           @id @default(uuid())
  standardProductId String           @map("standard_product_id")
  originalName      String           @map("original_name") @db.VarChar(300)
  manufacturer      String?          @db.VarChar(100)
  pattern           String?          @db.VarChar(300)
  confidence        Decimal          @default(100.00) @db.Decimal(5, 2)
  matchCount        Int              @default(0) @map("match_count")
  isActive          Boolean          @default(true) @map("is_active")
  createdBy         String?          @map("created_by") @db.VarChar(100)
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")
  standardProduct   StandardProduct  @relation(fields: [standardProductId], references: [id])
  items             TransactionItem[]

  @@unique([originalName, manufacturer], name: "uq_mapping_original_manufacturer")
  @@index([originalName])
  @@index([standardProductId])
  @@index([manufacturer])
  @@map("product_mappings")
}

model Transaction {
  id              String            @id @default(uuid())
  supplierId      String?           @map("supplier_id")
  transactionDate DateTime          @map("transaction_date") @db.Date
  documentNumber  String?           @map("document_number") @db.VarChar(100)
  imageUrl        String?           @map("image_url")
  ocrRawText      String?           @map("ocr_raw_text")
  totalAmount     Decimal           @default(0) @map("total_amount") @db.Decimal(15, 2)
  itemCount       Int               @default(0) @map("item_count")
  status          String            @default("pending") @db.VarChar(20)
  memo            String?
  createdAt       DateTime          @default(now()) @map("created_at")
  updatedAt       DateTime          @updatedAt @map("updated_at")
  supplier        Supplier?         @relation(fields: [supplierId], references: [id])
  items           TransactionItem[]

  @@index([supplierId])
  @@index([transactionDate])
  @@index([status])
  @@index([createdAt(sort: Desc)])
  @@map("transactions")
}

model TransactionItem {
  id                String           @id @default(uuid())
  transactionId     String           @map("transaction_id")
  sequence          Int
  originalName      String           @map("original_name") @db.VarChar(300)
  convertedName     String?          @map("converted_name") @db.VarChar(300)
  standardProductId String?          @map("standard_product_id")
  quantity          Decimal          @default(1) @db.Decimal(10, 2)
  unit              String           @default("EA") @db.VarChar(20)
  unitPrice         Decimal          @default(0) @map("unit_price") @db.Decimal(15, 2)
  amount            Decimal          @default(0) @db.Decimal(15, 2)
  matchConfidence   Decimal?         @map("match_confidence") @db.Decimal(5, 2)
  isManualMatch     Boolean          @default(false) @map("is_manual_match")
  mappingId         String?          @map("mapping_id")
  memo              String?
  createdAt         DateTime         @default(now()) @map("created_at")
  transaction       Transaction      @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  standardProduct   StandardProduct? @relation(fields: [standardProductId], references: [id])
  mapping           ProductMapping?  @relation(fields: [mappingId], references: [id])

  @@index([transactionId])
  @@index([standardProductId])
  @@index([originalName])
  @@map("transaction_items")
}
```

---

## 4. 샘플 데이터

### 4.1 표준 품명 예시

```sql
INSERT INTO standard_products (id, name, category, sub_category, unit, specifications, keywords) VALUES
(
  uuid_generate_v4(),
  '누전차단기 2P100AF[小] 60A',
  '차단기',
  '누전차단기',
  'EA',
  '{"type": "누전차단기", "poles": "2P", "frame": "100AF", "size": "小", "rating": "60A"}',
  ARRAY['누전차단기', 'ELB', 'ELCB', '2P', '100AF', '60A']
),
(
  uuid_generate_v4(),
  '배선용차단기 3P100AF 75A',
  '차단기',
  '배선용차단기',
  'EA',
  '{"type": "배선용차단기", "poles": "3P", "frame": "100AF", "rating": "75A"}',
  ARRAY['배선용차단기', 'MCCB', '3P', '100AF', '75A']
);
```

### 4.2 품명 매핑 예시

```sql
INSERT INTO product_mappings (standard_product_id, original_name, manufacturer) VALUES
-- 삼성 전기
((SELECT id FROM standard_products WHERE name = '누전차단기 2P100AF[小] 60A'), 'CBR 100AF 2P (SEC-102 60A)', 'SEC'),
-- LS 산전
((SELECT id FROM standard_products WHERE name = '누전차단기 2P100AF[小] 60A'), 'ELB 2P 100AF 60A', 'LS'),
-- 현대일렉트릭
((SELECT id FROM standard_products WHERE name = '누전차단기 2P100AF[小] 60A'), 'ELCB 100AF/60A 2P', '현대');
```

---

## 5. 쿼리 예시

### 5.1 품명 변환 조회

```sql
-- 원본 품명으로 표준 품명 찾기
SELECT
  pm.original_name,
  pm.manufacturer,
  sp.name AS standard_name,
  sp.category,
  pm.confidence
FROM product_mappings pm
JOIN standard_products sp ON pm.standard_product_id = sp.id
WHERE pm.original_name ILIKE '%100AF%2P%'
  AND pm.is_active = true
ORDER BY pm.confidence DESC, pm.match_count DESC
LIMIT 5;
```

### 5.2 거래 내역 조회

```sql
-- 기간별 거래 내역
SELECT
  t.id,
  t.transaction_date,
  s.name AS supplier_name,
  t.item_count,
  t.total_amount,
  t.status
FROM transactions t
LEFT JOIN suppliers s ON t.supplier_id = s.id
WHERE t.transaction_date BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY t.transaction_date DESC;
```

### 5.3 품목별 통계

```sql
-- 품목별 거래 통계
SELECT
  sp.name,
  sp.category,
  COUNT(ti.id) AS transaction_count,
  SUM(ti.quantity) AS total_quantity,
  SUM(ti.amount) AS total_amount
FROM standard_products sp
JOIN transaction_items ti ON sp.id = ti.standard_product_id
JOIN transactions t ON ti.transaction_id = t.id
WHERE t.status = 'confirmed'
GROUP BY sp.id, sp.name, sp.category
ORDER BY total_amount DESC;
```
