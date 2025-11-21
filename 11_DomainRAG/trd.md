# Technical Requirements Document (TRD): GraphMind SaaS

## 1. 시스템 아키텍처 개요 (System Architecture Overview)

본 시스템은 **Next.js 16+** 기반의 프론트엔드와 **Python (FastAPI)** 기반의 백엔드(AI/Graph Engine)로 구성된 하이브리드 아키텍처를 채택합니다.

### 1.1 High-Level Architecture

- **Frontend (Client):** Next.js 16 (App Router), React Server Components.
- **Authentication:** Clerk (User Management & OAuth).
- **Backend (AI Engine):** Python FastAPI (LangGraph, LangChain 실행).
- **Database:**
  - **Graph & Vector:** Neo4j AuraDB (Graph + Vector Index).
  - **Cache/Queue:** Redis (Celery Task Queue).
- **External Services:** Google Workspace APIs (Drive, Gmail), OpenAI API.

## 2. 기술 스택 요구사항 (Tech Stack Requirements)

### 2.1 Frontend (Web Application)

- **Framework:** **Next.js 16+** (TurboPack, Server Actions 적극 활용).
- **Language:** TypeScript 5.x.
- **Styling:** **Tailwind CSS 4.0** (예정) 또는 3.x.
- **UI Components:** **shadcn/ui** (Radix UI 기반).
- **Authentication:** **Clerk** (Next.js SDK).
  - Google Social Login 필수.
  - Multi-tenancy 지원 (Organization 기능 활용).
- **State Management:** Zustand (Client State), TanStack Query (Server State).
- **Visualization:** `react-force-graph` 또는 `cytoscape.js` (지식 그래프 시각화).

### 2.2 Backend (GraphRAG Engine)

- **Framework:** FastAPI (Python 3.11+).
- **AI Orchestration:** **LangGraph** (Stateful Multi-Agent Workflows).
- **LLM Integration:** LangChain.
- **Task Queue:** Celery + Redis (대용량 문서 비동기 처리).
- **API Documentation:** OpenAPI (Swagger UI).

### 2.3 Infrastructure & DevOps

- **Hosting:**
  - Frontend: Vercel.
  - Backend: AWS EC2 / Google Cloud Run (Dockerized).
- **Database:** Neo4j AuraDB (Managed Service).
- **CI/CD:** GitHub Actions.

## 3. 기능적 요구사항 (Functional Requirements)

### 3.1 인증 및 사용자 관리 (Auth & User)

- **Clerk 연동:**
  - 회원가입/로그인 (Google 계정 연동).
  - 사용자 세션 관리.
  - Google Drive/Gmail 접근 권한(Scope) 관리 (Clerk 또는 별도 OAuth Flow).
    - _Note: Clerk의 Google Social Login과 별개로, 앱이 Drive/Gmail 데이터에 접근하기 위한 추가적인 OAuth Token 발급 및 갱신 로직이 필요할 수 있음._

### 3.2 데이터 수집 (Ingestion)

- **Google Drive:**
  - 파일 목록 조회 및 변경 사항 감지.
  - 지원 포맷: PDF, DOCX, PPTX, TXT, MD.
  - 대용량 파일 처리 (Chunking).
- **Gmail:**
  - 최근 이메일 수집.
  - Thread 구조 파악.
- **Rate Limiting:** Google API Quota 준수를 위한 Throttling 구현.

### 3.3 GraphRAG (Retrieval & Generation)

- **Indexing:**
  - Unstructured Data -> Graph Nodes/Edges 변환 (LLM 기반 추출).
  - Vector Embedding 생성 및 Neo4j 저장.
- **Querying:**
  - 사용자 질문 의도 파악 (Intent Classification).
  - Cypher Query 생성 및 실행.
  - Vector Similarity Search 실행.
  - 검색 결과 Reranking 및 답변 생성.

## 4. 비기능적 요구사항 (Non-Functional Requirements)

### 4.1 성능 (Performance)

- **응답 속도:**
  - 일반 챗봇 응답: 3초 이내 (Streaming).
  - 복잡한 Graph Multi-hop 질의: 10초 이내 (Progress UI 제공).
- **동기화 속도:** 증분 동기화(Incremental Sync) 시 5분 이내 반영.

### 4.2 보안 (Security)

- **데이터 암호화:** 전송 중(TLS 1.3), 저장 중(AES-256) 암호화.
- **데이터 격리:** Neo4j 내에서 `TenantID` 라벨링을 통한 논리적 데이터 격리 필수.
- **API 보안:** Backend API는 Frontend(Next.js Server)에서의 요청만 허용 (API Key 또는 JWT 검증).

### 4.3 확장성 (Scalability)

- **Stateless Backend:** API 서버는 수평 확장 가능해야 함.
- **Async Processing:** 문서 파싱 및 그래프 생성 작업은 비동기 큐로 처리하여 사용자 경험 저하 방지.
