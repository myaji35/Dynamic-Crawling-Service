# UX 디자인 문서: FlexCrawler

## 📋 문서 개요

**버전**: 1.0
**작성일**: 2025-11-23
**작성자**: Mary (Business Analyst) + UX Team
**목적**: FlexCrawler 사용자 경험 설계 및 인터페이스 가이드

---

## 🎯 디자인 원칙

### 1. Progressive Disclosure (점진적 공개)

- 초보자: 단순한 UI로 시작
- 고급 사용자: 필요할 때 복잡한 기능 노출
- 복잡도를 사용자가 컨트롤

### 2. Consistency (일관성)

- 통일된 디자인 시스템
- 예측 가능한 인터랙션
- 명확한 시각적 위계

### 3. Feedback & Transparency (피드백 & 투명성)

- 모든 액션에 즉각적 피드백
- 프로세스 상태 명확히 표시
- 에러 메시지 명확하고 해결 방법 제시

### 4. Efficiency (효율성)

- 최소 클릭으로 목표 달성
- 키보드 단축키 지원
- 자주 쓰는 기능 빠른 접근

---

## 👥 사용자 페르소나

### Persona 1: "데이터 분석가 김영희"

**레벨**: 초급-중급
**니즈**:

- 빠르게 시작 (30분 내)
- 코드 최소화
- 시각적 피드백

**Journey**:

1. 회원가입
2. 템플릿 선택 (경쟁사 가격 모니터링)
3. URL만 입력
4. 테스트 실행
5. 스케줄 설정
6. 데이터 확인

---

### Persona 2: "스타트업 CTO 박민수"

**레벨**: 고급
**니즈**:

- 빠른 프로토타이핑
- 코드 레벨 커스터마이징
- API 통합

**Journey**:

1. 회원가입
2. YAML 에디터로 직접 작성
3. 복잡한 로직 구현
4. API로 통합
5. 팀원 초대
6. 프로덕션 배포

---

## 🗺️ 정보 아키텍처

```
FlexCrawler
│
├── 🏠 Home (Landing)
│   ├── Hero Section
│   ├── Features
│   ├── Pricing
│   └── Testimonials
│
├── 🔐 Auth
│   ├── Sign Up
│   └── Sign In
│
├── 📊 Dashboard
│   ├── Overview
│   │   ├── Quick Stats
│   │   ├── Recent Jobs
│   │   └── Quick Actions
│   │
│   ├── Projects
│   │   ├── List View
│   │   ├── Project Detail
│   │   │   ├── Jobs List
│   │   │   ├── Settings
│   │   │   └── Team
│   │   └── Create New
│   │
│   ├── Jobs
│   │   ├── Create Job (Visual Builder)
│   │   ├── Create Job (YAML Editor)
│   │   ├── Job Detail
│   │   │   ├── Overview
│   │   │   ├── Runs History
│   │   │   ├── Data Preview
│   │   │   ├── Logs
│   │   │   └── Settings
│   │   └── Run Detail
│   │       ├── Status
│   │       ├── Logs
│   │       └── Data
│   │
│   ├── Templates
│   │   ├── Browse Templates
│   │   ├── My Templates
│   │   └── Create Template
│   │
│   ├── Data
│   │   ├── Browse Data
│   │   ├── Export
│   │   └── API Access
│   │
│   └── Settings
│       ├── Organization
│       ├── Team Members
│       ├── API Keys
│       ├── Billing
│       └── Notifications
│
└── 📚 Docs
    ├── Getting Started
    ├── API Reference
    └── Examples
```

---

## 🎨 와이어프레임

### 1. Landing Page

```
┌────────────────────────────────────────────────────────┐
│  [Logo] FlexCrawler    Features  Pricing  Docs  Login │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                                                        │
│              데이터 수집, 이제 쉽게                    │
│         Progressive Complexity 크롤링 플랫폼           │
│                                                        │
│  [ Start Free ]  [ Watch Demo ]                       │
│                                                        │
│     ┌──────────────────────────────┐                 │
│     │  [Screenshot of Dashboard]   │                 │
│     └──────────────────────────────┘                 │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                    핵심 기능                           │
│                                                        │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐         │
│  │ GUI   │  │ YAML  │  │ SDK   │  │ Auto  │         │
│  │Builder│  │Config │  │Extend │  │Schedule│        │
│  └───────┘  └───────┘  └───────┘  └───────┘         │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      가격                              │
│                                                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐              │
│  │  Free   │  │   Pro   │  │  Team   │              │
│  │   $0    │  │  $99/mo │  │ $299/mo │              │
│  └─────────┘  └─────────┘  └─────────┘              │
└────────────────────────────────────────────────────────┘
```

---

### 2. Dashboard - Overview

```
┌────────────────────────────────────────────────────────┐
│ [☰] FlexCrawler           [🔍]  [🔔]  [👤 User ▼]    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ [📊 Dashboard] Projects  Jobs  Templates  Settings    │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Overview                                             │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Total   │  │ Active   │  │ Success  │           │
│  │  Jobs    │  │  Jobs    │  │  Rate    │           │
│  │   24     │  │    8     │  │  95.2%   │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                        │
│  Quick Actions                                        │
│  [ + New Job ]  [ 📋 Browse Templates ]              │
│                                                        │
│  Recent Jobs                                          │
│  ┌──────────────────────────────────────────────┐    │
│  │ ✅ Competitor Pricing    Last run: 10m ago   │    │
│  │ ⏸️  Product Reviews       Paused             │    │
│  │ ✅ News Aggregator        Last run: 1h ago   │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  Activity Chart                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │      📈 Jobs Run (Last 7 Days)               │    │
│  │  20 │        ▄                                │    │
│  │  15 │    ▄  █  ▄                              │    │
│  │  10 │   █ █ █ █ ▄  ▄                         │    │
│  │   5 │  █ █ █ █ █ █ █                         │    │
│  │     └─────────────────                        │    │
│  │      Mon Tue Wed Thu Fri Sat Sun             │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 3. Create Job - Visual Builder (Step 1)

```
┌────────────────────────────────────────────────────────┐
│ [☰] FlexCrawler                          [👤 User ▼]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Jobs > Create New Job                                 │
│                                                        │
│ Choose Your Path                                      │
│                                                        │
│  ┌─────────────────┐  ┌─────────────────┐            │
│  │  🎨 Visual      │  │  📝 YAML        │            │
│  │  Builder        │  │  Editor         │            │
│  │                 │  │                 │            │
│  │  Easy start,    │  │  Full control,  │            │
│  │  no code        │  │  for experts    │            │
│  │                 │  │                 │            │
│  │  [Start >]      │  │  [Start >]      │            │
│  └─────────────────┘  └─────────────────┘            │
│                                                        │
│  Or Start from Template                               │
│  ┌────────────────────────────────────────────┐       │
│  │ 🏷️  Ecommerce Pricing                      │       │
│  │ 📰 News Scraper                            │       │
│  │ 🔍 Product Reviews                         │       │
│  │ [ Browse All Templates > ]                 │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 4. Create Job - Visual Builder (Step 2)

```
┌────────────────────────────────────────────────────────┐
│ [☰] FlexCrawler                          [👤 User ▼]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Jobs > Create New Job > Visual Builder                │
│                                                        │
│  Step 1: Basic Info  →  [Step 2: Configure]  →  Test │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Source Configuration                                 │
│                                                        │
│  Source Type: [ Web Page ▼ ]                         │
│                                                        │
│  URL                                                  │
│  [https://example.com/products              ]        │
│                                                        │
│  ┌────────────────────────────────────────────┐       │
│  │  Data to Extract                           │       │
│  │                                             │       │
│  │  Field 1: Product Name                     │       │
│  │  Selector: [h1.product-title    ] [CSS ▼] │       │
│  │                                             │       │
│  │  Field 2: Price                            │       │
│  │  Selector: [.price-value        ] [CSS ▼] │       │
│  │  Transform: [ extract_number ▼ ]          │       │
│  │                                             │       │
│  │  [ + Add Field ]                           │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  Advanced Options  [▼]                                │
│  ┌────────────────────────────────────────────┐       │
│  │ Timeout:    [30] seconds                   │       │
│  │ Retry:      [3] attempts                   │       │
│  │ Wait for:   [networkidle ▼]                │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  [ < Back ]              [ Test Run ] [ Next > ]      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 5. Create Job - YAML Editor

```
┌────────────────────────────────────────────────────────┐
│ [☰] FlexCrawler                          [👤 User ▼]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Jobs > Create New Job > YAML Editor                   │
│                                                        │
│  [ Visual Builder ]  [✓ YAML Editor]                  │
│                                                        │
├─────────────────────────┬──────────────────────────────┤
│                         │                              │
│  1  version: "1.0"      │   Preview                    │
│  2  job:                │                              │
│  3    name: "Price Mon" │   Job: Price Monitor         │
│  4                      │   Type: Web Crawl            │
│  5    pipeline:         │                              │
│  6      - step: crawl   │   Steps:                     │
│  7        source:       │   1. Crawl                   │
│  8          type: web   │      → example.com           │
│  9          url: "..."  │   2. Transform               │
│ 10          fields:     │      → extract_number        │
│ 11            - name: p │   3. Load                    │
│ 12              select: │      → PostgreSQL            │
│ 13                      │                              │
│ 14      - step: load    │   Schedule: Daily 9am        │
│ 15        destination:  │                              │
│ 16          type: post  │                              │
│ 17                      │                              │
│ [Tab: 2sp] [YAML]       │                              │
│                         │                              │
│ Validation: ✅ No err   │   [ < Back ]  [ Save ]       │
│                         │                              │
└─────────────────────────┴──────────────────────────────┘
```

---

### 6. Job Detail - Overview

```
┌────────────────────────────────────────────────────────┐
│ [☰] FlexCrawler                          [👤 User ▼]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Jobs > Competitor Pricing Monitor                     │
│                                                        │
│  ┌────────────────────────────────────────────┐       │
│  │ Competitor Pricing Monitor          [Edit] │       │
│  │ Status: ● Active    Last run: 10m ago      │       │
│  │                                             │       │
│  │ Schedule: Every day at 9:00 AM (KST)       │       │
│  │ Next run: Tomorrow at 9:00 AM              │       │
│  │                                             │       │
│  │ [ ▶️ Run Now ]  [ ⏸️ Pause ]  [ ⚙️ Settings ] │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  [ Overview ]  Runs  Data  Logs  Settings             │
│                                                        │
│  Quick Stats (Last 30 Days)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │   Runs   │  │ Success  │  │   Avg    │           │
│  │    30    │  │  95.2%   │  │  2.4s    │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                        │
│  Recent Runs                                          │
│  ┌──────────────────────────────────────────────┐    │
│  │ ✅ #142  Today 9:00 AM     52 items  2.1s    │    │
│  │ ✅ #141  Yesterday 9:00    48 items  2.3s    │    │
│  │ ❌ #140  2 days ago        Error: Timeout    │    │
│  │ ✅ #139  3 days ago        50 items  2.0s    │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  Performance Chart                                    │
│  ┌──────────────────────────────────────────────┐    │
│  │      📊 Success Rate & Items                 │    │
│  │ 100%│                ━━━━━━━━                │    │
│  │  75%│          ━━━━━━                         │    │
│  │  50%│    ━━━━━━                               │    │
│  │  25%│━━━━                                     │    │
│  │     └───────────────────────────             │    │
│  │      Week 1  Week 2  Week 3  Week 4          │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 7. Run Detail - Real-time Status

```
┌────────────────────────────────────────────────────────┐
│ [☰] FlexCrawler                          [👤 User ▼]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Jobs > Competitor Pricing > Run #142                  │
│                                                        │
│  ┌────────────────────────────────────────────┐       │
│  │ Run #142                                   │       │
│  │ Status: 🟢 Running                         │       │
│  │ Started: 2 minutes ago                     │       │
│  │                                             │       │
│  │ Progress: ━━━━━━━━━━░░░░░░░░░░ 52%         │       │
│  │                                             │       │
│  │ [ ⏹️ Cancel Run ]                           │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  Live Log                                             │
│  ┌────────────────────────────────────────────┐       │
│  │ [09:00:12] Starting crawl...               │       │
│  │ [09:00:13] Fetching https://example.com    │       │
│  │ [09:00:15] ✅ Page loaded (2.1s)            │       │
│  │ [09:00:16] Extracting data...              │       │
│  │ [09:00:17] ✅ Found 52 items                │       │
│  │ [09:00:18] Processing field: price         │       │
│  │ [09:00:19] Applying transform: extract_num │       │
│  │ [09:00:20] 🔄 In progress... (26/52 items)  │       │
│  │ [09:00:21] ...                             │       │
│  │                                             │       │
│  │ [Auto-scroll] [📥 Download Log]             │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  Stats                                                │
│  ┌────────────────────────────────────────────┐       │
│  │ Items processed:    26 / 52                │       │
│  │ Success rate:       100%                   │       │
│  │ Avg response time:  1.8s                   │       │
│  │ Data size:          128 KB                 │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 8. Data Browser

```
┌────────────────────────────────────────────────────────┐
│ [☰] FlexCrawler                          [👤 User ▼]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Data > Competitor Pricing Monitor                     │
│                                                        │
│  Filters:                                             │
│  Date Range: [Last 7 days ▼]  Job: [All Jobs ▼]     │
│  [🔍 Search...]                     [ 📥 Export CSV ]  │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ Product Name    │ Price   │ Scraped At   │ ... │   │
│  ├────────────────────────────────────────────────┤   │
│  │ Product A       │ $99.99  │ 10m ago      │ ... │   │
│  │ Product B       │ $149.99 │ 10m ago      │ ... │   │
│  │ Product C       │ $79.99  │ 10m ago      │ ... │   │
│  │ Product A       │ $97.99  │ 1 day ago    │ ... │   │
│  │ Product B       │ $149.99 │ 1 day ago    │ ... │   │
│  │ ...             │ ...     │ ...          │ ... │   │
│  │                                                 │   │
│  │ Showing 1-10 of 352 items                       │   │
│  │ [ < Prev ]  1 2 3 ... 36  [ Next > ]            │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  Quick Insights                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │ 📊 Price Changes (Last 7 Days)                 │   │
│  │                                                 │   │
│  │ Product A:  $99.99 → $97.99  ⬇️ -2.0%          │   │
│  │ Product B:  $149.99 (no change)                │   │
│  │ Product C:  $79.99 → $82.99  ⬆️ +3.8%          │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 9. Templates Marketplace

```
┌────────────────────────────────────────────────────────┐
│ [☰] FlexCrawler                          [👤 User ▼]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Templates                                             │
│                                                        │
│  [ All Templates ]  My Templates  Shared              │
│                                                        │
│  Categories:                                          │
│  [ All ]  Ecommerce  News  Social  API  Custom       │
│                                                        │
│  [🔍 Search templates...]           [ + New Template ]│
│                                                        │
│  ┌────────────────┐  ┌────────────────┐              │
│  │ 🏷️ Ecommerce   │  │ 📰 News         │              │
│  │ Pricing        │  │ Aggregator     │              │
│  │                │  │                │              │
│  │ Monitor prices │  │ Collect news   │              │
│  │ from competitor│  │ from RSS feeds │              │
│  │                │  │                │              │
│  │ ⭐ 4.8 (124)   │  │ ⭐ 4.6 (89)    │              │
│  │ [Use Template] │  │ [Use Template] │              │
│  └────────────────┘  └────────────────┘              │
│                                                        │
│  ┌────────────────┐  ┌────────────────┐              │
│  │ 🔍 Product     │  │ 🌐 API          │              │
│  │ Reviews        │  │ Integration    │              │
│  │                │  │                │              │
│  │ Scrape reviews │  │ Fetch data from│              │
│  │ from Amazon,   │  │ REST APIs with │              │
│  │ eBay, etc.     │  │ auth support   │              │
│  │                │  │                │              │
│  │ ⭐ 4.9 (201)   │  │ ⭐ 4.7 (156)   │              │
│  │ [Use Template] │  │ [Use Template] │              │
│  └────────────────┘  └────────────────┘              │
│                                                        │
│  [ Load More ]                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🎨 사용자 플로우

### Flow 1: 첫 크롤링 작업 만들기 (Visual Builder)

```
┌─────────┐
│  Start  │
│ (Login) │
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Dashboard      │
│  Click: + New   │
│  Job            │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Choose Path    │
│  Select:        │
│  Visual Builder │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Step 1: Basic  │
│  - Name         │
│  - Description  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Step 2: Config │
│  - URL          │
│  - Fields       │
│  - Selectors    │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Step 3: Test   │
│  Click: Test    │
│  Run            │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Review Results │
│  See extracted  │
│  data preview   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Step 4:        │
│  Schedule       │
│  - Cron         │
│  - Timezone     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Save & Activate│
│  ✅ Job Created! │
└────┬────────────┘
     │
     ▼
┌─────────┐
│  End    │
│ (Job    │
│ Detail) │
└─────────┘
```

---

### Flow 2: 템플릿으로 빠르게 시작하기

```
┌─────────┐
│  Start  │
│ (Login) │
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Dashboard      │
│  Click: Browse  │
│  Templates      │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Template       │
│  Marketplace    │
│  Browse by      │
│  category       │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Select         │
│  Template       │
│  e.g. Ecommerce │
│  Pricing        │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Preview        │
│  Template       │
│  - Description  │
│  - Config       │
│  - Reviews      │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Use Template   │
│  Auto-populate  │
│  configuration  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Customize      │
│  - Change URL   │
│  - Adjust       │
│    selectors    │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Test Run       │
│  Verify data    │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Save & Activate│
│  ✅ Job Ready!   │
└────┬────────────┘
     │
     ▼
┌─────────┐
│  End    │
│ (Job    │
│ Running)│
└─────────┘
```

---

## 🎯 핵심 인터랙션

### 1. Real-time Test Preview

**위치**: Visual Builder > Step 2 (Configure)

```
┌────────────────────────────────────────────┐
│  Data to Extract                           │
│                                             │
│  Field: Product Name                       │
│  Selector: [h1.product-title    ] [Test ⚡] │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │ Preview:                            │  │
│  │ ✅ "Premium Wireless Headphones"    │  │
│  │                                      │  │
│  │ Found 1 element                     │  │
│  │ [View in page →]                    │  │
│  └─────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

**동작**:

1. 사용자가 selector 입력
2. "Test" 버튼 클릭
3. 실시간으로 페이지에서 추출
4. 결과 즉시 표시
5. 에러 시 명확한 피드백

---

### 2. Live Log Streaming

**위치**: Run Detail

```
┌────────────────────────────────────────────┐
│ Live Log                    [Auto-scroll ✓]│
│                                             │
│ [09:00:12] ℹ️  Starting crawl...            │
│ [09:00:13] 🌐 Fetching https://example.com  │
│ [09:00:15] ✅ Page loaded (2.1s)            │
│ [09:00:16] 📊 Extracting data...            │
│ [09:00:17] ✅ Found 52 items                │
│ [09:00:18] 🔄 Processing...                 │
│ ▌ ← 깜박이는 커서 (현재 실행 중)            │
└────────────────────────────────────────────┘
```

**동작**:

1. WebSocket 연결
2. 서버에서 로그 스트리밍
3. 실시간 UI 업데이트
4. Auto-scroll (토글 가능)
5. 색상으로 로그 레벨 구분

---

### 3. Inline YAML Validation

**위치**: YAML Editor

```
┌────────────────────────────────────────────┐
│  1  version: "1.0"                         │
│  2  job:                                   │
│  3    name: "Test"                         │
│  4    pipeline:                            │
│  5      - step: crawl                      │
│  6        source:                          │
│  7          type: we                       │
│     ~~~~~~~~~ ❌ Invalid type. Did you     │
│                   mean "web"?              │
│  8          url: "https://..."             │
│                                             │
│ Errors: 1   Warnings: 0                    │
└────────────────────────────────────────────┘
```

**동작**:

1. 타이핑 중 실시간 검증
2. 에러 하이라이트
3. 제안 표시 (Did you mean?)
4. 문법 오류 즉시 표시

---

## 📱 반응형 디자인

### Mobile View

#### Dashboard (Mobile)

```
┌──────────────────┐
│ ☰  FlexCrawler  🔔│
├──────────────────┤
│                  │
│ Overview         │
│                  │
│ ┌──────────────┐ │
│ │ Total Jobs   │ │
│ │     24       │ │
│ └──────────────┘ │
│                  │
│ ┌──────────────┐ │
│ │ Active Jobs  │ │
│ │      8       │ │
│ └──────────────┘ │
│                  │
│ [ + New Job ]    │
│                  │
│ Recent Jobs      │
│ ┌──────────────┐ │
│ │✅ Competitor  │ │
│ │  Pricing     │ │
│ │  10m ago     │ │
│ └──────────────┘ │
│                  │
│ ┌──────────────┐ │
│ │⏸️  Product    │ │
│ │  Reviews     │ │
│ │  Paused      │ │
│ └──────────────┘ │
│                  │
└──────────────────┘
```

---

## 🎨 디자인 시스템

### Color Palette

```
Primary Colors:
- Primary:     #3B82F6 (Blue)
- Primary-dark:#1E40AF
- Success:     #10B981 (Green)
- Warning:     #F59E0B (Orange)
- Error:       #EF4444 (Red)
- Info:        #6366F1 (Indigo)

Neutral Colors:
- Gray-50:     #F9FAFB
- Gray-100:    #F3F4F6
- Gray-200:    #E5E7EB
- Gray-300:    #D1D5DB
- Gray-400:    #9CA3AF
- Gray-500:    #6B7280
- Gray-600:    #4B5563
- Gray-700:    #374151
- Gray-800:    #1F2937
- Gray-900:    #111827
```

---

### Typography

```
Font Family:
- Primary: Inter, system-ui, sans-serif
- Mono:    'Fira Code', monospace

Font Sizes:
- xs:   0.75rem  (12px)
- sm:   0.875rem (14px)
- base: 1rem     (16px)
- lg:   1.125rem (18px)
- xl:   1.25rem  (20px)
- 2xl:  1.5rem   (24px)
- 3xl:  1.875rem (30px)
- 4xl:  2.25rem  (36px)

Font Weights:
- Regular: 400
- Medium:  500
- Semibold:600
- Bold:    700
```

---

### Spacing

```
Scale (Tailwind-based):
0:   0
1:   0.25rem (4px)
2:   0.5rem  (8px)
3:   0.75rem (12px)
4:   1rem    (16px)
5:   1.25rem (20px)
6:   1.5rem  (24px)
8:   2rem    (32px)
10:  2.5rem  (40px)
12:  3rem    (48px)
16:  4rem    (64px)
```

---

### Components

#### Button

```
Primary Button:
- Background: #3B82F6
- Text: White
- Hover: #2563EB
- Padding: 0.5rem 1rem
- Border-radius: 0.375rem

Secondary Button:
- Background: White
- Border: 1px solid #E5E7EB
- Text: #374151
- Hover: #F9FAFB

Danger Button:
- Background: #EF4444
- Text: White
- Hover: #DC2626
```

#### Input Field

```
Default:
- Border: 1px solid #D1D5DB
- Padding: 0.5rem 0.75rem
- Border-radius: 0.375rem
- Focus: Border #3B82F6, Ring shadow

Error State:
- Border: #EF4444
- Background: #FEF2F2
```

#### Card

```
- Background: White
- Border: 1px solid #E5E7EB
- Border-radius: 0.5rem
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 1.5rem
```

---

## ♿ 접근성 (Accessibility)

### WCAG 2.1 AA 준수

#### 키보드 내비게이션

- 모든 interactive 요소 Tab 접근 가능
- Skip to content 링크 제공
- Focus indicator 명확히 표시

#### 색상 대비

- 텍스트/배경 대비 4.5:1 이상
- UI 요소 대비 3:1 이상

#### 스크린 리더

- Semantic HTML 사용
- ARIA 라벨 적절히 사용
- Alt text for images

#### 반응형

- 텍스트 200% 확대 가능
- Touch target 최소 44x44px

---

## 📊 성공 지표 (UX Metrics)

### 측정 지표

#### 1. Time to First Job

**목표**: < 5분
**측정**: 회원가입 → 첫 작업 생성 완료

#### 2. Task Success Rate

**목표**: > 90%
**측정**: 작업 생성 시도 → 성공적 완료

#### 3. Feature Discovery

**목표**: > 60%
**측정**: 사용자가 고급 기능 발견 비율

#### 4. User Satisfaction (SUS Score)

**목표**: > 75
**측정**: System Usability Scale 설문

---

## 🔄 다음 단계

### Phase 1: MVP UI

- Landing page
- Dashboard
- Visual Builder (기본)
- Job detail
- Data browser

### Phase 2: 고급 기능 UI

- YAML Editor (Monaco)
- React Flow 워크플로우
- 고급 템플릿 빌더
- 실시간 협업

### Phase 3: 모바일 최적화

- Progressive Web App
- 모바일 전용 UI
- 오프라인 지원

---

**문서 버전**: 1.0
**최종 수정**: 2025-11-23
**다음 검토**: MVP 개발 시작 전
