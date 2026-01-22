# API 계약: 크롤링 실행 및 데이터 조회

**버전**: 1.0.0
**작성일**: 2025-01-18
**기술 스택**: Next.js API Routes, Prisma, Firestore, Cloud Pub/Sub, Playwright

---

## 개요

크롤링 작업의 수동/자동 실행, 실시간 상태 모니터링, 수집 데이터 조회를 제공합니다.

---

## 1. 수동 크롤링 실행

### `POST /api/crawling/run`

**설명**: 프로젝트의 즉시 크롤링을 실행합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Request Body**:

```json
{
  "projectId": "clx1a2b3c"
}
```

**Success Response** (202 Accepted):

```json
{
  "success": true,
  "run": {
    "id": "clx5d6e7f",
    "projectId": "clx1a2b3c",
    "status": "pending",
    "totalTasks": 256,
    "startedAt": "2025-01-18T10:00:00Z"
  },
  "message": "크롤링이 시작되었습니다. 상태는 대시보드에서 확인할 수 있습니다.",
  "statusUrl": "/api/crawling/runs/clx5d6e7f"
}
```

**Error Responses**:

- **404 Not Found**: 프로젝트 없음
- **409 Conflict**: 이미 진행 중인 크롤링 존재
  ```json
  {
    "success": false,
    "error": {
      "code": "CRAWLING_IN_PROGRESS",
      "message": "이미 진행 중인 크롤링이 있습니다.",
      "currentRunId": "clx5d6e7f"
    }
  }
  ```

**구현 참고사항**:

1. PostgreSQL에 CrawlingRun 레코드 생성 (status: "pending")
2. 각 URL마다 CrawlingTask 레코드 생성
3. Cloud Pub/Sub에 메시지 발행 (병렬 처리)
4. Cloud Run 워커가 메시지를 수신하여 크롤링 실행

---

## 2. 샘플 크롤링 실행 (검증용)

### `POST /api/crawling/sample`

**설명**: 프로젝트 생성 후 설정 검증을 위한 단일 URL 크롤링입니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Request Body**:

```json
{
  "projectId": "clx1a2b3c",
  "sampleUrl": "https://example.com/seoul" // optional, 없으면 urls[0] 사용
}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "sampleData": {
    "기관명": "서울특별시청",
    "주소": "서울특별시 중구 세종대로 110",
    "전화번호": "02-120",
    "웹사이트": "https://www.seoul.go.kr"
  },
  "metadata": {
    "url": "https://example.com/seoul",
    "crawledAt": "2025-01-18T10:05:00Z",
    "crawlDuration": 1234, // 밀리초
    "selectorResults": {
      "기관명": { "found": true, "value": "서울특별시청" },
      "주소": { "found": true, "value": "서울특별시 중구 세종대로 110" },
      "전화번호": { "found": true, "value": "02-120" },
      "웹사이트": { "found": true, "value": "https://www.seoul.go.kr" }
    }
  },
  "warnings": []
}
```

**Error Response with Partial Success**:

```json
{
  "success": true,
  "sampleData": {
    "기관명": "서울특별시청",
    "주소": null, // Selector로 찾지 못함
    "전화번호": "02-120",
    "웹사이트": null
  },
  "metadata": {
    "url": "https://example.com/seoul",
    "crawledAt": "2025-01-18T10:05:00Z",
    "crawlDuration": 1456,
    "selectorResults": {
      "기관명": { "found": true, "value": "서울특별시청" },
      "주소": {
        "found": false,
        "error": "Selector '.address'를 찾을 수 없습니다."
      },
      "전화번호": { "found": true, "value": "02-120" },
      "웹사이트": {
        "found": false,
        "error": "Selector 'a.website'를 찾을 수 없습니다."
      }
    }
  },
  "warnings": [
    {
      "field": "주소",
      "message": "Selector '.address'를 찾을 수 없습니다. Selector를 수정해주세요."
    },
    {
      "field": "웹사이트",
      "message": "Selector 'a.website'를 찾을 수 없습니다. Selector를 수정해주세요."
    }
  ]
}
```

**Error Responses**:

- **400 Bad Request** - 크롤링 완전 실패:
  ```json
  {
    "success": false,
    "error": {
      "code": "CRAWL_FAILED",
      "message": "페이지를 불러올 수 없습니다.",
      "details": "Timeout: 30000ms exceeded"
    }
  }
  ```

**구현 참고사항**:

- 샘플 크롤링은 Firestore에 저장하지 않음 (응답으로만 반환)
- 타임아웃: 30초
- Playwright 헤드리스 모드 사용
- 일부 필드 실패 시에도 성공한 필드는 반환 (warnings 포함)

---

## 3. 크롤링 실행 상태 조회

### `GET /api/crawling/runs/{runId}`

**설명**: 특정 크롤링 실행의 실시간 상태를 조회합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Success Response** (200 OK):

```json
{
  "success": true,
  "run": {
    "id": "clx5d6e7f",
    "projectId": "clx1a2b3c",
    "status": "running", // "pending" | "running" | "completed" | "failed"
    "startedAt": "2025-01-18T10:00:00Z",
    "completedAt": null,

    // 진행 상황
    "totalTasks": 256,
    "successTasks": 128,
    "failedTasks": 5,
    "pendingTasks": 123,
    "progress": 51.95, // (successTasks + failedTasks) / totalTasks * 100

    // 에러 정보 (실패 시)
    "errorMessage": null
  }
}
```

**Completed Example**:

```json
{
  "success": true,
  "run": {
    "id": "clx5d6e7f",
    "projectId": "clx1a2b3c",
    "status": "completed",
    "startedAt": "2025-01-18T10:00:00Z",
    "completedAt": "2025-01-18T10:05:23Z",

    "totalTasks": 256,
    "successTasks": 251,
    "failedTasks": 5,
    "pendingTasks": 0,
    "progress": 100,

    "duration": 323, // 초
    "successRate": 98.05 // successTasks / totalTasks * 100
  }
}
```

**Error Responses**:

- **404 Not Found**: 실행 기록 없음 또는 권한 없음

---

## 4. 크롤링 실행 이력 조회

### `GET /api/crawling/runs`

**설명**: 프로젝트의 모든 크롤링 실행 이력을 조회합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Query Parameters**:

- `projectId` (required): 프로젝트 ID
- `limit` (optional): 1-100 (default: 20)
- `offset` (optional): 페이지네이션 오프셋 (default: 0)
- `status` (optional): `pending` | `running` | `completed` | `failed` | `all` (default: `all`)

**Success Response** (200 OK):

```json
{
  "success": true,
  "runs": [
    {
      "id": "clx5d6e7f",
      "status": "completed",
      "startedAt": "2025-01-18T10:00:00Z",
      "completedAt": "2025-01-18T10:05:23Z",
      "totalTasks": 256,
      "successTasks": 251,
      "failedTasks": 5,
      "duration": 323
    },
    {
      "id": "clx4c5d6e",
      "status": "completed",
      "startedAt": "2025-01-17T03:00:00Z",
      "completedAt": "2025-01-17T03:04:56Z",
      "totalTasks": 256,
      "successTasks": 256,
      "failedTasks": 0,
      "duration": 296
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## 5. 개별 작업 상태 조회

### `GET /api/crawling/tasks`

**설명**: 특정 실행의 개별 URL 작업 상태를 조회합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Query Parameters**:

- `runId` (required): 크롤링 실행 ID
- `status` (optional): `pending` | `success` | `failed` | `all` (default: `all`)
- `limit` (optional): 1-1000 (default: 100)
- `offset` (optional): 페이지네이션 오프셋

**Success Response** (200 OK):

```json
{
  "success": true,
  "tasks": [
    {
      "id": "clx8g9h0i",
      "url": "https://example.com/seoul",
      "status": "success",
      "startedAt": "2025-01-18T10:00:15Z",
      "completedAt": "2025-01-18T10:00:17Z",
      "firestoreDocId": "doc1"
    },
    {
      "id": "clx8g9h1j",
      "url": "https://example.com/busan",
      "status": "failed",
      "startedAt": "2025-01-18T10:00:16Z",
      "completedAt": "2025-01-18T10:00:46Z",
      "errorMessage": "Timeout: 30000ms exceeded",
      "retryCount": 3
    }
  ],
  "pagination": {
    "total": 256,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

**Use Case**: 실패한 작업만 조회하여 디버깅

---

## 6. 실패 작업 재시도

### `POST /api/crawling/retry`

**설명**: 실패한 작업만 선택적으로 재시도합니다.

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Request Body**:

```json
{
  "runId": "clx5d6e7f",
  "taskIds": ["clx8g9h1j", "clx8g9h2k"] // optional, 없으면 모든 실패 작업 재시도
}
```

**Success Response** (202 Accepted):

```json
{
  "success": true,
  "message": "5개 작업이 재시도 큐에 추가되었습니다.",
  "retriedTasks": 5
}
```

**Error Responses**:

- **400 Bad Request**: 재시도 가능한 작업 없음
  ```json
  {
    "success": false,
    "error": {
      "code": "NO_FAILED_TASKS",
      "message": "재시도할 실패 작업이 없습니다."
    }
  }
  ```

**구현 참고사항**:

- 최대 재시도 횟수: 3회
- 3회 초과 시 재시도 불가 (Dead Letter Queue로 이동)
- Pub/Sub 메시지 재발행

---

## 7. 수집 데이터 조회

### `GET /api/data`

**설명**: 프로젝트의 수집된 데이터를 조회합니다. (Firestore)

**Headers**:

```
Authorization: Bearer {sessionToken}
```

**Query Parameters**:

- `projectId` (required): 프로젝트 ID
- `runId` (optional): 특정 실행의 데이터만 조회
- `limit` (optional): 1-1000 (default: 100)
- `offset` (optional): 페이지네이션 오프셋
- `includeMetadata` (optional): `true` | `false` (default: `false`)

**Success Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "기관명": "서울특별시청",
      "주소": "서울특별시 중구 세종대로 110",
      "전화번호": "02-120",
      "웹사이트": "https://www.seoul.go.kr"
    },
    {
      "기관명": "부산광역시청",
      "주소": "부산광역시 연제구 중앙대로 1001",
      "전화번호": "051-120",
      "웹사이트": "https://www.busan.go.kr"
    }
  ],
  "pagination": {
    "total": 768,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

**With Metadata** (`includeMetadata=true`):

```json
{
  "success": true,
  "data": [
    {
      "기관명": "서울특별시청",
      "주소": "서울특별시 중구 세종대로 110",
      "전화번호": "02-120",
      "웹사이트": "https://www.seoul.go.kr",

      "_metadata": {
        "projectId": "clx1a2b3c",
        "runId": "clx5d6e7f",
        "taskId": "clx8g9h0i",
        "url": "https://example.com/seoul",
        "crawledAt": "2025-01-18T10:00:17Z",
        "crawlDuration": 1234
      }
    }
  ],
  "pagination": { ... }
}
```

**Error Responses**:

- **404 Not Found**: 프로젝트 없음 또는 데이터 없음

**구현 참고사항**:

- Firestore 쿼리: `projects/{projectId}/runs/{timestamp}/data`
- 최신순 정렬: `_metadata.crawledAt DESC`
- 커서 기반 페이지네이션 사용 (성능 최적화)

---

## 8. 데이터 내보내기 (API 전용)

### `GET /api/data/export`

**설명**: API 키 기반으로 데이터를 JSON 형식으로 내보냅니다.

**Headers**:

```
Authorization: Bearer {apiKey} // API 키 (세션 토큰 아님)
```

**Query Parameters**:

- `projectId` (required): 프로젝트 ID
- `runId` (optional): 특정 실행의 데이터만
- `limit` (optional): 1-10000 (default: 1000)
- `format` (optional): `json` (default, 향후 확장 가능)

**Success Response** (200 OK):

```json
{
  "success": true,
  "project": {
    "id": "clx1a2b3c",
    "name": "전국 지자체 데이터 수집"
  },
  "exportedAt": "2025-01-18T10:30:00Z",
  "dataCount": 768,
  "data": [
    {
      "기관명": "서울특별시청",
      "주소": "서울특별시 중구 세종대로 110",
      "전화번호": "02-120",
      "웹사이트": "https://www.seoul.go.kr",
      "_metadata": { ... }
    }
    // ... 최대 10,000개
  ]
}
```

**Error Responses**:

- **401 Unauthorized**: API 키 없음 또는 유효하지 않음
- **403 Forbidden**: 권한 없음 (API 키의 permissions 확인)
  ```json
  {
    "success": false,
    "error": {
      "code": "PERMISSION_DENIED",
      "message": "이 API 키는 'read:data' 권한이 없습니다."
    }
  }
  ```

**구현 참고사항**:

- API 키 검증: ApiKey 테이블 조회, keyHash 비교
- 권한 확인: `permissions` 필드에 `"read:data"` 포함 여부
- Rate limiting: API 키당 100회/시간
- `lastUsedAt`, `requestCount` 업데이트

---

## WebSocket (실시간 상태 업데이트)

### `WebSocket /api/crawling/ws?projectId={projectId}`

**설명**: 크롤링 실행 중 실시간 상태 업데이트를 제공합니다. (선택사항)

**Connection**:

```javascript
const ws = new WebSocket(
  'wss://api.example.com/api/crawling/ws?projectId=clx1a2b3c'
)

ws.onmessage = (event) => {
  const update = JSON.parse(event.data)
  console.log(update)
}
```

**Message Format**:

```json
{
  "type": "progress",
  "runId": "clx5d6e7f",
  "totalTasks": 256,
  "successTasks": 150,
  "failedTasks": 2,
  "pendingTasks": 104,
  "progress": 59.38
}
```

**Task Completion Event**:

```json
{
  "type": "task_completed",
  "runId": "clx5d6e7f",
  "taskId": "clx8g9h0i",
  "url": "https://example.com/seoul",
  "status": "success"
}
```

**Run Completed Event**:

```json
{
  "type": "run_completed",
  "runId": "clx5d6e7f",
  "status": "completed",
  "totalTasks": 256,
  "successTasks": 251,
  "failedTasks": 5,
  "duration": 323
}
```

**구현 참고사항**:

- Vercel은 WebSocket을 직접 지원하지 않으므로, Pusher 또는 Ably 같은 서드파티 서비스 활용
- 또는 Server-Sent Events (SSE) 사용
- 클라이언트는 Polling (3초 간격) 폴백 지원

---

## 보안 고려사항

### 1. 권한 검증

- 모든 API는 프로젝트 소유권 확인 (userId 일치)
- API 키 사용 시 permissions 필드 검증

### 2. Rate Limiting

- 수동 크롤링 실행: 10회/시간 (프로젝트당)
- 샘플 크롤링: 20회/시간 (프로젝트당)
- 데이터 조회: 100회/분 (API 키당)

### 3. 데이터 격리

- Firestore Security Rules로 사용자별 데이터 격리
- Cloud Run 워커는 서비스 계정으로만 쓰기 가능

---

## 헌법 준수

| 원칙                | 준수 여부 | 설명                                               |
| ------------------- | --------- | -------------------------------------------------- |
| IV. 확장성과 안정성 | ✅        | Pub/Sub 분산 처리, 재시도 메커니즘, 격리 보장      |
| V. 관찰 가능성      | ✅        | 실시간 상태 추적, 상세 에러 로그, 샘플 크롤링 검증 |

**최종 검증**: ✅ 모든 헌법 원칙 충족
