# FlexCrawler PoC (Proof of Concept)

## 개요

FlexCrawler의 핵심 크롤링 엔진 프로토타입입니다.

이 PoC는 다음을 검증합니다:

- ✅ YAML 기반 설정 시스템
- ✅ Playwright를 사용한 웹 크롤링
- ✅ CSS 셀렉터 기반 데이터 추출
- ✅ 데이터 변환 파이프라인
- ✅ 에러 핸들링 및 재시도

## 기능

### 핵심 기능

- 📄 **YAML 설정**: 선언적 크롤링 설정
- 🌐 **웹 크롤링**: Playwright 기반 브라우저 자동화
- 🎯 **셀렉터 지원**: CSS, XPath 셀렉터
- 🔄 **데이터 변환**: 내장 변환 함수 (trim, extract_number, extract_price 등)
- 🔁 **재시도 로직**: 실패 시 자동 재시도
- 📊 **결과 저장**: JSON 형식으로 결과 저장

### 지원 변환 함수

- `trim`: 공백 제거
- `lowercase`: 소문자 변환
- `uppercase`: 대문자 변환
- `extract_number`: 숫자 추출
- `extract_price`: 가격 정보 추출 (값 + 통화)
- `to_date`: 날짜 변환
- `remove_whitespace`: 중복 공백 제거

## 설치

### 1. 의존성 설치

```bash
cd poc-crawler
npm install
```

### 2. Playwright 브라우저 설치

```bash
npx playwright install chromium
```

## 사용법

### CLI로 실행

```bash
npm run crawl examples/basic.yaml
```

또는

```bash
node src/cli.js examples/basic.yaml
```

### 테스트 실행

```bash
npm test
```

## YAML 설정 예제

### 기본 예제

```yaml
version: '1.0'

job:
  name: 'Basic Web Scraping'
  description: 'Extract basic information from a web page'

  pipeline:
    - step: crawl
      source:
        type: web
        url: 'https://example.com'

        fields:
          title:
            selector: 'h1'
            transform: trim

          description:
            selector: 'p'
            transform: remove_whitespace

      retry:
        max_attempts: 3
```

### 전자상거래 예제

```yaml
version: '1.0'

job:
  name: 'Ecommerce Price Monitor'
  description: 'Monitor product prices'

  pipeline:
    - step: crawl
      source:
        type: web
        url: 'https://books.toscrape.com'

        fields:
          product_names:
            selector: 'article.product_pod h3 a'
            attribute: 'title'
            multiple: true

          prices:
            selector: 'article.product_pod .price_color'
            multiple: true
            transform: extract_price

      retry:
        max_attempts: 3
```

## 프로젝트 구조

```
poc-crawler/
├── src/
│   ├── crawler.js         # 핵심 크롤링 엔진
│   ├── config-parser.js   # YAML 파서
│   ├── cli.js             # CLI 인터페이스
│   └── test.js            # 테스트 스크립트
├── examples/
│   ├── basic.yaml         # 기본 예제
│   └── ecommerce.yaml     # 전자상거래 예제
├── package.json
└── README.md
```

## API 사용 예제

### 프로그래밍 방식 사용

```javascript
import { Crawler } from './src/crawler.js'

const crawler = new Crawler({
  headless: true,
  timeout: 30000,
})

const job = {
  url: 'https://example.com',
  fields: {
    title: {
      selector: 'h1',
      transform: 'trim',
    },
    price: {
      selector: '.price',
      transform: 'extract_price',
    },
  },
}

const result = await crawler.crawl(job)
console.log(result.data)

await crawler.close()
```

## 테스트 결과

PoC는 다음 테스트 시나리오를 포함합니다:

1. ✅ **기본 웹 크롤링**: example.com에서 데이터 추출
2. ✅ **다중 요소 추출**: 여러 링크 동시 추출
3. ✅ **데이터 변환**: 가격 정보 파싱
4. ✅ **실제 사이트 크롤링**: books.toscrape.com
5. ✅ **에러 핸들링**: 존재하지 않는 요소 처리

실행:

```bash
npm test
```

예상 출력:

```
🧪 FlexCrawler PoC - Test Suite

📝 Test 1: Basic Web Crawling
✅ Data extracted successfully
   Title: Example Domain...
   Fields: 2

📝 Test 2: Multiple Elements Extraction
✅ Multiple elements extracted successfully
   Links found: 1

📝 Test 3: Data Transformation
✅ Price transformation works
   Input: $1,234.56
   Output: {"raw":"$1,234.56","value":1234.56,"currency":"$"}

📝 Test 4: Real Ecommerce Site Crawling
✅ Ecommerce site crawled successfully
   Books found: 20
   First book: A Light in the Attic
   First price: £51.77

📝 Test 5: Error Handling
✅ Error handled gracefully
   Non-existent element returned null

📊 Test Summary
═══════════════════════════════════════════════════════════
  ✅ Passed: 5
  ❌ Failed: 0
  Total: 5
═══════════════════════════════════════════════════════════

  Success Rate: 100.0%

🎉 All tests passed!
```

## 성능

PoC 기준 성능:

- **페이지 로드**: ~2-3초 (네트워크 속도 의존)
- **데이터 추출**: ~100-500ms
- **메모리 사용**: ~150MB (Chromium 포함)

## 제한사항 (MVP 전에 해결 필요)

- ⚠️ **단일 페이지만 지원**: 페이지네이션 미구현
- ⚠️ **동적 콘텐츠 제한적**: JavaScript 렌더링 기본 지원
- ⚠️ **병렬 처리 없음**: 순차적 크롤링만 지원
- ⚠️ **데이터베이스 미연결**: JSON 파일로만 저장
- ⚠️ **스케줄링 없음**: 수동 실행만 가능
- ⚠️ **인증 제한적**: 기본 인증만 지원

## 다음 단계 (MVP로 가는 길)

### 단기 (1-2주)

1. [ ] PostgreSQL 연결 및 데이터 저장
2. [ ] 기본 스케줄러 구현 (node-cron)
3. [ ] 간단한 웹 UI (설정 + 실행)

### 중기 (3-4주)

4. [ ] API 서버 구축 (NestJS)
5. [ ] 인증 시스템
6. [ ] 재시도 로직 개선

### 장기 (2-3개월)

7. [ ] Message Queue (Bull + Redis)
8. [ ] Visual Builder UI
9. [ ] 템플릿 시스템

## 라이선스

MIT

## 기여

이 PoC는 FlexCrawler MVP 개발을 위한 기술 검증용입니다.

## 문의

프로젝트 관련 문의: FlexCrawler Team
