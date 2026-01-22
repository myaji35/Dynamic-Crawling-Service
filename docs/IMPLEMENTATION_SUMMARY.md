# Playwright E2E 테스트 구현 계획 - MVP

**생성일**: 2025-11-23
**범위**: MVP (15-20개 핵심 테스트)
**스토리 수**: 3개
**예상 기간**: 9-12일 (3주 이내)

---

## 📋 문서 구조

### 핵심 문서

1. **docs/tech-spec.md** - 기술 명세서 (MVP)
   - 전체 아키텍처 및 기술 스택
   - 15-20개 테스트 범위 정의
   - Playwright 설정 (Chromium만)
   - Page Object Model 패턴
   - CI/CD 통합 전략

2. **docs/playwright-test-plan.md** - 초기 테스트 계획서
   - 30+ 테스트 시나리오 정의 (참고용)
   - Phase 2/3 확장 계획

### User Stories

1. **docs/stories/story-1-infrastructure-auth.md**
   - 테스트 인프라 & 인증 (P0)
   - 5-7 테스트
   - 3-4일 예상

2. **docs/stories/story-2-project-crud.md**
   - 프로젝트 CRUD (P0 + 일부 P1)
   - 5-7 테스트
   - 3-4일 예상

3. **docs/stories/story-3-visual-builder-cicd.md**
   - Visual Builder & CI/CD (P1)
   - 4-6 테스트
   - 3-4일 예상

---

## 🎯 MVP 범위 요약

### Story 1: 테스트 인프라 & 인증 (5-7 테스트)

**Goals:**

- Playwright 설치 및 설정
- 테스트 디렉토리 구조 생성
- 인증 픽스처 및 헬퍼 구현
- Clerk 인증 플로우 테스트

**주요 파일:**

- `playwright.config.ts`
- `tests/fixtures/auth.ts`
- `tests/pages/DashboardPage.ts`
- `tests/utils/test-helpers.ts`
- `tests/utils/database-helpers.ts`

**테스트:**

1. `e2e/auth/signin.spec.ts` - 로그인 (2 테스트)
2. `e2e/auth/signup.spec.ts` - 회원가입 (2 테스트)
3. `e2e/auth/logout.spec.ts` - 로그아웃 (1 테스트)
4. `e2e/auth/dashboard-access.spec.ts` - 대시보드 접근 (2 테스트)

**Acceptance Criteria:**

- ✅ Playwright 설치 및 설정 완료
- ✅ 인증 픽스처 작동
- ✅ 7개 인증 테스트 모두 통과
- ✅ 로컬에서 `npm run test:e2e` 실행 가능

---

### Story 2: 프로젝트 CRUD (5-7 테스트)

**Goals:**

- 프로젝트 관리 Page Objects 작성
- 프로젝트 CRUD 테스트 작성
- 크롤링 실행 테스트
- 테스트 데이터 격리

**주요 파일:**

- `tests/pages/ProjectsPage.ts`
- `tests/pages/ProjectDetailPage.ts`
- `tests/utils/database-helpers.ts` (확장)

**테스트:**

1. `e2e/projects/create-project.spec.ts` - 프로젝트 생성 (2 테스트)
2. `e2e/projects/list-projects.spec.ts` - 프로젝트 목록 (2 테스트)
3. `e2e/projects/view-project.spec.ts` - 프로젝트 상세 (1 테스트)
4. `e2e/projects/edit-project.spec.ts` - 프로젝트 수정 (2 테스트)
5. `e2e/projects/delete-project.spec.ts` - 프로젝트 삭제 (2 테스트)
6. `e2e/projects/run-crawling.spec.ts` - 크롤링 실행 (2 테스트)

**Acceptance Criteria:**

- ✅ Page Objects 작성 완료
- ✅ 11개 프로젝트 관리 테스트 모두 통과
- ✅ 테스트 격리 확인
- ✅ 실행 시간 < 3분

---

### Story 3: Visual Builder & CI/CD (4-6 테스트)

**Goals:**

- Visual Builder Page Object 작성
- Visual Builder 핵심 기능 테스트
- GitHub Actions 워크플로우 작성
- CI/CD 파이프라인 통합

**주요 파일:**

- `tests/pages/VisualBuilderPage.ts`
- `.github/workflows/playwright.yml`

**테스트:**

1. `e2e/visual-builder/load-page.spec.ts` - 페이지 로드 (2 테스트)
2. `e2e/visual-builder/add-field.spec.ts` - 필드 추가 (3 테스트)
3. `e2e/visual-builder/test-selector.spec.ts` - 셀렉터 테스트 (2 테스트)
4. `e2e/visual-builder/manage-fields.spec.ts` - 필드 관리 (3 테스트)

**Acceptance Criteria:**

- ✅ Visual Builder 테스트 10개 모두 통과
- ✅ GitHub Actions 워크플로우 작동
- ✅ PR 자동 테스트 실행 확인
- ✅ 전체 테스트 성공률 >= 95%
- ✅ CI 실행 시간 < 5분

---

## 📊 전체 테스트 수

| Story    | 테스트 파일 | 예상 테스트 수 | 우선순위 |
| -------- | ----------- | -------------- | -------- |
| Story 1  | 4개         | 5-7개          | P0       |
| Story 2  | 6개         | 5-7개          | P0 + P1  |
| Story 3  | 4개         | 4-6개          | P1       |
| **합계** | **14개**    | **15-20개**    | -        |

---

## 🛠️ 기술 스택

**테스트 프레임워크:**

- @playwright/test: ^1.40.0
- Node.js: 20.x
- TypeScript: 5.x

**브라우저:**

- Chromium (Desktop Chrome) - MVP
- Firefox, WebKit (Phase 2)
- Mobile Chrome, Safari (Phase 2)

**CI/CD:**

- GitHub Actions
- ubuntu-latest runner

**프로젝트 스택:**

- Next.js 16.0.1
- React 18.x
- Clerk 인증 ^6.35.2
- Prisma ORM ^6.19.0
- PostgreSQL

---

## 📐 아키텍처 패턴

### Page Object Model

```
tests/
├── pages/
│   ├── DashboardPage.ts       # 대시보드
│   ├── ProjectsPage.ts        # 프로젝트 목록
│   ├── ProjectDetailPage.ts   # 프로젝트 상세
│   └── VisualBuilderPage.ts   # Visual Builder
```

**장점:**

- 재사용성: 여러 테스트에서 동일한 페이지 메서드 사용
- 유지보수성: UI 변경 시 Page Object만 수정
- 가독성: 테스트 코드가 비즈니스 로직에 집중

### 테스트 픽스처

```
tests/
├── fixtures/
│   └── auth.ts               # 인증 픽스처
```

**기능:**

- `authenticatedPage`: 자동 로그인된 페이지 제공
- 모든 테스트에서 재사용 가능
- 테스트 코드 간소화

### 헬퍼 함수

```
tests/
├── utils/
│   ├── test-helpers.ts       # 공통 헬퍼
│   └── database-helpers.ts   # DB 헬퍼
```

**기능:**

- `createTestProject()`: 테스트 프로젝트 생성
- `clearUserProjects()`: 테스트 데이터 정리
- `clearDatabase()`: 전체 DB 초기화

---

## 🚀 구현 순서

### Week 1: Story 1 (인프라 & 인증)

**Day 1-2:**

- Playwright 설치 및 설정
- 디렉토리 구조 생성
- 픽스처 및 헬퍼 작성

**Day 3-4:**

- 인증 테스트 작성 (4개 파일, 7개 테스트)
- 모든 테스트 통과 확인

### Week 2: Story 2 (프로젝트 CRUD)

**Day 5-6:**

- Page Objects 작성 (ProjectsPage, ProjectDetailPage)
- Database helpers 확장

**Day 7-8:**

- CRUD 테스트 작성 (6개 파일, 11개 테스트)
- 크롤링 실행 테스트
- 테스트 격리 검증

### Week 3: Story 3 (Visual Builder & CI/CD)

**Day 9-10:**

- Visual Builder Page Object 작성
- Visual Builder 테스트 작성 (4개 파일, 10개 테스트)

**Day 11-12:**

- GitHub Actions 워크플로우 작성
- CI/CD 통합 및 검증
- PR 테스트 자동 실행 확인
- 전체 문서 업데이트

---

## ✅ 최종 완료 조건

### 기능 완료

- [ ] Playwright 설치 및 설정 완료
- [ ] 14개 테스트 파일 작성 완료
- [ ] 15-20개 테스트 모두 통과
- [ ] 4개 Page Objects 작성 완료
- [ ] 인증 픽스처 작동
- [ ] Database helpers 작성

### 품질 검증

- [ ] 로컬에서 모든 테스트 100% 통과
- [ ] CI에서 모든 테스트 100% 통과
- [ ] 테스트 성공률 >= 95%
- [ ] Flaky test < 5%
- [ ] 평균 실행 시간 < 5분

### CI/CD 통합

- [ ] GitHub Actions 워크플로우 작동
- [ ] PR 자동 테스트 실행 확인
- [ ] 테스트 리포트 아티팩트 업로드
- [ ] PR 체크 상태 표시

### 문서화

- [ ] README.md 업데이트 (테스트 실행 방법)
- [ ] CONTRIBUTING.md 업데이트 (PR 체크리스트)
- [ ] .env.test.example 생성

---

## 📊 성공 지표 (MVP)

**정량적:**

1. ✅ 15-20개 핵심 테스트 구현 완료
2. ✅ 테스트 성공률 95% 이상
3. ✅ 평균 실행 시간 < 5분 (Chromium만)
4. ✅ Flaky test < 5%
5. ✅ 모든 P0 테스트 100% 통과
6. ✅ Chromium 브라우저 지원

**정성적:**

1. ✅ 개발자가 테스트 작성/실행에 자신감
2. ✅ PR 리뷰 시 테스트 결과 신뢰
3. ✅ 회귀 버그 조기 발견 (핵심 플로우)
4. ✅ 배포 프로세스 개선

---

## 🔄 향후 확장 계획

### Phase 2 (향후 4-6주)

**크로스 브라우저 & 모바일:**

- Firefox, WebKit 브라우저 추가
- Mobile Chrome, Mobile Safari 테스트

**추가 기능:**

- 대시보드 통계 상세 검증
- 활동 차트 렌더링 테스트
- Visual Builder AI 추천 기능
- 다중 URL 크롤링
- 페이지네이션 처리

**테스트 수:** 20-30개 (누적)

### Phase 3 (향후 8-12주)

**Comprehensive 테스트:**

- 30-40개 전체 시나리오
- 성능 테스트 (Lighthouse)
- 접근성 테스트 (axe-core)
- 시각적 회귀 테스트 (Percy/Chromatic)

---

## 📚 참고 자료

**문서:**

- [Playwright 공식 문서](https://playwright.dev/)
- [Clerk 인증 문서](https://clerk.com/docs)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Prisma 문서](https://www.prisma.io/docs)

**내부 문서:**

- `/docs/tech-spec.md` - 기술 명세서
- `/docs/playwright-test-plan.md` - 테스트 계획서
- `/docs/stories/` - User Stories (3개)

**기존 코드:**

- `src/app/(dashboard)/` - 대시보드 및 프로젝트 관리
- `src/components/visual-builder/` - Visual Builder 컴포넌트
- `src/lib/crawler/` - 크롤링 엔진

---

## 🎯 Quick Start

### 로컬 개발 환경 설정

```bash
# 1. Playwright 설치
npm install -D @playwright/test
npx playwright install chromium

# 2. 환경 변수 설정
cp .env.example .env.test
# TEST_USER_EMAIL, TEST_USER_PASSWORD 등 설정

# 3. 테스트 실행
npm run test:e2e          # 모든 테스트
npm run test:e2e:ui       # UI 모드
npm run test:e2e:headed   # 브라우저 보면서
npm run test:e2e:debug    # 디버그 모드

# 4. 리포트 확인
npm run test:e2e:report
```

### CI에서 실행

```bash
# PR 생성 시 자동 실행
git checkout -b feature/my-feature
git push origin feature/my-feature
# GitHub에서 PR 생성하면 자동으로 Playwright 테스트 실행
```

---

## 💡 핵심 설계 결정

### 1. MVP 범위 선택 이유

**장점:**

- ✅ 빠른 배포 (3주 이내)
- ✅ 핵심 플로우 100% 커버 (P0 + 중요 P1)
- ✅ 점진적 확장 가능 (Phase 2/3)
- ✅ 즉각적인 가치 제공 (CI/CD 통합)

**트레이드오프:**

- ⚠️ 크로스 브라우저는 Phase 2
- ⚠️ 모바일은 Phase 2
- ⚠️ 일부 P1/P2 기능은 Phase 2/3

### 2. Chromium 우선 이유

**근거:**

- 대부분 사용자가 Chrome/Chromium 기반 브라우저 사용
- 빠른 테스트 실행 시간 (< 5분)
- 안정적인 테스트 (Flaky test 최소화)

**Phase 2에서 확장:**

- Firefox (Gecko 엔진 검증)
- WebKit (Safari 호환성)
- Mobile (반응형 UI 검증)

### 3. Page Object Model 패턴

**선택 이유:**

- 유지보수성: UI 변경 시 Page Object만 수정
- 재사용성: 여러 테스트에서 동일한 메서드 사용
- 가독성: 테스트 코드가 비즈니스 로직에 집중

**대안 (미채택):**

- Component Testing: 더 세밀하지만 E2E 목적과 맞지 않음
- Inline Selectors: 유지보수 어려움

### 4. GitHub Actions CI/CD

**선택 이유:**

- GitHub과 긴밀한 통합
- 무료 tier 제공 (public repos)
- 설정 간단 (YAML)

**대안 (미채택):**

- CircleCI, Travis CI: 추가 비용, 복잡성
- Jenkins: 자체 호스팅 필요

---

**문서 작성**: 2025-11-23
**마지막 업데이트**: 2025-11-23
**다음 단계**: Story 1 구현 시작
