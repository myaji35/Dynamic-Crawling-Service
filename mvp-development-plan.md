# MVP 개발 계획: FlexCrawler

## 📋 문서 개요

**버전**: 1.0
**작성일**: 2025-11-23
**작성자**: Mary (Business Analyst) + Development Team
**기간**: 16주 (4개월)
**목표**: 시장 검증 가능한 MVP 출시 및 베타 사용자 확보

---

## 🎯 MVP 목표 및 범위

### 핵심 목표

1. **검증 가능한 제품**: 타겟 고객이 실제 문제 해결 가능
2. **차별화 입증**: Progressive Complexity 개념 구현
3. **기술 검증**: 아키텍처 및 확장성 테스트
4. **베타 사용자**: 최소 50명의 active users 확보

### MVP 범위 (Must Have)

#### ✅ 포함

- 기본 Visual Builder (웹 크롤링)
- YAML 설정 편집
- Cron 스케줄링
- PostgreSQL 저장
- CSV/JSON export
- 기본 대시보드
- 이메일 알림
- 템플릿 3개

#### ❌ 제외 (Phase 2로 연기)

- Webhook 트리거
- Message Queue (Bull)
- 고급 워크플로우
- SDK/API
- 멀티 테넌시 (싱글 org만)
- 결제 시스템

---

## 📅 개발 일정 (16주)

### 전체 타임라인

```
Week 1-2:   프로젝트 셋업
Week 3-6:   백엔드 핵심 기능
Week 7-10:  프론트엔드 개발
Week 11-12: 통합 및 테스트
Week 13-14: 베타 준비
Week 15:    베타 런칭
Week 16:    피드백 및 개선
```

---

## 🏃 Sprint 계획

### Sprint 0: 프로젝트 셋업 (Week 1-2)

#### 목표

- 개발 환경 구축
- 기본 인프라 설정
- 팀 온보딩

#### Tasks

**인프라 & 환경 (Week 1)**

- [ ] GCP 프로젝트 생성 및 설정
- [ ] GitHub 저장소 생성 (monorepo 구조)
- [ ] Docker & Docker Compose 설정
- [ ] PostgreSQL, Redis 로컬 환경 구축
- [ ] CI/CD 파이프라인 기본 설정 (GitHub Actions)

**프로젝트 스캐폴딩 (Week 1-2)**

- [ ] Next.js 14 프로젝트 초기화
  - App Router 설정
  - TailwindCSS + shadcn/ui
  - TypeScript 설정
- [ ] NestJS 프로젝트 초기화
  - Module 구조 설계
  - Prisma ORM 설정
  - 환경 변수 관리 (.env)
- [ ] DB 스키마 초기 마이그레이션
  - organizations, users, projects 테이블
  - 기본 seed 데이터

**개발 도구 (Week 2)**

- [ ] ESLint + Prettier 설정
- [ ] Git hooks (Husky)
- [ ] 테스트 프레임워크 설정 (Jest)
- [ ] 문서화 시스템 (Storybook 선택적)

#### Deliverables

- ✅ 로컬 개발 환경 동작
- ✅ CI/CD 파이프라인 기본 동작
- ✅ DB 연결 및 마이그레이션 성공

---

### Sprint 1: 인증 시스템 (Week 3-4)

#### 목표

- 사용자 회원가입/로그인
- JWT 기반 인증
- 기본 권한 관리

#### User Stories

**US-1: 사용자 회원가입**

```
As a new user
I want to sign up with email/password
So that I can access the platform

Acceptance Criteria:
- Email 유효성 검증
- 비밀번호 강도 검증 (8자 이상)
- 중복 이메일 방지
- 성공 시 자동 조직(org) 생성
```

**US-2: 사용자 로그인**

```
As a registered user
I want to log in with my credentials
So that I can access my account

Acceptance Criteria:
- 이메일/비밀번호 인증
- JWT 토큰 발급
- Refresh token 지원
- 실패 시 명확한 에러 메시지
```

#### Tasks

**Backend (Week 3)**

- [ ] User 모델 구현
- [ ] AuthService 구현
  - bcrypt 비밀번호 해싱
  - JWT 발급 로직
- [ ] AuthController 구현
  - POST /auth/signup
  - POST /auth/login
  - POST /auth/refresh
- [ ] JwtStrategy & Guard 구현
- [ ] 단위 테스트 작성

**Frontend (Week 4)**

- [ ] Sign Up 페이지
  - 폼 validation (react-hook-form + zod)
  - 에러 핸들링
- [ ] Sign In 페이지
- [ ] AuthContext/Provider
- [ ] Protected routes
- [ ] 로그인 상태 persistence (localStorage)

#### Deliverables

- ✅ 회원가입/로그인 작동
- ✅ JWT 인증 동작
- ✅ 테스트 커버리지 >70%

---

### Sprint 2: 크롤링 엔진 핵심 (Week 5-6)

#### 목표

- 웹 크롤링 기본 기능
- Job 설정 저장/실행
- 데이터 저장

#### User Stories

**US-3: 크롤링 작업 생성**

```
As a user
I want to create a crawling job with basic configuration
So that I can collect data from a website

Acceptance Criteria:
- Job 이름, URL 입력
- CSS 셀렉터로 필드 정의
- 설정 저장 (DB)
- YAML 형식으로 저장
```

**US-4: 크롤링 실행**

```
As a user
I want to manually run my crawling job
So that I can test if it works

Acceptance Criteria:
- "Run Now" 버튼 클릭
- Playwright로 페이지 로드
- 데이터 추출
- DB에 결과 저장
- 실행 상태 표시
```

#### Tasks

**Backend - Crawler Core (Week 5)**

- [ ] JobConfig 모델 구현
- [ ] JobRun 모델 구현
- [ ] CrawledData 모델 구현
- [ ] CrawlerService 구현
  - Playwright 초기화
  - 페이지 로드
  - 셀렉터 기반 데이터 추출
- [ ] JobsService 구현
  - CRUD operations
  - Job 실행 트리거
- [ ] JobsController 구현
  - POST /jobs (생성)
  - GET /jobs (목록)
  - GET /jobs/:id (상세)
  - POST /jobs/:id/run (실행)
- [ ] 에러 핸들링 & 재시도 로직

**Backend - Data Storage (Week 6)**

- [ ] 크롤링 데이터 저장 로직
- [ ] 데이터 검증
- [ ] 중복 제거 (선택적)
- [ ] Export 서비스 (CSV/JSON)
  - GET /jobs/:id/export?format=csv

**Testing**

- [ ] 크롤러 단위 테스트
- [ ] Jobs API 통합 테스트
- [ ] 샘플 웹사이트로 E2E 테스트

#### Deliverables

- ✅ 크롤링 작업 생성/실행 가능
- ✅ 데이터 DB 저장 확인
- ✅ Export 기능 동작

---

### Sprint 3: 스케줄러 (Week 7-8)

#### 목표

- Cron 기반 자동 실행
- 스케줄 관리

#### User Stories

**US-5: 크롤링 스케줄 설정**

```
As a user
I want to schedule my job to run automatically
So that I don't have to manually trigger it

Acceptance Criteria:
- Cron 표현식으로 스케줄 설정
- 타임존 지정 가능
- 다음 실행 시간 표시
- 활성화/비활성화 토글
```

#### Tasks

**Backend (Week 7)**

- [ ] SchedulerService 구현
  - node-cron 통합
  - Job 스케줄 등록/해제
  - 다음 실행 시간 계산
- [ ] Cron job runner
  - 스케줄된 Job 자동 실행
  - 실행 결과 저장
- [ ] 스케줄 관리 API
  - PUT /jobs/:id/schedule
  - DELETE /jobs/:id/schedule
- [ ] 서버 재시작 시 스케줄 복원

**Frontend (Week 8)**

- [ ] 스케줄 설정 UI
  - Cron 빌더 (간단한 UI)
  - 또는 cron 표현식 직접 입력
- [ ] 다음 실행 시간 표시
- [ ] 활성화/비활성화 토글

**Testing**

- [ ] 스케줄 정확성 테스트
- [ ] 타임존 테스트
- [ ] 서버 재시작 시나리오 테스트

#### Deliverables

- ✅ Cron 스케줄 동작
- ✅ 자동 실행 확인
- ✅ UI에서 스케줄 설정 가능

---

### Sprint 4: 프론트엔드 Core UI (Week 9-10)

#### 목표

- Dashboard 구현
- Job 관리 UI
- Visual Builder 기본

#### User Stories

**US-6: Dashboard 보기**

```
As a user
I want to see an overview of my jobs
So that I can monitor their status

Acceptance Criteria:
- 총 작업 수, 활성 작업 수 표시
- 최근 실행 내역 표시
- Quick actions (+ New Job)
- 성공률 차트
```

**US-7: Visual Builder로 Job 생성**

```
As a non-technical user
I want to create a job using a visual interface
So that I don't need to write code

Acceptance Criteria:
- URL 입력
- 필드 추가 (이름 + 셀렉터)
- Test 버튼으로 미리보기
- 저장 후 Job 생성
```

#### Tasks

**Frontend Core (Week 9)**

- [ ] Dashboard 페이지
  - Stats cards
  - Recent jobs list
  - Activity chart (Recharts)
- [ ] Jobs 목록 페이지
  - Table view
  - 필터링 (활성/비활성)
  - 검색
- [ ] Job 상세 페이지
  - Overview tab
  - Runs tab
  - Settings tab
- [ ] 레이아웃 & 네비게이션
  - Sidebar
  - Header
  - Responsive design

**Visual Builder (Week 10)**

- [ ] Multi-step form
  - Step 1: 기본 정보
  - Step 2: Source 설정
  - Step 3: 필드 정의
  - Step 4: 스케줄
- [ ] Field builder
  - 필드 추가/삭제
  - 셀렉터 입력
  - Transform 옵션 (extract_number 등)
- [ ] Test run 기능
  - API 호출
  - 결과 미리보기
- [ ] 저장 및 활성화

**State Management**

- [ ] React Query 셋업
  - Jobs queries
  - Mutations (create, update, delete)
- [ ] Zustand for UI state (선택적)

#### Deliverables

- ✅ Dashboard 완성
- ✅ Visual Builder로 Job 생성 가능
- ✅ 반응형 디자인 동작

---

### Sprint 5: 데이터 관리 & Export (Week 11-12)

#### 목표

- 크롤링 데이터 조회
- Export 기능
- 로그 & 모니터링

#### User Stories

**US-8: 크롤링 데이터 조회**

```
As a user
I want to view the data my job has collected
So that I can analyze it

Acceptance Criteria:
- Job별 데이터 조회
- 날짜 필터링
- 페이지네이션
- 검색 기능
```

**US-9: 데이터 Export**

```
As a user
I want to export my data to CSV/JSON
So that I can use it in other tools

Acceptance Criteria:
- Export 버튼 클릭
- 포맷 선택 (CSV/JSON)
- 파일 다운로드
- 대용량 데이터도 처리 가능
```

#### Tasks

**Backend (Week 11)**

- [ ] Data API 구현
  - GET /jobs/:id/data
  - 필터링, 페이지네이션, 검색
- [ ] Export 최적화
  - 스트리밍 방식 export
  - 대용량 파일 처리
- [ ] Logs API
  - GET /runs/:id/logs
  - 실시간 로그 조회 (선택적)

**Frontend (Week 12)**

- [ ] Data browser 페이지
  - 테이블 view
  - 필터 UI
  - 검색바
  - 페이지네이션
- [ ] Export UI
  - 포맷 선택
  - 다운로드 버튼
  - 진행 상태 표시 (대용량 시)
- [ ] Run detail 페이지
  - 실행 상태
  - 로그 표시
  - 통계 (items crawled, success rate 등)

#### Deliverables

- ✅ 데이터 조회 동작
- ✅ Export 기능 완성
- ✅ 로그 확인 가능

---

### Sprint 6: 템플릿 시스템 (Week 13)

#### 목표

- 템플릿 생성/사용
- 초기 템플릿 3개 작성

#### User Stories

**US-10: 템플릿으로 빠른 시작**

```
As a new user
I want to use a pre-built template
So that I can start quickly without configuring everything

Acceptance Criteria:
- 템플릿 목록 조회
- 템플릿 선택
- 설정 자동 입력
- 커스터마이징 후 저장
```

#### Tasks

**Backend (Week 13)**

- [ ] Template 모델 구현
- [ ] TemplatesService
  - CRUD operations
  - 글로벌 템플릿 관리
- [ ] TemplatesController
  - GET /templates
  - POST /templates
  - GET /templates/:id

**Frontend (Week 13)**

- [ ] Templates 페이지
  - 카드 레이아웃
  - 카테고리 필터
- [ ] Template 상세/프리뷰
- [ ] "Use Template" 기능
  - Job 생성 폼에 자동 입력

**Initial Templates**

- [ ] Template 1: Ecommerce Pricing
- [ ] Template 2: News Aggregator
- [ ] Template 3: Product Reviews

#### Deliverables

- ✅ 템플릿 시스템 동작
- ✅ 3개 템플릿 사용 가능

---

### Sprint 7: 통합 & 테스트 (Week 14)

#### 목표

- E2E 테스트
- 버그 수정
- 성능 최적화

#### Tasks

**Testing**

- [ ] E2E 테스트 시나리오 작성
  - 회원가입 → Job 생성 → 실행 → 데이터 조회
- [ ] Playwright E2E 테스트 구현
- [ ] 성능 테스트
  - 동시 크롤링 작업 처리
  - DB 쿼리 최적화
- [ ] 보안 테스트
  - SQL Injection 방지 확인
  - XSS 방지 확인
  - CSRF 토큰

**Bug Fixes & Optimization**

- [ ] 발견된 버그 수정
- [ ] UX 개선
- [ ] 에러 메시지 개선
- [ ] 로딩 상태 개선

**Documentation**

- [ ] API 문서 작성 (Swagger/OpenAPI)
- [ ] 사용자 가이드 초안
- [ ] 개발자 문서

#### Deliverables

- ✅ 주요 기능 E2E 테스트 통과
- ✅ 크리티컬 버그 0건
- ✅ API 문서 완성

---

### Sprint 8: 베타 준비 & 런칭 (Week 15-16)

#### 목표

- 베타 런칭
- 초기 사용자 온보딩
- 피드백 수집

#### Tasks

**Pre-Launch (Week 15)**

- [ ] Production 환경 구축 (GCP)
  - Cloud Run 배포
  - Cloud SQL 설정
  - 도메인 설정
  - SSL 인증서
- [ ] 모니터링 설정
  - 에러 추적 (Sentry)
  - 로그 수집
  - 알림 설정
- [ ] Landing page 제작
  - Hero section
  - Features
  - Beta signup form
- [ ] Onboarding flow
  - Welcome 이메일
  - 튜토리얼 (선택적)
- [ ] Beta user 모집
  - Product Hunt 준비
  - Reddit, HN 포스팅
  - 개인 네트워크 접촉

**Launch Week (Week 15)**

- [ ] Beta 출시
- [ ] Product Hunt 런칭
- [ ] 커뮤니티 포스팅
- [ ] 초기 사용자 온보딩

**Post-Launch (Week 16)**

- [ ] 사용자 피드백 수집
  - 인터뷰 (5-10명)
  - 설문 조사
  - 사용 패턴 분석
- [ ] Hot fixes
  - 크리티컬 버그 즉시 수정
- [ ] 빠른 개선
  - UX 개선
  - 자주 요청되는 기능 추가
- [ ] 다음 스프린트 계획

#### Deliverables

- ✅ Beta 서비스 운영 중
- ✅ 50명 이상 sign-up
- ✅ 피드백 수집 완료

---

## 📊 Product Backlog

### High Priority (MVP Must-Have)

| ID    | Story            | Priority | Estimate | Sprint |
| ----- | ---------------- | -------- | -------- | ------ |
| US-1  | 사용자 회원가입  | P0       | 3 pts    | 1      |
| US-2  | 사용자 로그인    | P0       | 3 pts    | 1      |
| US-3  | 크롤링 작업 생성 | P0       | 5 pts    | 2      |
| US-4  | 크롤링 실행      | P0       | 8 pts    | 2      |
| US-5  | 스케줄 설정      | P0       | 5 pts    | 3      |
| US-6  | Dashboard 보기   | P0       | 5 pts    | 4      |
| US-7  | Visual Builder   | P0       | 8 pts    | 4      |
| US-8  | 데이터 조회      | P0       | 5 pts    | 5      |
| US-9  | 데이터 Export    | P0       | 3 pts    | 5      |
| US-10 | 템플릿 사용      | P0       | 5 pts    | 6      |

### Medium Priority (Nice to Have)

| ID    | Story        | Priority | Estimate | Notes               |
| ----- | ------------ | -------- | -------- | ------------------- |
| US-11 | YAML Editor  | P1       | 5 pts    | MVP에 포함 가능하면 |
| US-12 | API Key 관리 | P1       | 3 pts    | Phase 2로 연기 가능 |
| US-13 | 팀원 초대    | P1       | 5 pts    | Phase 2             |
| US-14 | 알림 설정    | P1       | 3 pts    | 이메일만 MVP        |

### Low Priority (Phase 2)

| ID    | Story           | Priority | Estimate | Notes   |
| ----- | --------------- | -------- | -------- | ------- |
| US-15 | Webhook 트리거  | P2       | 8 pts    | Phase 2 |
| US-16 | SDK             | P2       | 13 pts   | Phase 2 |
| US-17 | 고급 워크플로우 | P2       | 13 pts   | Phase 2 |
| US-18 | 결제 시스템     | P2       | 8 pts    | PMF 후  |

---

## 👥 팀 구성 (권장)

### 최소 팀 (3-4명)

**1명: Full-stack Lead**

- 전체 아키텍처
- Backend 핵심 (크롤러, 스케줄러)
- 코드 리뷰

**1명: Backend Developer**

- API 개발
- DB 설계
- 테스트

**1명: Frontend Developer**

- React/Next.js
- UI 컴포넌트
- UX 구현

**(선택) 1명: Product/Design**

- UX 디자인
- 사용자 테스트
- 베타 관리

### 이상적 팀 (5-6명)

- 위 구성 +
- DevOps/인프라 엔지니어
- QA/테스트 엔지니어

---

## 🛠️ 개발 관행

### Daily Standup

- 매일 오전 10시 (15분)
- What did I do yesterday?
- What will I do today?
- Any blockers?

### Sprint Planning (격주)

- Sprint 시작일 (매 2주 월요일)
- User stories 선정
- Task breakdown
- Estimate 확인

### Sprint Review (격주)

- Sprint 마지막 날 (금요일)
- Demo
- Stakeholder 피드백

### Sprint Retrospective (격주)

- Sprint Review 직후
- What went well?
- What could be improved?
- Action items

### Code Review

- 모든 PR은 1명 이상 approve 필요
- 24시간 내 리뷰
- CI 통과 필수

### Testing

- 단위 테스트 커버리지 >70%
- E2E 테스트 주요 플로우
- PR 전 로컬 테스트 필수

---

## 📈 Success Metrics (MVP)

### Technical Metrics

| Metric            | Target | 측정 방법     |
| ----------------- | ------ | ------------- |
| Uptime            | >99%   | Monitoring    |
| API Response Time | <200ms | APM           |
| Test Coverage     | >70%   | Jest/Coverage |
| Build Time        | <5min  | CI/CD         |

### Product Metrics

| Metric             | Target | 측정 방법     |
| ------------------ | ------ | ------------- |
| Beta Sign-ups      | 50+    | Analytics     |
| Active Users (WAU) | 20+    | Analytics     |
| Jobs Created       | 100+   | DB Query      |
| Successful Runs    | >90%   | DB Query      |
| Time to First Job  | <5min  | User tracking |

### Business Metrics

| Metric              | Target | 측정 방법       |
| ------------------- | ------ | --------------- |
| Customer Interviews | 10+    | Manual tracking |
| NPS Score           | >40    | Survey          |
| Feature Requests    | Track  | Feedback form   |

---

## ⚠️ 리스크 관리

### High Risk

**R1: 크롤링 안정성**

- 위험: 웹사이트 구조 변경으로 크롤러 실패
- 완화: 에러 핸들링 강화, 알림, 재시도 로직
- 비상: 수동 개입 가이드 제공

**R2: 성능 이슈**

- 위험: 동시 크롤링으로 서버 과부하
- 완화: Rate limiting, 큐 시스템 (나중에)
- 비상: 사용자당 작업 수 제한

**R3: 베타 사용자 부족**

- 위험: 50명 미만 sign-up
- 완화: 다양한 채널 활용, 초기 네트워크 접촉
- 비상: 출시 연기, 추가 마케팅

### Medium Risk

**R4: 개발 일정 지연**

- 위험: 예상보다 복잡한 기능
- 완화: 버퍼 포함, scope 유연성
- 비상: 기능 축소 (YAML editor 등 연기)

**R5: 기술 부채**

- 위험: 빠른 개발로 코드 품질 저하
- 완화: 코드 리뷰, 리팩토링 시간 확보
- 비상: Phase 2 전 리팩토링 스프린트

---

## 📋 Definition of Done (DoD)

### User Story DoD

- ✅ Acceptance criteria 모두 충족
- ✅ 코드 리뷰 완료
- ✅ 단위 테스트 작성 및 통과
- ✅ 통합 테스트 통과 (해당 시)
- ✅ 문서 업데이트 (API 변경 시)
- ✅ QA 테스트 통과 (있는 경우)
- ✅ Staging 배포 및 검증

### Sprint DoD

- ✅ 모든 planned stories 완료
- ✅ No critical bugs
- ✅ 데모 가능한 상태
- ✅ 문서 업데이트
- ✅ Retrospective 완료

### MVP DoD

- ✅ 모든 Must-Have 기능 구현
- ✅ E2E 테스트 통과
- ✅ Production 배포 성공
- ✅ 사용자 가이드 작성
- ✅ 베타 사용자 온보딩 가능

---

## 🚀 배포 전략

### Environment

```
Development → Staging → Production
```

**Development**

- 로컬 Docker Compose
- 개발 중 테스트

**Staging**

- GCP Cloud Run (staging)
- PR 머지 후 자동 배포
- QA 테스트 환경

**Production**

- GCP Cloud Run (production)
- main 브랜치 머지 후 배포
- Manual approval 필요

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: flexcrawler-staging
          # ...

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: flexcrawler-production
          # ...
```

---

## 📚 Documentation Plan

### User Documentation

- [ ] Getting Started Guide
- [ ] Visual Builder Tutorial
- [ ] YAML Configuration Reference
- [ ] Templates Guide
- [ ] Troubleshooting

### Developer Documentation

- [ ] API Reference (Swagger)
- [ ] Architecture Overview
- [ ] Database Schema
- [ ] Contributing Guide
- [ ] Local Development Setup

### Internal Documentation

- [ ] Sprint Planning Notes
- [ ] Architecture Decision Records (ADRs)
- [ ] Runbooks (배포, 장애 대응)

---

## 🎯 Post-MVP Roadmap Preview

### Phase 2 (Month 5-8)

- Webhook 트리거
- Message Queue (Bull + Redis)
- SDK (TypeScript)
- 멀티 테넌시
- 팀 협업 기능

### Phase 3 (Month 9-12)

- 고급 Visual Builder (React Flow)
- 템플릿 마켓플레이스
- 결제 시스템 (Stripe)
- 엔터프라이즈 기능 (RBAC, SSO)

---

## ✅ 체크리스트: MVP 런칭 전

### Technical

- [ ] 모든 Must-Have 기능 구현 완료
- [ ] E2E 테스트 통과
- [ ] 보안 검토 완료
- [ ] 성능 테스트 통과
- [ ] 에러 모니터링 설정
- [ ] 백업 시스템 구축

### Product

- [ ] 사용자 가이드 작성
- [ ] Onboarding flow 테스트
- [ ] 10명 internal beta 완료
- [ ] 피드백 반영

### Business

- [ ] Landing page 완성
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] 베타 모집 채널 준비
- [ ] Product Hunt 페이지 작성

### Operations

- [ ] 고객 지원 채널 (이메일, Discord)
- [ ] 모니터링 대시보드
- [ ] 장애 대응 플랜
- [ ] 배포 runbook

---

## 📞 Next Steps

1. **팀 구성** (즉시)
   - 개발자 채용/배정
   - 역할 및 책임 명확화

2. **Kickoff Meeting** (Week 1)
   - 프로젝트 목표 공유
   - 일정 확인
   - 질문 및 우려사항

3. **Sprint 0 시작** (Week 1)
   - 환경 셋업
   - 첫 PR 머지

4. **Weekly Sync** (매주)
   - 진행 상황 리뷰
   - 블로커 해결

---

**문서 버전**: 1.0
**최종 수정**: 2025-11-23
**Next Review**: Sprint 0 완료 후 (Week 2 end)

---

## 📊 부록: 예상 비용 (MVP 4개월)

### 개발 비용 (팀 3명 가정)

- Full-stack Lead: $8k/월 × 4개월 = $32k
- Backend Dev: $6k/월 × 4개월 = $24k
- Frontend Dev: $6k/월 × 4개월 = $24k
- **소계**: $80k

### 인프라 비용 (베타)

- GCP (Cloud Run, Cloud SQL): $200/월 × 4 = $800
- 도메인 & SSL: $50
- 모니터링 (Sentry): $50/월 × 4 = $200
- **소계**: $1,050

### 기타 비용

- 디자인 툴 (Figma): $60
- 개발 툴: $200
- **소계**: $260

### **총계**: ~$81,310

_실제 비용은 팀 구성, 위치, 협상에 따라 달라질 수 있음_
