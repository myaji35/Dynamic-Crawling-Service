# 구현 계획: DCS (동적 크롤링 서비스) 전체 시스템

**Branch**: `001-ai-chatbot-crawling-system` | **Date**: 2025-01-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-chatbot-crawling-system/spec.md`

**Note**: 이 문서는 `/speckit.plan` 명령어로 생성되었습니다. 실행 워크플로우는 `.specify/templates/commands/plan.md`를 참조하세요.

## 요약

DCS는 AI 챗봇 기반의 웹 크롤링 서비스로, 비개발자도 자연어 대화를 통해 크롤링 프로젝트를 생성하고 관리할 수 있습니다. Next.js 기반 프론트엔드, Node.js 백엔드 API, GCP Cloud Run/Pub/Sub를 활용한 분산 크롤링 엔진, Firestore 동적 스키마 데이터베이스로 구성됩니다.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x (LTS)
**Primary Dependencies**:

- Frontend: Next.js 14 (App Router), React 18, TailwindCSS, shadcn/ui
- Backend API: Next.js API Routes, Prisma ORM
- Crawling Engine: Playwright (헤드리스 브라우저)
- AI: OpenAI API (ChatGPT-4) - CSS Selector 추천 및 자연어 처리

**Storage**:

- Primary DB: PostgreSQL (프로젝트 메타데이터, 사용자, API 키)
- NoSQL: Firestore (동적 스키마 크롤링 데이터)
- Queue: Google Cloud Pub/Sub

**Testing**:

- Unit: Jest, React Testing Library
- Integration: Playwright Test
- E2E: Playwright

**Target Platform**:

- Frontend: Vercel (Next.js hosting)
- Backend API: Vercel Serverless Functions
- Crawling Workers: Google Cloud Run
- Scheduler: Google Cloud Scheduler

**Project Type**: Web application (frontend + backend)

**Performance Goals**:

- 대시보드 응답 시간: < 2초
- 샘플 크롤링 실행: < 10초 (단일 페이지)
- 동시 크롤링 작업: 256개 이상
- API 응답 시간: < 500ms (p95)

**Constraints**:

- 챗봇 응답 시간: < 3초 (AI 처리 포함)
- 크롤링 타임아웃: 30초
- 단일 크롤링 데이터 크기: < 1MB
- 동시 사용자: 100명

**Scale/Scope**:

- 예상 사용자: 100명 (동시 접속)
- 프로젝트당 평균 URL: 256개
- 사용자당 평균 프로젝트: 5개
- 총 월간 크롤링 작업: ~150,000건

## Constitution Check

_GATE: Phase 0 연구 시작 전 통과 필수. Phase 1 설계 후 재검증._

### I. 사용자 중심의 단순성 (NON-NEGOTIABLE)

**준수 상태**: ✅ **통과**

- AI 챗봇 인터페이스를 통한 자연어 설정 ✓
- CSS Selector, Cron 자동 변환으로 기술 용어 숨김 ✓
- 샘플 크롤링을 통한 즉시 검증 ✓
- OpenAI GPT-4를 활용한 HTML 분석 및 Selector 추천 ✓

### II. 프로젝트별 동적 스키마 지원

**준수 상태**: ✅ **통과**

- Firestore 사용으로 스키마리스 데이터 저장 ✓
- projectId + run_timestamp 메타데이터 포함 ✓
- 프로젝트 간 완전 격리된 컬렉션 구조 ✓
- 필드 추가/삭제 시 다른 프로젝트 영향 없음 ✓

### III. AI 기반 자동화

**준수 상태**: ✅ **통과**

- OpenAI GPT-4를 통한 HTML 구조 분석 ✓
- 필드명 기반 CSS Selector 자동 추천 ✓
- 샘플 크롤링으로 추천 검증 ✓
- 재시도 로직 및 에러 패턴 로깅 ✓

### IV. 확장성과 안정성 (NON-NEGOTIABLE)

**준수 상태**: ✅ **통과**

- Cloud Run을 통한 수평적 오토스케일링 ✓
- Cloud Pub/Sub 기반 작업 큐 분산 처리 ✓
- 프로젝트별 독립 실행 환경 (컨테이너 격리) ✓
- 256개 이상 동시 작업 처리 설계 ✓

### V. 관찰 가능성 (Observability)

**준수 상태**: ✅ **통과**

- Next.js 대시보드를 통한 실시간 상태 시각화 ✓
- 성공/실패/대기 상태 명확한 UI 표시 ✓
- 에러 로그 상세 기록 및 재시도 버튼 제공 ✓
- Cloud Logging을 통한 구조화된 로깅 ✓
- 최근 데이터 샘플 뷰어 ✓

### 기술 제약사항 준수

**GCP 플랫폼**: ✅ Cloud Run, Pub/Sub, Scheduler, Firestore 사용
**크롤링 엔진**: ✅ Playwright (헤드리스 브라우저, 동적 콘텐츠 지원)
**보안**: ✅ Prisma Row-Level Security, API 키 해싱, 암호화 저장

### 품질 기준 준수

**성능**: ✅ 대시보드 < 2초, 샘플 크롤링 < 10초, 256+ 동시 작업
**사용자 경험**: ✅ 프로젝트 생성 < 5분, 이해 가능한 에러 메시지
**안정성**: ✅ 작업 격리, 자동 재시도, 95% 성공률 목표

### 최종 평가

**GATE STATUS**: ✅ **모든 원칙 및 제약사항 통과 - 진행 승인**

위반 사항 없음. 복잡성 정당화 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-chatbot-crawling-system/
├── spec.md              # 기능 명세서
├── plan.md              # 이 파일 (구현 계획)
├── research.md          # Phase 0: 기술 조사 결과
├── data-model.md        # Phase 1: 데이터 모델 설계
├── quickstart.md        # Phase 1: 개발 환경 설정 가이드
├── contracts/           # Phase 1: API 계약 명세
│   ├── auth-api.md
│   ├── project-api.md
│   ├── crawling-api.md
│   └── notification-api.md
└── tasks.md             # Phase 2: 구현 작업 목록 (별도 생성)
```

### Source Code (repository root)

```text
# Web Application Structure (Next.js 14 App Router)

src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 인증 관련 페이지
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/         # 대시보드 (인증 필요)
│   │   ├── page.tsx        # 프로젝트 목록
│   │   ├── projects/
│   │   │   └── [id]/       # 프로젝트 상세
│   │   └── settings/       # 사용자 설정
│   ├── api/                 # API Routes
│   │   ├── auth/           # 인증 API
│   │   ├── projects/       # 프로젝트 CRUD
│   │   ├── crawling/       # 크롤링 실행/조회
│   │   ├── data/           # 수집 데이터 조회
│   │   └── webhook/        # Google Chat 웹훅 테스트
│   ├── layout.tsx
│   └── page.tsx            # 랜딩 페이지
├── components/
│   ├── ui/                  # shadcn/ui 컴포넌트
│   ├── chat/               # AI 챗봇 UI
│   ├── dashboard/          # 대시보드 컴포넌트
│   └── crawling/           # 크롤링 관련 UI
├── lib/
│   ├── db/                 # Prisma 클라이언트
│   ├── firestore/          # Firestore 클라이언트
│   ├── openai/             # OpenAI API 래퍼
│   ├── pubsub/             # Pub/Sub 발행자
│   └── utils/              # 유틸리티 함수
├── services/
│   ├── auth.service.ts
│   ├── project.service.ts
│   ├── chatbot.service.ts  # AI 챗봇 로직
│   └── selector.service.ts # CSS Selector 추천
└── types/
    ├── project.ts
    ├── crawling.ts
    └── api.ts

crawling-worker/              # Cloud Run 크롤링 워커 (별도 서비스)
├── src/
│   ├── index.ts            # Pub/Sub 메시지 수신
│   ├── crawler.ts          # Playwright 크롤링 로직
│   ├── selector.ts         # CSS Selector 실행
│   └── firestore.ts        # 데이터 저장
├── Dockerfile
└── package.json

prisma/
├── schema.prisma           # PostgreSQL 스키마
└── migrations/

tests/
├── unit/                   # Jest 단위 테스트
├── integration/            # API 통합 테스트
└── e2e/                    # Playwright E2E 테스트
```

**Structure Decision**:

Next.js 14 App Router 기반 웹 애플리케이션 구조를 선택했습니다. 이유:

1. **단일 레포지토리**: 프론트엔드와 백엔드 API를 하나의 Next.js 프로젝트로 통합하여 개발 효율성 극대화
2. **Vercel 최적화**: Next.js를 Vercel에 배포하면 자동 스케일링, Edge Functions, ISR 등 활용 가능
3. **크롤링 워커 분리**: 무거운 Playwright 작업은 별도 Cloud Run 서비스로 분리하여 Next.js API의 타임아웃 회피
4. **TypeScript 전체 적용**: 프론트엔드-백엔드-워커 모두 동일 언어로 타입 안전성 확보

## Complexity Tracking

> Constitution Check 위반 사항 없음. 작성 불필요.

---

## Phase 0: Outline & Research (다음 단계)

다음 섹션은 Phase 0 연구 작업으로 `research.md`에 작성됩니다.
