# 기술 조사: DCS 전체 시스템

**작성일**: 2025-01-18
**목적**: 기술 스택 선택 근거, 베스트 프랙티스, 대안 평가

---

## 1. 프론트엔드 프레임워크 선택

### 결정: Next.js 14 (App Router) + React 18

**선택 이유**:

- **Server Components**: 초기 로드 성능 향상, SEO 최적화
- **API Routes**: 백엔드 API를 동일 프로젝트에 통합 가능
- **Vercel 배포 최적화**: 자동 CI/CD, Edge Functions, Image Optimization
- **App Router**: 파일 기반 라우팅으로 개발 생산성 극대화
- **TypeScript First**: 타입 안전성 기본 제공

**고려된 대안**:

1. **Create React App (CRA)**:
   - 기각 이유: SSR 없음, 백엔드 분리 필요, 유지보수 중단
2. **Vite + React**:
   - 기각 이유: SSR 설정 복잡, API 서버 별도 구성 필요
3. **Remix**:
   - 기각 이유: 생태계 규모 작음, Vercel 통합 제한적

**베스트 프랙티스**:

- App Router 사용으로 서버/클라이언트 컴포넌트 분리
- `use client` 디렉티브를 상호작용 컴포넌트에만 제한
- Loading/Error UI를 `loading.tsx`, `error.tsx`로 표준화
- Parallel Routes로 챗봇 UI를 모달로 구현

---

## 2. UI 컴포넌트 라이브러리

### 결정: shadcn/ui + TailwindCSS

**선택 이유**:

- **Copy-Paste 철학**: npm 설치 없이 소스 코드 직접 수정 가능
- **Radix UI 기반**: 접근성(A11y) 표준 준수
- **커스터마이징 용이**: 디자인 시스템에 맞게 완전 제어 가능
- **TailwindCSS 통합**: 유틸리티 클래스로 빠른 스타일링

**고려된 대안**:

1. **Material-UI (MUI)**:
   - 기각 이유: 번들 크기 큼, 디자인 커스터마이징 어려움
2. **Ant Design**:
   - 기각 이유: 중국 중심 디자인, 무거운 의존성
3. **Chakra UI**:
   - 기각 이유: 런타임 CSS-in-JS 성능 오버헤드

**베스트 프랙티스**:

- 컴포넌트는 `src/components/ui/`에 격리
- 비즈니스 로직은 `src/components/dashboard/` 등에 분리
- 다크 모드는 `next-themes` 사용
- Form 검증은 `react-hook-form` + `zod` 조합

---

## 3. 백엔드 API 및 데이터베이스

### 결정: Next.js API Routes + Prisma + PostgreSQL + Firestore

**선택 이유**:

- **API Routes**: Next.js와 동일 레포지토리, Vercel Functions로 자동 배포
- **Prisma**: TypeScript 네이티브 ORM, 타입 안전 쿼리
- **PostgreSQL**: 관계형 데이터(사용자, 프로젝트 메타데이터) 저장
- **Firestore**: 동적 스키마 크롤링 데이터, 스키마리스 필수

**고려된 대안**:

1. **Express.js + TypeORM**:
   - 기각 이유: 별도 서버 관리 필요, 배포 복잡도 증가
2. **tRPC**:
   - 기각 이유: REST API 외부 접근 어려움 (API 키 제공 요구사항)
3. **MongoDB (모든 데이터)**:
   - 기각 이유: 사용자/프로젝트 관계 데이터에 부적합, Prisma 지원 제한적

**베스트 프랙티스**:

- API Routes는 `/app/api/` 아래 RESTful 구조
- Prisma Client는 싱글톤 패턴 (`src/lib/db/prisma.ts`)
- Firestore는 프로젝트별 컬렉션 격리: `projects/{projectId}/data/{dataId}`
- 환경 변수로 DB 연결 문자열 관리

---

## 4. 크롤링 엔진

### 결정: Playwright

**선택 이유**:

- **헤드리스 브라우저**: JavaScript 렌더링 페이지 완벽 지원
- **크로스 브라우저**: Chromium, Firefox, WebKit 지원
- **안정성**: Puppeteer 대비 더 나은 에러 핸들링, 자동 대기
- **TypeScript 지원**: 타입 안전 API

**고려된 대안**:

1. **Puppeteer**:
   - 기각 이유: Chromium만 지원, 자동 대기 기능 제한적
2. **Cheerio**:
   - 기각 이유: 정적 HTML만 파싱, 동적 콘텐츠 크롤링 불가
3. **Selenium**:
   - 기각 이유: 설정 복잡, 무거움, 테스트 도구로 설계됨

**베스트 프랙티스**:

- 헤드리스 모드 기본 사용 (`headless: true`)
- 타임아웃 30초 설정
- User-Agent 설정으로 봇 차단 회피
- `waitForSelector`로 동적 로딩 대기
- 스크린샷 저장 (디버깅 용도)

---

## 5. AI 통합 (CSS Selector 추천)

### 결정: OpenAI GPT-4 (Chat Completions API)

**선택 이유**:

- **HTML 이해도**: GPT-4는 HTML 구조 분석 능력 우수
- **프롬프트 엔지니어링**: Few-shot learning으로 Selector 추천 정확도 향상
- **Function Calling**: 구조화된 출력 (JSON) 생성 가능
- **한국어 지원**: 사용자 필드명(한국어) 해석 가능

**고려된 대안**:

1. **Claude (Anthropic)**:
   - 장점: 더 긴 컨텍스트, 정확도 우수
   - 기각 이유: OpenAI API 대비 느림, 가격 비쌈
2. **Gemini (Google)**:
   - 기각 이유: HTML 분석 능력 GPT-4 대비 부족, API 안정성 낮음
3. **Custom ML 모델**:
   - 기각 이유: 학습 데이터 부족, 유지보수 부담

**베스트 프랙티스**:

- System 프롬프트로 역할 정의: "당신은 HTML 전문가로 CSS Selector를 추천합니다"
- Few-shot examples 제공 (3-5개)
- 응답 형식을 JSON으로 강제: `response_format: { type: "json_object" }`
- 토큰 제한 관리: max_tokens=500
- 에러 시 폴백: 기본 Selector 규칙 적용 (h1, .title 등)

---

## 6. GCP 아키텍처 (크롤링 실행)

### 결정: Cloud Run + Cloud Pub/Sub + Cloud Scheduler

**선택 이유**:

- **Cloud Run**: 컨테이너 기반 자동 스케일링, 0→N 인스턴스
- **Pub/Sub**: 메시지 큐로 작업 분산, 재시도 자동 처리
- **Scheduler**: Cron 표현식 기반 스케줄링, 관리 불필요

**고려된 대안**:

1. **Cloud Functions**:
   - 기각 이유: 타임아웃 9분 제한, Playwright 무거움
2. **Compute Engine (VM)**:
   - 기각 이유: 관리 부담, 비용 비효율 (항상 실행)
3. **Kubernetes (GKE)**:
   - 기각 이유: 오버엔지니어링, 관리 복잡도 과도

**아키텍처 플로우**:

```
Cloud Scheduler (Cron 트리거)
    ↓
Next.js API (프로젝트 설정 로드)
    ↓
Pub/Sub (작업 메시지 발행: 256개)
    ↓
Cloud Run (크롤링 워커 인스턴스 자동 생성)
    ↓
Playwright (크롤링 실행)
    ↓
Firestore (데이터 저장)
    ↓
Next.js API (상태 업데이트)
    ↓
Google Chat 웹훅 (알림 전송)
```

**베스트 프랙티스**:

- Cloud Run 최소/최대 인스턴스 설정 (min: 0, max: 100)
- Pub/Sub 메시지에 projectId, taskId, URL 포함
- 재시도 정책: 최대 3회, exponential backoff
- Dead Letter Queue로 영구 실패 작업 격리
- Cloud Logging으로 모든 작업 로그 수집

---

## 7. 인증 및 보안

### 결정: NextAuth.js v5 (Auth.js)

**선택 이유**:

- **Next.js 통합**: App Router 네이티브 지원
- **이메일/비밀번호**: Credentials Provider
- **세션 관리**: JWT 기반, 서버리스 환경 최적화
- **확장성**: 향후 OAuth 추가 용이

**고려된 대안**:

1. **직접 구현 (bcrypt + JWT)**:
   - 기각 이유: 보안 위험, 유지보수 부담
2. **Clerk**:
   - 기각 이유: 외부 서비스 의존, 가격 비쌈
3. **Supabase Auth**:
   - 기각 이유: Supabase DB 강제, 아키텍처 제약

**베스트 프랙티스**:

- 비밀번호 해싱: bcrypt (salt rounds: 12)
- JWT Secret은 환경 변수 (`NEXTAUTH_SECRET`)
- 세션 만료: 7일
- CSRF 보호 자동 활성화
- Prisma Adapter로 사용자 데이터 PostgreSQL 저장

---

## 8. 테스팅 전략

### 결정: Jest (Unit) + Playwright (Integration/E2E)

**선택 이유**:

- **Jest**: React 컴포넌트 및 서비스 로직 단위 테스트
- **Playwright Test**: API 통합 테스트, E2E 시나리오 커버리지
- **일관성**: 크롤링 워커도 동일 도구 사용

**고려된 대안**:

1. **Vitest**:
   - 장점: Jest보다 빠름
   - 기각 이유: Next.js 공식 지원 Jest
2. **Cypress**:
   - 기각 이유: E2E만 지원, 크롤링 테스트 부적합

**테스트 범위**:

- **Unit**: 서비스 로직, 유틸리티 함수 (커버리지 > 80%)
- **Integration**: API Routes (모든 엔드포인트)
- **E2E**: 챗봇 플로우, 프로젝트 생성→실행→조회

**베스트 프랙티스**:

- Mock OpenAI API 응답 (비용 절감)
- Test 데이터베이스 분리 (Docker Compose)
- Playwright fixtures로 인증 상태 재사용
- CI/CD에서 병렬 테스트 실행

---

## 9. 배포 전략

### 결정: Vercel (Next.js) + GCP (Cloud Run)

**Vercel (Next.js 앱)**:

- 자동 CI/CD (GitHub 연동)
- Edge Functions (글로벌 CDN)
- 프리뷰 배포 (PR마다 자동)

**GCP (크롤링 워커)**:

- Cloud Build로 Docker 이미지 빌드
- Artifact Registry에 이미지 저장
- Cloud Run에 배포 (gcloud CLI)

**환경 변수 관리**:

- Vercel: 프로젝트 설정에서 관리
- Cloud Run: Secret Manager 사용

**베스트 프랙티스**:

- 프로덕션/스테이징 환경 분리
- 환경 변수는 `.env.example` 템플릿 제공
- Vercel Preview를 QA 환경으로 활용
- Cloud Run 버전 관리로 롤백 가능

---

## 10. 모니터링 및 로깅

### 결정: Vercel Analytics + GCP Cloud Logging

**Vercel Analytics**:

- 프론트엔드 성능 모니터링
- Core Web Vitals 추적

**Cloud Logging**:

- 크롤링 워커 로그 수집
- 구조화된 로깅 (JSON)
- Log Explorer로 쿼리

**알림**:

- Google Chat 웹훅 (크롤링 실패)
- Vercel 배포 실패 → Slack (옵션)

**베스트 프랙티스**:

- 모든 에러는 로그 + 스택 트레이스 포함
- 로그 레벨: ERROR, WARN, INFO, DEBUG
- 민감 정보 (API 키, 비밀번호) 로깅 금지
- 로그 보존 기간: 30일

---

## 11. 비용 최적화

### GCP 예상 비용 (월간 150,000 크롤링 작업 기준):

- **Cloud Run**: ~$30 (CPU 시간 기준, 평균 10초/작업)
- **Pub/Sub**: ~$5 (메시지 150,000건)
- **Firestore**: ~$10 (읽기/쓰기/저장)
- **Cloud Scheduler**: ~$1
- **Cloud Logging**: ~$5

**총 예상: ~$50/월**

### Vercel 비용:

- **Pro 플랜**: $20/월 (100GB 대역폭, 무제한 배포)

**총 인프라 비용: ~$70/월**

**최적화 전략**:

- Cloud Run 최소 인스턴스 0으로 설정 (사용하지 않을 때 비용 0)
- Firestore 인덱스 최소화
- Pub/Sub 메시지 배치 처리
- Vercel Image Optimization 사용 최소화

---

## 요약: 기술 스택 최종 결정

| 레이어      | 기술                        | 이유                                |
| ----------- | --------------------------- | ----------------------------------- |
| Frontend    | Next.js 14 + React 18       | SSR, API Routes 통합, Vercel 최적화 |
| UI          | shadcn/ui + TailwindCSS     | 커스터마이징 용이, 접근성           |
| Backend API | Next.js API Routes + Prisma | 통합 레포지토리, TypeScript         |
| Database    | PostgreSQL + Firestore      | 관계형 + 동적 스키마                |
| Crawling    | Playwright                  | 동적 콘텐츠 지원, 안정성            |
| AI          | OpenAI GPT-4                | HTML 분석 능력, 한국어              |
| Infra       | Vercel + GCP Cloud Run      | 자동 스케일링, 비용 효율            |
| Queue       | Cloud Pub/Sub               | 분산 처리, 재시도                   |
| Scheduler   | Cloud Scheduler             | Cron 관리 자동화                    |
| Auth        | NextAuth.js v5              | Next.js 네이티브, 확장성            |
| Testing     | Jest + Playwright Test      | Unit + Integration + E2E            |
| Logging     | Cloud Logging               | 구조화, 검색 가능                   |

모든 기술 선택은 **헌법 원칙 준수**를 최우선으로 검증되었습니다.
