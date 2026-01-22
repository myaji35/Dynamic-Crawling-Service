# API 계약: 프로젝트 관리 (Project Management)

**버전**: 1.0.0
**작성일**: 2025-01-18
**기술 스택**: Next.js API Routes, Prisma, PostgreSQL, OpenAI API

---

## 개요

크롤링 프로젝트의 CRUD 작업, AI 챗봇을 통한 자동 설정, 샘플 크롤링 검증을 제공합니다.

---

## 1. 프로젝트 목록 조회

### `GET /api/projects`

**설명**: 현재 사용자의 모든 프로젝트를 조회합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Query Parameters**:

- `status` (optional): `active` | `paused` | `archived` | `all` (default: `active`)
- `limit` (optional): 1-100 (default: 20)
- `offset` (optional): 페이지네이션 오프셋 (default: 0)
- `sortBy` (optional): `createdAt` | `lastRunAt` | `name` (default: `lastRunAt`)
- `order` (optional): `asc` | `desc` (default: `desc`)

**Success Response** (200 OK):

```json
{
  "success": true,
  "projects": [
    {
      "id": "clx1a2b3c",
      "name": "전국 지자체 데이터 수집",
      "description": "256개 지자체 기관명, 주소, 전화번호 크롤링",
      "status": "active",
      "scheduleType": "daily",
      "scheduleCron": "0 3 * * *",
      "lastRunAt": "2025-01-18T03:00:00Z",
      "createdAt": "2025-01-15T10:00:00Z",
      "urlCount": 256,
      "fieldCount": 4 // selectors 개수
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

**Error Responses**:

- **401 Unauthorized**: 인증 필요
- **400 Bad Request**: 잘못된 쿼리 파라미터

---

## 2. 프로젝트 상세 조회

### `GET /api/projects/{projectId}`

**설명**: 특정 프로젝트의 상세 정보를 조회합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "project": {
    "id": "clx1a2b3c",
    "name": "전국 지자체 데이터 수집",
    "description": "256개 지자체 기관명, 주소, 전화번호 크롤링",
    "status": "active",

    // 크롤링 설정
    "urls": [
      "https://example.com/seoul",
      "https://example.com/busan"
      // ... 256개
    ],
    "selectors": {
      "기관명": "h1.title",
      "주소": ".address",
      "전화번호": ".contact-phone",
      "웹사이트": "a.website"
    },

    // 스케줄 설정
    "scheduleType": "daily",
    "scheduleCron": "0 3 * * *",
    "scheduleDescription": "매일 오전 3시", // UI 표시용

    // 알림 설정
    "notifyGoogleChat": "https://chat.googleapis.com/v1/spaces/xxx/messages?key=yyy",

    // 메타데이터
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-18T10:00:00Z",
    "lastRunAt": "2025-01-18T03:00:00Z",

    // 통계
    "stats": {
      "totalRuns": 3,
      "successfulRuns": 3,
      "failedRuns": 0,
      "totalDataPoints": 768, // 256 URLs × 3 runs
      "lastRunStatus": "completed",
      "lastRunDuration": 45 // 초
    }
  }
}
```

**Error Responses**:

- **404 Not Found**: 프로젝트 없음 또는 권한 없음
  ```json
  {
    "success": false,
    "error": {
      "code": "PROJECT_NOT_FOUND",
      "message": "프로젝트를 찾을 수 없습니다."
    }
  }
  ```

---

## 3. 프로젝트 생성 (AI 챗봇 통합)

### `POST /api/projects`

**설명**: AI 챗봇을 통해 수집한 설정으로 새 프로젝트를 생성합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Request Body**:

```json
{
  "name": "전국 지자체 데이터 수집",
  "description": "256개 지자체 기관명, 주소, 전화번호 크롤링",
  "urls": ["https://example.com/seoul", "https://example.com/busan"],
  "selectors": {
    "기관명": "h1.title",
    "주소": ".address",
    "전화번호": ".contact-phone"
  },
  "scheduleType": "daily",
  "scheduleCron": "0 3 * * *",
  "notifyGoogleChat": "https://chat.googleapis.com/v1/spaces/xxx/messages?key=yyy" // optional
}
```

**Request Validation**:

- `name`: 1-200자, 필수
- `urls`: 1-10,000개, 각 URL 유효성 검증
- `selectors`: 1-50개 필드, CSS Selector 문법 검증
- `scheduleType`: `manual` | `hourly` | `daily` | `weekly` | `monthly`
- `scheduleCron`: scheduleType이 manual이 아닐 때 필수

**Success Response** (201 Created):

```json
{
  "success": true,
  "project": {
    "id": "clx1a2b3c",
    "name": "전국 지자체 데이터 수집",
    "status": "active",
    "createdAt": "2025-01-18T10:00:00Z"
  },
  "nextSteps": {
    "message": "프로젝트가 생성되었습니다. 샘플 크롤링을 실행하여 설정을 검증하세요.",
    "sampleCrawlingUrl": "/api/crawling/sample?projectId=clx1a2b3c"
  }
}
```

**Error Responses**:

- **400 Bad Request** - 입력 검증 실패:

  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "CSS Selector 형식이 올바르지 않습니다.",
      "fields": {
        "selectors.기관명": "올바른 CSS Selector가 아닙니다: 'invalid>>selector'"
      }
    }
  }
  ```

- **402 Payment Required** - 프로젝트 개수 제한 (무료 플랜: 5개):
  ```json
  {
    "success": false,
    "error": {
      "code": "PROJECT_LIMIT_EXCEEDED",
      "message": "무료 플랜에서는 최대 5개의 프로젝트만 생성할 수 있습니다."
    }
  }
  ```

---

## 4. AI 챗봇 - CSS Selector 추천

### `POST /api/projects/ai/recommend-selectors`

**설명**: HTML 샘플과 필드명을 기반으로 CSS Selector를 자동 추천합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Request Body**:

```json
{
  "sampleUrl": "https://example.com/page1",
  "fields": ["기관명", "주소", "전화번호", "웹사이트"]
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "recommendations": {
    "기관명": {
      "selector": "h1.title",
      "confidence": 0.95,
      "sampleValue": "서울특별시청",
      "reasoning": "페이지의 주요 제목(h1)이며 'title' 클래스를 가지고 있어 기관명으로 판단됩니다."
    },
    "주소": {
      "selector": ".address",
      "confidence": 0.88,
      "sampleValue": "서울특별시 중구 세종대로 110",
      "reasoning": "'address' 클래스를 가진 요소가 주소 형식의 텍스트를 포함하고 있습니다."
    },
    "전화번호": {
      "selector": ".contact-phone",
      "confidence": 0.92,
      "sampleValue": "02-120",
      "reasoning": "'contact-phone' 클래스를 가진 요소가 전화번호 형식을 포함합니다."
    },
    "웹사이트": {
      "selector": "a.website",
      "confidence": 0.85,
      "sampleValue": "https://www.seoul.go.kr",
      "reasoning": "'website' 클래스를 가진 링크 요소입니다."
    }
  },
  "warnings": [
    {
      "field": "웹사이트",
      "message": "여러 링크가 발견되었습니다. 가장 적합한 것을 선택했으나 확인이 필요합니다."
    }
  ]
}
```

**Error Responses**:

- **400 Bad Request** - URL 크롤링 실패:

  ```json
  {
    "success": false,
    "error": {
      "code": "CRAWL_FAILED",
      "message": "샘플 URL을 불러올 수 없습니다. URL을 확인해주세요.",
      "details": "HTTP 404 Not Found"
    }
  }
  ```

- **503 Service Unavailable** - OpenAI API 오류:
  ```json
  {
    "success": false,
    "error": {
      "code": "AI_SERVICE_ERROR",
      "message": "AI 추천 서비스가 일시적으로 사용 불가능합니다. 잠시 후 다시 시도해주세요."
    }
  }
  ```

**구현 참고사항**:

- Playwright로 HTML 페치 (JavaScript 렌더링 대기)
- HTML을 OpenAI GPT-4에 전달하여 Selector 추천
- 추천된 Selector로 실제 크롤링 테스트 수행 (검증)
- 타임아웃: 30초

---

## 5. AI 챗봇 - Cron 표현식 변환

### `POST /api/projects/ai/generate-cron`

**설명**: 자연어 스케줄을 Cron 표현식으로 변환합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Request Body**:

```json
{
  "naturalLanguage": "매일 오전 3시"
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "cron": "0 3 * * *",
  "description": "매일 오전 3시",
  "nextRun": "2025-01-19T03:00:00Z",
  "scheduleType": "daily"
}
```

**Additional Examples**:

```json
// Input: "매주 월요일 오전 9시"
{
  "cron": "0 9 * * 1",
  "description": "매주 월요일 오전 9시",
  "scheduleType": "weekly"
}

// Input: "매달 1일 새벽 2시"
{
  "cron": "0 2 1 * *",
  "description": "매달 1일 새벽 2시",
  "scheduleType": "monthly"
}

// Input: "매시간"
{
  "cron": "0 * * * *",
  "description": "매시간 정각",
  "scheduleType": "hourly"
}
```

**Error Responses**:

- **400 Bad Request** - 해석 불가능한 입력:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_SCHEDULE",
      "message": "스케줄을 해석할 수 없습니다. 예: '매일 오전 3시', '매주 월요일 오전 9시'"
    }
  }
  ```

---

## 6. 프로젝트 수정

### `PATCH /api/projects/{projectId}`

**설명**: 프로젝트 설정을 수정합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Request Body** (부분 업데이트 지원):

```json
{
  "name": "전국 지자체 데이터 수집 (수정됨)",
  "status": "paused",
  "scheduleType": "weekly",
  "scheduleCron": "0 9 * * 1"
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "project": {
    "id": "clx1a2b3c",
    "name": "전국 지자체 데이터 수집 (수정됨)",
    "status": "paused",
    "updatedAt": "2025-01-18T11:00:00Z"
  }
}
```

**Error Responses**:

- **404 Not Found**: 프로젝트 없음
- **400 Bad Request**: 입력 검증 실패

**구현 참고사항**:

- `status`를 `paused`로 변경 시 Cloud Scheduler 작업 일시 중지
- `status`를 `active`로 재변경 시 스케줄 재개

---

## 7. 프로젝트 삭제

### `DELETE /api/projects/{projectId}`

**설명**: 프로젝트와 연관된 모든 데이터를 삭제합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "프로젝트가 삭제되었습니다.",
  "deletedData": {
    "crawlingRuns": 3,
    "firestoreDocuments": 768 // 예상치 (백그라운드 삭제)
  }
}
```

**Error Responses**:

- **404 Not Found**: 프로젝트 없음
- **409 Conflict**: 진행 중인 크롤링 작업이 있을 때
  ```json
  {
    "success": false,
    "error": {
      "code": "CRAWLING_IN_PROGRESS",
      "message": "현재 크롤링이 진행 중입니다. 완료 후 삭제해주세요."
    }
  }
  ```

**구현 참고사항**:

- PostgreSQL: CASCADE 삭제 (CrawlingRun, CrawlingTask 자동 삭제)
- Firestore: 백그라운드 작업으로 비동기 삭제 (Cloud Functions 트리거)
- Cloud Scheduler: 스케줄 작업 삭제

---

## 8. 프로젝트 복제

### `POST /api/projects/{projectId}/clone`

**설명**: 기존 프로젝트의 설정을 복사하여 새 프로젝트를 생성합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Request Body**:

```json
{
  "name": "지자체 데이터 수집 (복제본)"
}
```

**Success Response** (201 Created):

```json
{
  "success": true,
  "project": {
    "id": "clx9d0e1f",
    "name": "지자체 데이터 수집 (복제본)",
    "status": "active",
    "createdAt": "2025-01-18T12:00:00Z"
  },
  "message": "프로젝트가 복제되었습니다. urls, selectors, scheduleType이 복사되었습니다."
}
```

**구현 참고사항**:

- 복사되는 항목: `urls`, `selectors`, `scheduleType`, `scheduleCron`
- 복사되지 않는 항목: `lastRunAt`, `notifyGoogleChat` (사용자가 다시 설정)
- 기존 프로젝트의 크롤링 데이터는 복사되지 않음

---

## 보안 고려사항

### 1. Row-Level Security

- 모든 API는 `userId` 기반 필터링 자동 적용 (Prisma Middleware)
- 다른 사용자의 프로젝트 접근 시 404 반환 (403 아님 - 존재 여부 노출 방지)

### 2. 입력 검증

- CSS Selector: XSS 방지 위한 샤닛화 (단, 유효한 Selector 문법 허용)
- URL: 프로토콜 제한 (`http://`, `https://`만 허용)
- Google Chat 웹훅 URL: `https://chat.googleapis.com/` 도메인만 허용

### 3. Rate Limiting

- AI 추천 API: 10회/분 (OpenAI API 비용 절감)
- 프로젝트 생성: 5회/시간 (사용자당)

---

## 헌법 준수

| 원칙                       | 준수 여부 | 설명                                   |
| -------------------------- | --------- | -------------------------------------- |
| I. 사용자 중심의 단순성    | ✅        | AI 챗봇을 통한 Selector/Cron 자동 생성 |
| II. 프로젝트별 동적 스키마 | ✅        | selectors JSON 필드로 유연한 필드 정의 |
| III. AI 기반 자동화        | ✅        | OpenAI 통합, HTML 분석, 자연어 처리    |

**최종 검증**: ✅ 모든 헌법 원칙 충족
