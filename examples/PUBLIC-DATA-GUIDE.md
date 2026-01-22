# 한국 공공데이터 크롤링 가이드

## 📚 개요

FlexCrawler를 사용하여 한국의 주요 공공데이터 포털에서 데이터를 수집하는 방법을 안내합니다.

---

## 🇰🇷 주요 공공데이터 포털

### 1. 공공데이터포털 (data.go.kr)

**URL**: https://www.data.go.kr/
**제공 데이터**: 전국 공공기관의 다양한 데이터셋
**형식**: 파일 데이터, Open API

**크롤링 예제**:

```yaml
version: '1.0'
job:
  name: '공공데이터포털 - 인기 데이터셋'
  pipeline:
    - step: crawl
      source:
        type: web
        url: 'https://www.data.go.kr/'
        fields:
          popular_keywords:
            selector: '.ranking-list li'
            multiple: true
```

### 2. 서울 열린데이터광장 (data.seoul.go.kr)

**URL**: https://data.seoul.go.kr/
**제공 데이터**: 서울시 관련 데이터
**형식**: 파일, Open API, 시각화

**주요 데이터**:

- 실시간 교통 정보
- 공공시설 위치
- 인구/경제 통계
- 환경 데이터

### 3. 국가통계포털 (KOSIS)

**URL**: https://kosis.kr/
**제공 데이터**: 통계청 공식 통계
**형식**: 통계표, 그래프

**주요 통계**:

- 인구 통계
- 경제 지표
- 사회 조사
- 지역 통계

### 4. 기상청

**URL**: https://www.weather.go.kr/
**제공 데이터**: 날씨, 기후 정보
**업데이트**: 실시간

### 5. 에어코리아

**URL**: https://www.airkorea.or.kr/
**제공 데이터**: 실시간 대기질 정보
**업데이트**: 실시간

---

## 🚀 빠른 시작

### 1. 예제 파일로 크롤링

```bash
# PoC 크롤러 사용
cd poc-crawler
npm run crawl ../examples/korea-public-data.yaml

# 또는 TypeScript 테스트
cd ..
npx tsx examples/test-public-data.ts
```

### 2. 커스텀 크롤링 작업 만들기

```yaml
version: '1.0'

job:
  name: '내가 원하는 공공데이터'
  description: '특정 공공데이터 수집'

  pipeline:
    - step: crawl
      source:
        type: web
        url: 'https://example-public-data.go.kr'

        fields:
          # 필요한 필드 정의
          data_title:
            selector: '.title'
            transform: trim

          data_values:
            selector: '.value'
            multiple: true
            transform: extract_number

    - step: load
      destination:
        type: json
        path: './output/my-public-data.json'
```

---

## 📊 주요 유즈케이스

### 유즈케이스 1: 실시간 날씨 모니터링

```yaml
job:
  name: '기상청 날씨 모니터링'
  pipeline:
    - step: crawl
      source:
        url: 'https://www.weather.go.kr/w/index.do'
        fields:
          temperature:
            selector: '.tmp span'
            transform: extract_number
          condition:
            selector: '.txt'
```

**스케줄**: 매 시간마다 실행
**활용**: 날씨 알림, 데이터 분석

---

### 유즈케이스 2: 대기질 추적

```yaml
job:
  name: '에어코리아 대기질 추적'
  pipeline:
    - step: crawl
      source:
        url: 'https://www.airkorea.or.kr/web'
        fields:
          pm25_value:
            selector: '.pm25'
            transform: extract_number
          aqi_level:
            selector: '.aqi-level'
```

**스케줄**: 매 30분마다
**활용**: 건강 알림, 트렌드 분석

---

### 유즈케이스 3: 인구 통계 수집

```yaml
job:
  name: 'KOSIS 인구 통계'
  pipeline:
    - step: crawl
      source:
        url: 'https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1B040M5'
        fields:
          stat_items:
            selector: 'table tbody th'
            multiple: true
          stat_values:
            selector: 'table tbody td'
            multiple: true
            transform: extract_number
```

**스케줄**: 주 1회
**활용**: 인구 분석, 연구 자료

---

## ⚠️ 주의사항 및 Best Practices

### 1. 법적 고려사항

- ✅ **공공데이터 포털의 이용약관 준수**
- ✅ **robots.txt 확인 및 준수**
- ✅ **개인정보 보호법 준수**
- ❌ 과도한 요청으로 서버 부하 주지 않기

### 2. 기술적 고려사항

#### Rate Limiting

```yaml
# 요청 간격 설정 (권장)
crawler_options:
  delay_between_requests: 2000 # 2초 대기
  max_concurrent: 1 # 동시 요청 1개만
```

#### 에러 핸들링

```yaml
retry:
  max_attempts: 3
  backoff: exponential # 지수 백오프
  initial_delay: 1000
```

#### 타임아웃 설정

```yaml
source:
  timeout: 30000 # 30초
  wait_for: networkidle
```

### 3. 데이터 품질

#### 셀렉터 검증

크롤링 전에 브라우저 개발자 도구로 셀렉터 확인:

```javascript
// 브라우저 콘솔에서 테스트
document.querySelectorAll('.your-selector')
```

#### 데이터 변환

```yaml
fields:
  price:
    selector: '.price'
    transform: extract_number # "1,234원" → 1234

  date:
    selector: '.date'
    transform: to_date # "2025-11-23" → ISO 형식
```

---

## 🔧 트러블슈팅

### 문제 1: 셀렉터를 찾을 수 없음

**원인**: 동적 콘텐츠 로드
**해결**:

```yaml
source:
  wait_for: networkidle # 네트워크 안정화 대기
  timeout: 60000 # 타임아웃 증가
```

### 문제 2: 데이터가 null로 반환됨

**원인**: 잘못된 셀렉터 또는 페이지 구조 변경
**해결**:

1. 브라우저에서 수동 확인
2. 셀렉터 업데이트
3. 대체 셀렉터 준비

### 문제 3: 403 Forbidden 에러

**원인**: User-Agent 차단
**해결**:

```typescript
// 크롤러 설정에 User-Agent 추가
const crawler = new CrawlerEngine({
  userAgent: 'Mozilla/5.0 (compatible; FlexCrawler/1.0)',
})
```

---

## 📈 고급 활용

### 1. 여러 페이지 크롤링

```yaml
job:
  name: '다중 페이지 크롤링'
  urls:
    - 'https://data.go.kr/page1'
    - 'https://data.go.kr/page2'
    - 'https://data.go.kr/page3'
```

### 2. 조건부 크롤링

```yaml
pipeline:
  - step: crawl
    # ...

  - step: transform
    rules:
      - filter: '${data.length > 0}'
      - deduplicate: ['title']
```

### 3. 알림 연동

```yaml
job:
  notifications:
    on_success:
      - type: email
        to: 'user@example.com'
    on_failure:
      - type: slack
        webhook: 'https://hooks.slack.com/...'
```

---

## 📚 추가 리소스

### 공식 문서

- [공공데이터포털 이용가이드](https://www.data.go.kr/ugs/selectPortalPolicyView.do)
- [서울 열린데이터광장 API 가이드](https://data.seoul.go.kr/together/guide/guide.do)

### FlexCrawler 문서

- [기본 사용법](../README.md)
- [YAML 설정 가이드](../docs/yaml-config.md)
- [API 레퍼런스](../docs/api-reference.md)

---

## 🤝 기여

공공데이터 크롤링 예제를 추가하고 싶으신가요?

1. `examples/` 디렉토리에 YAML 파일 추가
2. 이 가이드 문서 업데이트
3. Pull Request 제출

---

## 📄 라이선스

이 가이드는 MIT 라이선스를 따릅니다.

**주의**: 공공데이터 포털의 데이터는 각 기관의 이용약관을 따릅니다.

---

**마지막 업데이트**: 2025-11-23
**작성자**: FlexCrawler Team
