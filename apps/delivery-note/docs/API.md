# Delivery-Note API 설계 문서

## 1. API 개요

### 1.1 기본 정보
- **Base URL**: `/api`
- **인증 방식**: Bearer Token (JWT)
- **Content-Type**: `application/json`
- **파일 업로드**: `multipart/form-data`

### 1.2 공통 응답 형식

```typescript
// 성공 응답
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 에러 응답
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

### 1.3 HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 완료 |
| 400 | 잘못된 요청 |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 422 | 유효성 검증 실패 |
| 500 | 서버 에러 |

---

## 2. 이미지 업로드 API

### 2.1 이미지 업로드

거래명세서 이미지를 업로드합니다.

```
POST /api/upload
Content-Type: multipart/form-data
```

**Request:**
```
file: File (required) - 이미지 파일 (jpg, png, pdf)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "url": "https://storage.example.com/images/uuid.jpg",
    "filename": "거래명세서_20241201.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg",
    "createdAt": "2024-12-01T10:00:00Z"
  }
}
```

**에러:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "지원하지 않는 파일 형식입니다. (jpg, png, pdf만 가능)"
  }
}
```

---

## 3. OCR API

### 3.1 OCR 처리

업로드된 이미지에서 텍스트를 추출합니다.

```
POST /api/ocr
```

**Request:**
```json
{
  "imageUrl": "https://storage.example.com/images/uuid.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "imageUrl": "https://storage.example.com/images/uuid.jpg",
    "rawText": "거래명세서\n2024.12.01\n...",
    "parsedData": {
      "supplier": "ABC전기",
      "date": "2024-12-01",
      "documentNumber": "2024120001",
      "items": [
        {
          "sequence": 1,
          "name": "CBR 100AF 2P (SEC-102 60A)",
          "quantity": 10,
          "unit": "EA",
          "unitPrice": 50000,
          "amount": 500000
        },
        {
          "sequence": 2,
          "name": "ELB 3P 50AF 30A",
          "quantity": 5,
          "unit": "EA",
          "unitPrice": 30000,
          "amount": 150000
        }
      ],
      "totalAmount": 650000
    },
    "confidence": 95.5,
    "processedAt": "2024-12-01T10:00:05Z"
  }
}
```

### 3.2 OCR 결과 수정

OCR 추출 결과를 수동으로 수정합니다.

```
PUT /api/ocr/:id
```

**Request:**
```json
{
  "parsedData": {
    "supplier": "ABC전기 (수정됨)",
    "items": [
      {
        "sequence": 1,
        "name": "CBR 100AF 2P (SEC-102 60A)",
        "quantity": 12,
        "unit": "EA",
        "unitPrice": 50000,
        "amount": 600000
      }
    ]
  }
}
```

---

## 4. 품명 변환 API

### 4.1 품명 일괄 변환

OCR로 추출된 품명들을 표준 품명으로 변환합니다.

```
POST /api/convert
```

**Request:**
```json
{
  "items": [
    {
      "originalName": "CBR 100AF 2P (SEC-102 60A)",
      "manufacturer": "SEC"
    },
    {
      "originalName": "ELB 3P 50AF 30A",
      "manufacturer": "LS"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "originalName": "CBR 100AF 2P (SEC-102 60A)",
        "convertedName": "누전차단기 2P100AF[小] 60A",
        "standardProductId": "uuid-1",
        "matchType": "exact",
        "confidence": 100,
        "mappingId": "mapping-uuid-1"
      },
      {
        "originalName": "ELB 3P 50AF 30A",
        "convertedName": "누전차단기 3P50AF 30A",
        "standardProductId": "uuid-2",
        "matchType": "ai",
        "confidence": 87.5,
        "suggestions": [
          {
            "name": "누전차단기 3P50AF 30A",
            "confidence": 87.5
          },
          {
            "name": "배선용차단기 3P50AF 30A",
            "confidence": 72.3
          }
        ]
      }
    ],
    "summary": {
      "total": 2,
      "exactMatch": 1,
      "aiMatch": 1,
      "noMatch": 0
    }
  }
}
```

### 4.2 단일 품명 변환

단일 품명을 변환합니다.

```
POST /api/convert/single
```

**Request:**
```json
{
  "originalName": "CBR 100AF 2P (SEC-102 60A)",
  "manufacturer": "SEC"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalName": "CBR 100AF 2P (SEC-102 60A)",
    "convertedName": "누전차단기 2P100AF[小] 60A",
    "standardProductId": "uuid",
    "matchType": "exact",
    "confidence": 100
  }
}
```

### 4.3 AI 유사도 분석

AI를 사용하여 유사한 표준 품명을 추천합니다.

```
POST /api/convert/suggest
```

**Request:**
```json
{
  "originalName": "미확인 품명 ABC",
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "originalName": "미확인 품명 ABC",
    "suggestions": [
      {
        "id": "uuid-1",
        "name": "누전차단기 2P100AF[小] 60A",
        "category": "차단기",
        "confidence": 65.2,
        "reason": "용량 및 극수 패턴 유사"
      },
      {
        "id": "uuid-2",
        "name": "배선용차단기 2P100AF",
        "category": "차단기",
        "confidence": 58.7,
        "reason": "차단기 유형 유사"
      }
    ]
  }
}
```

---

## 5. 매핑 관리 API

### 5.1 매핑 목록 조회

```
GET /api/mappings
```

**Query Parameters:**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| page | number | 1 | 페이지 번호 |
| limit | number | 20 | 페이지당 항목 수 |
| search | string | | 검색어 (원본 품명) |
| manufacturer | string | | 제조사 필터 |
| standardProductId | string | | 표준 품명 필터 |
| isActive | boolean | true | 활성 상태 필터 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "originalName": "CBR 100AF 2P (SEC-102 60A)",
      "manufacturer": "SEC",
      "standardProduct": {
        "id": "uuid",
        "name": "누전차단기 2P100AF[小] 60A",
        "category": "차단기"
      },
      "confidence": 100,
      "matchCount": 45,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 5.2 매핑 등록

```
POST /api/mappings
```

**Request:**
```json
{
  "originalName": "새로운 품명 ABC",
  "manufacturer": "LS",
  "standardProductId": "uuid",
  "confidence": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "originalName": "새로운 품명 ABC",
    "manufacturer": "LS",
    "standardProductId": "uuid",
    "confidence": 100,
    "isActive": true,
    "createdAt": "2024-12-01T10:00:00Z"
  }
}
```

### 5.3 매핑 수정

```
PUT /api/mappings/:id
```

**Request:**
```json
{
  "standardProductId": "new-uuid",
  "confidence": 95,
  "isActive": true
}
```

### 5.4 매핑 삭제

```
DELETE /api/mappings/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "매핑이 삭제되었습니다."
  }
}
```

---

## 6. 표준 품명 API

### 6.1 표준 품명 목록 조회

```
GET /api/standard-products
```

**Query Parameters:**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| page | number | 1 | 페이지 번호 |
| limit | number | 20 | 페이지당 항목 수 |
| search | string | | 검색어 |
| category | string | | 카테고리 필터 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "누전차단기 2P100AF[小] 60A",
      "category": "차단기",
      "subCategory": "누전차단기",
      "unit": "EA",
      "specifications": {
        "type": "누전차단기",
        "poles": "2P",
        "frame": "100AF",
        "size": "小",
        "rating": "60A"
      },
      "mappingCount": 15,
      "isActive": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25
  }
}
```

### 6.2 표준 품명 등록

```
POST /api/standard-products
```

**Request:**
```json
{
  "name": "새로운 표준 품명",
  "category": "차단기",
  "subCategory": "누전차단기",
  "unit": "EA",
  "specifications": {
    "type": "누전차단기",
    "poles": "2P",
    "frame": "100AF"
  },
  "keywords": ["ELB", "누전", "2P"]
}
```

### 6.3 표준 품명 수정

```
PUT /api/standard-products/:id
```

### 6.4 표준 품명 삭제

```
DELETE /api/standard-products/:id
```

---

## 7. 거래 API

### 7.1 거래 목록 조회

```
GET /api/transactions
```

**Query Parameters:**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| page | number | 1 | 페이지 번호 |
| limit | number | 20 | 페이지당 항목 수 |
| startDate | string | | 시작일 (YYYY-MM-DD) |
| endDate | string | | 종료일 (YYYY-MM-DD) |
| supplierId | string | | 거래처 ID |
| status | string | | 상태 필터 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "supplier": {
        "id": "uuid",
        "name": "ABC전기"
      },
      "transactionDate": "2024-12-01",
      "documentNumber": "2024120001",
      "itemCount": 10,
      "totalAmount": 1500000,
      "status": "confirmed",
      "createdAt": "2024-12-01T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 7.2 거래 상세 조회

```
GET /api/transactions/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "supplier": {
      "id": "uuid",
      "name": "ABC전기"
    },
    "transactionDate": "2024-12-01",
    "documentNumber": "2024120001",
    "imageUrl": "https://storage.example.com/images/uuid.jpg",
    "items": [
      {
        "id": "item-uuid",
        "sequence": 1,
        "originalName": "CBR 100AF 2P (SEC-102 60A)",
        "convertedName": "누전차단기 2P100AF[小] 60A",
        "standardProduct": {
          "id": "uuid",
          "name": "누전차단기 2P100AF[小] 60A",
          "category": "차단기"
        },
        "quantity": 10,
        "unit": "EA",
        "unitPrice": 50000,
        "amount": 500000,
        "matchConfidence": 100,
        "isManualMatch": false
      }
    ],
    "totalAmount": 1500000,
    "status": "confirmed",
    "createdAt": "2024-12-01T10:00:00Z"
  }
}
```

### 7.3 거래 저장

```
POST /api/transactions
```

**Request:**
```json
{
  "supplierId": "uuid",
  "transactionDate": "2024-12-01",
  "documentNumber": "2024120001",
  "imageUrl": "https://storage.example.com/images/uuid.jpg",
  "ocrRawText": "원본 OCR 텍스트...",
  "items": [
    {
      "sequence": 1,
      "originalName": "CBR 100AF 2P (SEC-102 60A)",
      "convertedName": "누전차단기 2P100AF[小] 60A",
      "standardProductId": "uuid",
      "quantity": 10,
      "unit": "EA",
      "unitPrice": 50000,
      "amount": 500000,
      "matchConfidence": 100,
      "isManualMatch": false,
      "mappingId": "mapping-uuid"
    }
  ]
}
```

### 7.4 거래 상태 변경

```
PATCH /api/transactions/:id/status
```

**Request:**
```json
{
  "status": "confirmed"
}
```

### 7.5 거래 삭제

```
DELETE /api/transactions/:id
```

---

## 8. 내보내기 API

### 8.1 Excel 내보내기

```
POST /api/export/excel
```

**Request:**
```json
{
  "transactionIds": ["uuid-1", "uuid-2"],
  "columns": ["date", "supplier", "originalName", "convertedName", "quantity", "amount"],
  "format": "xlsx"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://storage.example.com/exports/uuid.xlsx",
    "filename": "거래내역_20241201.xlsx",
    "expiresAt": "2024-12-01T11:00:00Z"
  }
}
```

### 8.2 CSV 내보내기

```
POST /api/export/csv
```

**Request:**
```json
{
  "transactionIds": ["uuid-1", "uuid-2"],
  "columns": ["date", "supplier", "originalName", "convertedName", "quantity", "amount"]
}
```

---

## 9. 거래처 API

### 9.1 거래처 목록

```
GET /api/suppliers
```

### 9.2 거래처 등록

```
POST /api/suppliers
```

**Request:**
```json
{
  "name": "ABC전기",
  "code": "ABC001",
  "contact": "02-1234-5678",
  "address": "서울시 강남구..."
}
```

### 9.3 거래처 수정

```
PUT /api/suppliers/:id
```

### 9.4 거래처 삭제

```
DELETE /api/suppliers/:id
```

---

## 10. 통계 API

### 10.1 대시보드 통계

```
GET /api/stats/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "todayTransactions": 15,
    "monthlyTransactions": 320,
    "totalMappings": 1500,
    "averageMatchRate": 94.5,
    "recentActivity": [
      {
        "type": "transaction",
        "description": "거래 처리 완료",
        "timestamp": "2024-12-01T10:00:00Z"
      }
    ]
  }
}
```

### 10.2 품목별 통계

```
GET /api/stats/products
```

**Query Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| startDate | string | 시작일 |
| endDate | string | 종료일 |
| groupBy | string | 그룹 기준 (category, product) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "category": "차단기",
      "transactionCount": 150,
      "totalQuantity": 2500,
      "totalAmount": 125000000
    }
  ]
}
```
