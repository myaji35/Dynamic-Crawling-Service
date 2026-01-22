# 노인장기요양보험 시설 정보 크롤링 가이드

## 📋 개요

노인장기요양보험 공단 웹사이트에서 전국 장기요양기관 정보를 수집하는 방법을 안내합니다.

**사이트**: https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch
**제공 정보**: 요양원, 주야간보호센터, 방문요양센터 등 장기요양기관 정보

---

## 🎯 수집 가능한 데이터

### 1. 기관 기본 정보

- 기관명
- 시설 유형 (요양원, 주야간보호, 방문요양, 방문목욕, 방문간호 등)
- 주소 (시/도, 시/군/구, 상세주소)
- 전화번호

### 2. 시설 현황

- 정원 (수용 가능 인원)
- 현원 (현재 이용자 수)
- 이용률 (현원/정원 × 100)

### 3. 평가 정보

- 평가등급 (A, B, C, D, E)
- 평가년도
- 평가점수

---

## 🚀 사용법

### 기본 크롤링

```yaml
version: '1.0'

job:
  name: '장기요양기관 정보 수집'

  pipeline:
    - step: crawl
      source:
        type: web
        url: 'https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch'

        timeout: 40000
        wait_for: networkidle

        fields:
          facility_names:
            selector: '.list-table tbody td.left'
            multiple: true

          facility_types:
            selector: '.list-table tbody td:nth-child(2)'
            multiple: true

          addresses:
            selector: '.list-table tbody td:nth-child(3)'
            multiple: true
```

실행:

```bash
cd poc-crawler
npm run crawl ../examples/longterm-care.yaml
```

---

## ⚠️ 주의사항

### 1. 동적 로딩 대응

이 사이트는 검색 조건을 설정한 후 데이터가 로드됩니다. 따라서:

**옵션 A: 검색 조건 설정이 필요한 경우**

```yaml
source:
  type: web
  url: 'https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch'

  # 페이지 로드 후 추가 대기
  wait_for: networkidle
  timeout: 60000

  # JavaScript 실행 후 데이터 로드될 때까지 대기
  custom_wait:
    type: selector
    value: '.list-table tbody tr'
    timeout: 30000
```

**옵션 B: 직접 검색 결과 URL 사용**
특정 지역의 결과 URL을 직접 사용:

```yaml
url: 'https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch?searchType=1&sidoCd=11&sigunguCd=110'
# sidoCd: 시/도 코드 (11: 서울)
# sigunguCd: 시/군/구 코드 (110: 종로구)
```

### 2. 지역 코드 참고

**시/도 코드 (sidoCd)**:

- 11: 서울특별시
- 26: 부산광역시
- 27: 대구광역시
- 28: 인천광역시
- 29: 광주광역시
- 30: 대전광역시
- 31: 울산광역시
- 36: 세종특별자치시
- 41: 경기도
- 42: 강원도
- 43: 충청북도
- 44: 충청남도
- 45: 전라북도
- 46: 전라남도
- 47: 경상북도
- 48: 경상남도
- 50: 제주특별자치도

### 3. Rate Limiting

공공기관 사이트이므로 과도한 요청 주의:

```yaml
crawler_options:
  delay_between_requests: 3000 # 3초 대기
  max_concurrent: 1 # 순차 실행
```

---

## 📊 활용 사례

### 유즈케이스 1: 지역별 요양원 통계

```yaml
job:
  name: '서울시 요양원 현황 분석'

  urls:
    - 'https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch?sidoCd=11&sigunguCd=110' # 종로구
    - 'https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch?sidoCd=11&sigunguCd=140' # 중구
    - 'https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch?sidoCd=11&sigunguCd=170' # 용산구

  fields:
    facility_names:
      selector: '.list-table tbody td.left'
      multiple: true

    capacities:
      selector: '.list-table tbody td:nth-child(5)'
      multiple: true
      transform: extract_number
```

**활용**: 지역별 요양시설 분포 분석, 수용능력 통계

---

### 유즈케이스 2: 평가등급별 시설 목록

```yaml
job:
  name: 'A등급 요양시설 목록'

  pipeline:
    - step: crawl
      # ... 크롤링 설정

    - step: transform
      rules:
        # A등급만 필터링
        - filter: "${ratings.includes('A')}"
```

**활용**: 우수 시설 리스트 작성, 입소 추천 자료

---

### 유즈케이스 3: 정기 모니터링

```yaml
job:
  name: '주간 요양시설 현황 업데이트'

  schedule:
    type: cron
    expression: '0 9 * * 1' # 매주 월요일 오전 9시
    timezone: 'Asia/Seoul'

  notifications:
    on_success:
      - type: email
        to: 'admin@example.com'
        subject: '주간 요양시설 현황 리포트'
```

**활용**: 정기적인 시설 현황 모니터링, 변화 추적

---

## 🛠️ 고급 설정

### 페이지네이션 처리

```yaml
job:
  name: '전체 페이지 크롤링'

  pipeline:
    - step: crawl
      source:
        url: 'https://longtermcare.or.kr/npbs/r/a/201/selectXLtcoSrch'

        # 여러 페이지 크롤링
        pagination:
          enabled: true
          selector: '.pagination .next'
          max_pages: 10
```

### 상세 정보 수집

각 시설의 상세 페이지까지 크롤링:

```yaml
fields:
  detail_links:
    selector: '.list-table tbody td.left a'
    attribute: 'href'
    multiple: true
# 그 다음 detail_links를 순회하며 상세 정보 크롤링
```

---

## 📈 데이터 분석 예제

### Python으로 분석

```python
import json
import pandas as pd

# 크롤링한 데이터 로드
with open('output/longterm-care-facilities.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# DataFrame 생성
df = pd.DataFrame({
    'name': data['data']['facility_names'],
    'type': data['data']['facility_types'],
    'capacity': data['data']['capacities'],
    'current': data['data']['current_users'],
    'rating': data['data']['ratings']
})

# 이용률 계산
df['usage_rate'] = (df['current'] / df['capacity'] * 100).round(2)

# 통계 출력
print(f"총 시설 수: {len(df)}")
print(f"평균 이용률: {df['usage_rate'].mean():.2f}%")
print(f"\n시설 유형별 통계:")
print(df.groupby('type').agg({
    'capacity': 'sum',
    'current': 'sum',
    'usage_rate': 'mean'
}))
```

---

## 🔍 트러블슈팅

### 문제 1: 데이터가 비어있음

**원인**: 페이지 로드 후 JavaScript로 데이터 로딩
**해결**:

- `wait_for: networkidle` 사용
- 더 긴 timeout 설정 (60초)
- 특정 셀렉터가 나타날 때까지 대기

### 문제 2: Timeout 발생

**원인**: 네트워크 속도 느림 또는 서버 응답 지연
**해결**:

```yaml
source:
  timeout: 90000 # 90초로 증가
  retries: 5
```

### 문제 3: 일부 필드만 추출됨

**원인**: 셀렉터 오류 또는 페이지 구조 변경
**해결**:

1. 브라우저 개발자 도구로 셀렉터 재확인
2. 대체 셀렉터 준비
3. 에러 로그 확인

---

## 📄 법적 고려사항

### 이용 시 주의

- ✅ 개인정보 보호: 시설 정보는 공개 정보이지만, 이용자 개인정보는 수집 금지
- ✅ 적정 사용: 과도한 요청으로 서버 부하 주지 않기
- ✅ 데이터 활용: 공익 목적으로 활용

### 권장 사항

- 크롤링 간격: 최소 3초
- 동시 요청: 1개만
- 스케줄: 주 1회 이하

---

## 📚 참고 자료

- [노인장기요양보험 공단 공식 사이트](https://www.longtermcare.or.kr/)
- [FlexCrawler 기본 가이드](../README.md)
- [공공데이터 크롤링 가이드](./PUBLIC-DATA-GUIDE.md)

---

**마지막 업데이트**: 2025-11-23
**작성자**: FlexCrawler Team
