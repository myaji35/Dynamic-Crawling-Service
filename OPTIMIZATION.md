# 성능 최적화 방안

## 현재 문제점

### 멀티 필드 자동 찾기 속도 이슈

- 7개 필드 처리 시 약 **30-40초** 소요
- 순차 처리로 인한 대기 시간 증가
- 각 필드마다 HTML 다시 가져오기

## 최적화 방안

### 1. **병렬 처리 (가장 효과적)** ⭐⭐⭐⭐⭐

**현재:**

```typescript
for (let i = 0; i < fieldNames.length; i++) {
  await findSelector(fieldNames[i]) // 순차 처리
  await new Promise((resolve) => setTimeout(resolve, 500)) // 딜레이
}
```

**개선:**

```typescript
// 3개씩 배치로 병렬 처리
const BATCH_SIZE = 3
for (let i = 0; i < fieldNames.length; i += BATCH_SIZE) {
  const batch = fieldNames.slice(i, i + BATCH_SIZE)
  await Promise.all(batch.map((name) => findSelector(name))) // 병렬
}
```

**효과:** 30초 → **10-15초**

---

### 2. **HTML 캐싱** ⭐⭐⭐⭐

**현재:**

```typescript
// 각 필드마다 HTML을 다시 가져옴 (7번 요청)
const html = await getPageHTML(project.targetUrl)
```

**개선:**

```typescript
// 한 번만 가져와서 재사용
const html = await getPageHTML(project.targetUrl)
const results = await Promise.all(
  fieldNames.map((name) => findSelectorFromHTML(html, name))
)
```

**효과:** 30초 → **5-8초**

---

### 3. **서버 사이드 배치 API** ⭐⭐⭐⭐⭐

**새 API 엔드포인트:**

```typescript
// POST /api/projects/[id]/suggest-multiple-fields
{
  fieldNames: ["장기요양기관", "급여종류", "평가결과", ...]
}

// 응답:
{
  results: [
    { fieldName: "장기요양기관", selector: ".ulineDtl", samples: [...] },
    { fieldName: "급여종류", selector: ".type", samples: [...] }
  ]
}
```

**장점:**

- 서버에서 병렬 처리
- HTML 한 번만 가져오기
- 네트워크 왕복 최소화

**효과:** 30초 → **3-5초**

---

### 4. **스트리밍 응답 (실시간 진행 상황)** ⭐⭐⭐

**Server-Sent Events (SSE) 사용:**

```typescript
// 클라이언트
const eventSource = new EventSource(`/api/projects/${id}/suggest-stream`)
eventSource.onmessage = (event) => {
  const { fieldName, status, selector } = JSON.parse(event.data)
  updateUI(fieldName, status, selector)
}

// 서버
async function* streamResults() {
  for (const field of fields) {
    yield { fieldName: field, status: 'processing' }
    const result = await findSelector(field)
    yield { fieldName: field, status: 'complete', ...result }
  }
}
```

**효과:**

- 체감 속도 향상 (실시간 피드백)
- 전체 시간은 동일하지만 UX 개선

---

### 5. **프리로딩 및 백그라운드 처리** ⭐⭐⭐

**Dialog 열 때 미리 HTML 로드:**

```typescript
const openAddFieldDialog = async () => {
  setAddFieldDialogOpen(true)
  // 백그라운드에서 미리 HTML 가져오기
  prefetchHTML(project.targetUrl)
}
```

---

### 6. **Selector 캐시 시스템** ⭐⭐

**같은 URL의 Selector 재사용:**

```typescript
// Redis 또는 메모리 캐시
const cacheKey = `selectors:${projectId}`
const cached = await cache.get(cacheKey)
if (cached) return cached

// 5분간 캐시
await cache.set(cacheKey, selectors, { ttl: 300 })
```

---

## 구현 우선순위

### Phase 1: 즉시 개선 (1-2시간)

1. ✅ **HTML 캐싱** - 가장 쉽고 효과적
2. ✅ **배치 병렬 처리** - 코드 수정 최소

### Phase 2: 중기 개선 (3-5시간)

3. ⬜ **서버 사이드 배치 API** - 근본적 해결
4. ⬜ **스트리밍 응답** - UX 대폭 개선

### Phase 3: 장기 최적화 (1-2일)

5. ⬜ **Selector 캐시 시스템** - 인프라 구축 필요
6. ⬜ **웹 워커 활용** - 브라우저 성능 최적화

---

## 예상 성능 개선

| 최적화 단계 | 현재 시간 | 개선 후 | 개선율       |
| ----------- | --------- | ------- | ------------ |
| **현재**    | 30-40초   | -       | -            |
| **Phase 1** | 30-40초   | 5-8초   | **80% 개선** |
| **Phase 2** | 5-8초     | 3-5초   | **90% 개선** |
| **Phase 3** | 3-5초     | 1-2초   | **95% 개선** |

---

## 추가 최적화 아이디어

### 7. **스마트 Selector 학습**

- 성공한 Selector 패턴을 학습
- 비슷한 필드명에 자동 적용
- 정확도와 속도 모두 향상

### 8. **프로그레시브 로딩**

- 첫 3개 필드만 즉시 처리
- 나머지는 백그라운드에서 처리
- 사용자는 결과를 먼저 확인 가능

### 9. **Puppeteer 대신 Cheerio 사용**

- 정적 HTML 파싱에는 Cheerio가 100배 빠름
- Puppeteer는 동적 페이지만 사용

---

## 권장 구현 순서

```bash
# 1단계: HTML 캐싱 (30분)
src/app/(dashboard)/dashboard/projects/[projectId]/page.tsx
- HTML을 한 번만 가져오도록 수정

# 2단계: 배치 API 생성 (2시간)
src/app/api/projects/[projectId]/suggest-batch/route.ts
- 여러 필드를 한 번에 처리

# 3단계: UI 업데이트 (1시간)
- 배치 API 호출로 변경
- 진행 상황 표시 개선

# 4단계: 스트리밍 (선택사항, 3시간)
- SSE 구현
- 실시간 업데이트
```

---

## 측정 및 모니터링

```typescript
// 성능 측정 코드 추가
console.time('Multi-field search')
const results = await findMultipleSelectors(fields)
console.timeEnd('Multi-field search')

// 각 단계별 시간 측정
console.time('HTML fetch')
const html = await getPageHTML(url)
console.timeEnd('HTML fetch') // 예: 2초

console.time('Selector finding')
const selectors = findSelectors(html, fields)
console.timeEnd('Selector finding') // 예: 0.1초

console.time('Testing')
const results = await testSelectors(selectors)
console.timeEnd('Testing') // 예: 3초
```

---

## 결론

**즉시 구현 권장:**

1. HTML 캐싱 (30분, 80% 개선)
2. 배치 병렬 처리 (1시간, 추가 10% 개선)

**총 예상 시간:** 1.5시간
**총 성능 개선:** 30초 → **5초 이내**

준비되면 알려주시면 구현 도와드리겠습니다!
