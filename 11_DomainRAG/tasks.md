# Tasks Checklist (tasks.md)

## Phase 1: 프로젝트 초기 설정 및 인증 (Project Setup & Auth)

- [x] **Repository & Monorepo Setup**
  - [x] 프로젝트 루트 디렉토리 생성 및 Git 초기화 (`git init`).
  - [x] `.gitignore` 파일 생성 (Python, Node.js, Env 파일 제외).
  - [x] `apps/web` (Frontend) 및 `apps/api` (Backend) 디렉토리 구조 생성.
- [x] **Frontend Setup (Next.js)**
  - [x] `apps/web`에 Next.js 16+ 프로젝트 생성 (`create-next-app`).
  - [x] Tailwind CSS 설정 (v4.0 Alpha 또는 v3.4).
  - [x] shadcn/ui 초기화 및 기본 컴포넌트 설치 (`button`, `input`, `card` 등).
  - [x] `lucide-react` 아이콘 라이브러리 설치.
- [x] **Backend Setup (FastAPI)**
  - [x] `apps/api`에 Python 가상환경(`venv`) 생성 및 활성화.
  - [x] `requirements.txt` 작성 (fastapi, uvicorn, python-dotenv 등).
  - [x] FastAPI 기본 앱(`main.py`) 작성 및 실행 테스트 ("Hello World").
  - [x] 환경 변수 관리 설정 (`.env`, `pydantic-settings`).
- [x] **Authentication (Clerk)**
  - [x] Clerk 대시보드에서 새 프로젝트 생성.
  - [x] **Frontend:** `@clerk/nextjs` 설치 및 `<ClerkProvider>` 설정.
  - [x] **Frontend:** 로그인(`sign-in`), 회원가입(`sign-up`) 페이지 라우트 구현.
  - [x] **Frontend:** 헤더에 `UserButton` 추가하여 로그인 상태 확인.
  - [x] **Backend:** Clerk JWKS(JSON Web Key Set)를 이용한 JWT 검증 유틸리티 구현.
  - [x] **Backend:** 인증된 사용자만 접근 가능한 보호된 라우트 테스트.

## Phase 2: 인프라 및 데이터베이스 구축 (Infra & DB)

- [x] **Neo4j Setup**
  - [x] Neo4j AuraDB (Free Tier) 인스턴스 생성 및 접속 정보 확보.
  - [x] **Backend:** `neo4j` Python 드라이버 설치.
  - [x] **Backend:** Neo4j 연결 관리 클래스(`GraphDatabase`) 구현.
  - [x] **Backend:** 연결 테스트 스크립트 작성 및 확인.
- [x] **Vector Index Setup**
  - [x] Neo4j Browser에서 Vector Index 생성 Cypher 쿼리 실행 (Document, Email 임베딩용).
  - [x] **Backend:** 인덱스 생성 여부를 확인하고 없으면 생성하는 초기화 스크립트 작성.
- [x] **Redis & Celery Setup**
  - [x] `docker-compose.yml` 작성 (Redis 컨테이너 포함).
  - [x] **Backend:** `celery` 및 `redis` 패키지 설치.
  - [x] **Backend:** Celery 앱 설정 및 Worker 실행 테스트.

## Phase 3: 데이터 수집 파이프라인 (Ingestion Pipeline)

- [ ] **Google API Setup**
  - [ ] Google Cloud Console 프로젝트 생성.
  - [ ] Google Drive API, Gmail API 활성화.
  - [ ] OAuth 2.0 클라이언트 ID/Secret 발급 및 리다이렉트 URI 설정.
- [x] **Ingestion Auth Flow**
  - [x] **Frontend:** Google 연동 버튼 및 OAuth 권한 요청 로직 구현.
  - [x] **Backend:** OAuth Callback 처리 및 Refresh Token 저장 로직 (DB에 User별 저장).
- [x] **Drive Ingestion**
  - [x] **Backend:** Google Drive 파일 목록 조회 API 구현.
  - [x] **Backend:** 파일 다운로드 및 텍스트 추출 로직 (`unstructured` 또는 `langchain` 활용).
  - [x] **Backend:** 텍스트 Chunking 로직 구현 (`RecursiveCharacterTextSplitter`).
- [ ] **Gmail Ingestion**
  - [ ] **Backend:** Gmail API 연동 및 최근 이메일 가져오기 로직.
  - [ ] **Backend:** 이메일 본문 및 메타데이터(보낸사람, 날짜 등) 파싱.

## Phase 4: 지식 그래프 구축 (Graph Construction)

- [x] **LLM Extraction Logic**
  - [x] **Backend:** LangChain/OpenAI API 연동 설정.
  - [x] **Backend:** Entity(사람, 조직, 날짜 등) 및 Relation 추출을 위한 프롬프트 작성.
  - [x] **Backend:** Pydantic을 이용한 추출 데이터 구조화 (Structured Output).
- [x] **Graph Writing**
  - [x] **Backend:** 추출된 데이터를 Neo4j 노드/엣지로 변환하는 Cypher 쿼리 작성.
  - [x] **Backend:** `MERGE` 구문을 활용한 중복 방지 및 업데이트 로직 구현.
  - [x] **Backend:** 텍스트 Chunk에 대한 Vector Embedding 생성 및 저장.
- [x] **Pipeline Integration**
  - [x] Celery Task로 Ingestion -> Extraction -> Graph Write 전체 흐름 연결.

## Phase 5: GraphRAG 엔진 및 챗봇 (RAG Engine & Chat)

- [x] **LangGraph Workflow**
  - [x] **Backend:** `langgraph` 설치.
  - [x] **Backend:** Agent State 정의 (`messages`, `context`, `relevant_docs`).
  - [x] **Backend:** `Retrieve` 노드 구현 (Vector Search + Graph Traversal).
  - [x] **Backend:** `Generate` 노드 구현 (LLM 답변 생성).
  - [x] **Backend:** Workflow 컴파일 및 실행 테스트.
- [x] **Chat API**
  - [x] **Backend:** `/api/chat` 엔드포인트 생성.
  - [x] **Backend:** SSE(Server-Sent Events)를 이용한 스트리밍 응답 구현.
- [x] **Frontend Chat UI**
  - [x] **Frontend:** Vercel AI SDK (`useChat`) 설치.
  - [x] **Frontend:** 채팅 인터페이스 구현 (메시지 목록, 입력창).
  - [x] **Frontend:** 스트리밍 응답 표시 및 Markdown 렌더링.
  - [x] **Frontend:** 답변 내 인용(Source) 표시 UI.

## Phase 6: 시각화 및 고도화 (Visualization & Polish)

- [x] **Graph Visualization**
  - [x] **Frontend:** `react-force-graph` 또는 유사 라이브러리 설치.
  - [x] **Backend:** 시각화용 그래프 데이터(노드/링크) 조회 API 구현.
  - [x] **Frontend:** 그래프 렌더링 컴포넌트 구현 및 데이터 연동.
  - [x] **Frontend:** 노드 클릭 시 상세 정보 표시 기능.
- [x] **Dashboard & Polish**
  - [x] **Frontend:** 대시보드 페이지 (연동 상태, 최근 학습 문서 등).
  - [x] **Frontend:** UI/UX 다듬기 (Loading 상태, 에러 처리).
- [x] **Deployment**
  - [x] **Frontend:** Vercel 배포 설정.
  - [x] **Backend:** Dockerfile 작성 및 클라우드 배포 (Cloud Run 등).
