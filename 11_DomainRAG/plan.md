# Implementation Plan (plan.md): GraphMind SaaS

## Phase 1: 프로젝트 초기 설정 및 인증 (Project Setup & Auth)

**목표:** Next.js 프론트엔드와 FastAPI 백엔드 기본 구조를 잡고, Clerk을 통한 사용자 인증을 구현한다.

- [ ] **Repo Setup:** Monorepo 구조 (`apps/web`, `apps/api`) 생성 및 Git 초기화.
- [ ] **Frontend Setup:**
  - Next.js 16 설치 (`npx create-next-app@latest`).
  - Tailwind CSS 4.0 (Alpha) 또는 3.4 설정.
  - shadcn/ui 초기화 (`npx shadcn-ui@latest init`).
- **Backend Setup:**
  - Python 3.11 가상환경 설정.
  - FastAPI, Uvicorn 설치 및 "Hello World" 엔드포인트 작성.
- [ ] **Authentication:**
  - Clerk 프로젝트 생성 및 API Key 발급.
  - Next.js에 Clerk Provider 설정 (`<ClerkProvider>`).
  - 로그인/회원가입 페이지 구현.
  - FastAPI에 Clerk JWT 검증 Middleware 구현.

## Phase 2: 인프라 및 데이터베이스 구축 (Infra & DB)

**목표:** Neo4j 데이터베이스를 연결하고, 기본적인 데이터 모델을 검증한다.

- [ ] **Neo4j Setup:**
  - Neo4j AuraDB Free Tier 인스턴스 생성.
  - Python `neo4j` 드라이버 연결 테스트.
- [ ] **Vector Store Setup:**
  - Neo4j Vector Index 생성 (Cypher 쿼리 작성).
- [ ] **Redis Setup:**
  - Local Docker로 Redis 실행 (Celery Broker용).

## Phase 3: 데이터 수집 파이프라인 (Ingestion Pipeline)

**목표:** Google Drive와 Gmail에서 데이터를 가져와 전처리하는 로직을 구현한다.

- [ ] **Google Cloud Console:**
  - OAuth 2.0 Client ID 발급.
  - Drive API, Gmail API 활성화.
- [ ] **Backend Ingestion Logic:**
  - Google Auth Flow 구현 (Refresh Token 관리).
  - `GoogleDriveLoader` (LangChain) 또는 커스텀 로더 구현.
  - `GmailLoader` 구현.
- [ ] **Text Processing:**
  - LangChain `RecursiveCharacterTextSplitter` 적용.
  - OpenAI Embedding API 연동.

## Phase 4: 지식 그래프 구축 (Graph Construction)

**목표:** 텍스트에서 엔티티와 관계를 추출하여 Neo4j에 저장한다.

- [ ] **LLM Extraction Chain:**
  - LangChain `create_structured_output_chain` 등을 활용하여 Entity/Relation 추출 프롬프트 작성.
- [ ] **Graph Writer:**
  - 추출된 데이터를 Neo4j에 Upsert 하는 로직 구현.
  - 중복 노드 병합 (Entity Resolution) 로직 추가.

## Phase 5: GraphRAG 엔진 및 챗봇 (RAG Engine & Chat)

**목표:** LangGraph를 사용하여 질의 응답 로직을 구현하고 프론트엔드와 연동한다.

- [ ] **LangGraph Workflow:**
  - State 정의 (`messages`, `context`).
  - Nodes 구현 (`retrieve`, `generate`).
  - Conditional Edges 구현 (검색 결과 검증).
- [ ] **API Endpoint:**
  - `/chat/stream` 엔드포인트 구현 (SSE).
- [ ] **Frontend Chat UI:**
  - Vercel AI SDK (`useChat`) 연동.
  - 채팅 화면 UI (Message Bubble, Input) 구현.
  - Markdown 렌더링 지원.

## Phase 6: 시각화 및 고도화 (Visualization & Polish)

**목표:** 그래프 시각화 기능을 추가하고 UX를 개선한다.

- [ ] **Graph Visualization:**
  - `react-force-graph` 설치.
  - `/graph/visualize` API 연동하여 노드/엣지 렌더링.
- [ ] **Dashboard:**
  - 연동된 파일 수, 최근 동기화 시간 등 상태 표시.
- [ ] **Deployment:**
  - Frontend -> Vercel 배포.
  - Backend -> Cloud Run 또는 EC2 배포.
