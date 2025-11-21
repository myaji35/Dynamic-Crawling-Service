# Product Requirements Document (PRD): Personal Knowledge Graph RAG SaaS

## 1. 프로젝트 개요 (Project Overview)

**프로젝트명:** GraphMind (가칭)
**목표:** 사용자의 Google Drive와 Gmail 데이터를 학습하여, 문서와 이메일 간의 관계를 이해하고 맥락에 맞는 답변을 제공하는 GraphRAG 기반의 지식 관리 SaaS 구축.
**핵심 가치:** 단순 키워드 검색을 넘어, 데이터 간의 연결성(Graph)을 활용하여 "숨겨진 맥락"까지 찾아주는 차세대 개인화 검색/질의응답 서비스.

## 2. 타겟 오디언스 (Target Audience)

- **지식 근로자:** 수많은 문서와 이메일 속에서 특정 정보를 찾거나, 과거 히스토리를 파악해야 하는 기획자, 연구원, 개발자.
- **프로젝트 매니저:** 여러 프로젝트에 걸친 이메일 커뮤니케이션과 문서 흐름을 한눈에 파악하고 싶은 관리자.
- **법조인/컨설턴트:** 방대한 양의 케이스 스터디 자료와 클라이언트 커뮤니케이션 내역을 구조화하여 분석해야 하는 전문가.

## 3. 핵심 기능 (Core Features)

### 3.1 데이터 수집 및 연동 (Data Ingestion)

- **Google Workspace 연동:**
  - OAuth 2.0 기반의 안전한 인증.
  - **Google Drive:** 문서(Docs, PDF, PPTX 등) 텍스트 추출 및 메타데이터(작성자, 생성일, 폴더 구조) 수집.
  - **Gmail:** 이메일 본문, 첨부파일, 발신자/수신자 관계, 타임스탬프 수집.
- **증분 동기화 (Incremental Sync):** 최초 전체 학습 후, 변경/추가된 데이터만 주기적으로 업데이트.

### 3.2 지식 그래프 구축 (Knowledge Graph Construction)

- **비정형 데이터 처리 (ETL):** LangChain/LlamaIndex를 활용한 텍스트 청킹(Chunking).
- **엔티티 및 관계 추출 (Entity & Relation Extraction):**
  - LLM을 사용하여 텍스트에서 주요 엔티티(사람, 조직, 프로젝트, 날짜, 핵심 키워드 등) 추출.
  - 엔티티 간의 관계(예: `Person A` -[SENT]-> `Email B`, `Document C` -[MENTIONS]-> `Project D`) 정의.
- **Graph Store:** **Neo4j**를 사용하여 노드(Node)와 엣지(Edge)로 구성된 지식 그래프 저장.

### 3.3 GraphRAG 엔진 (Retrieval-Augmented Generation)

- **하이브리드 검색:**
  - Vector Search (의미론적 유사성 검색) + Graph Traversal (관계 기반 탐색) 결합.
- **LangGraph 기반 오케스트레이션:**
  - 복잡한 질의 처리를 위한 에이전트 워크플로우 설계.
  - Query Decomposer -> Retriever (Graph/Vector) -> Answer Generator 흐름 제어.
  - Multi-hop Reasoning: "A 프로젝트와 관련하여 B가 보낸 이메일 중 C 이슈가 언급된 문서는?"과 같은 복합 질문 처리.

### 3.4 사용자 인터페이스 (User Interface)

- **대화형 챗봇:** 자연어 질문에 대한 답변 및 근거 자료(출처) 제시.
- **그래프 시각화:** 검색 결과와 연관된 지식 그래프를 시각적으로 탐색하는 기능 (Neo4j Bloom 스타일).
- **대시보드:** 데이터 연동 상태, 학습 현황, 최근 인사이트 요약.

### 3.5 SaaS 관리 기능

- **구독 모델:** Free (용량 제한), Pro, Enterprise.
- **멀티 테넌시:** 사용자별 데이터의 완벽한 논리적/물리적 격리 (Neo4j Database 분리 또는 Label 기반 격리).

## 4. 기술 스택 (Tech Stack)

### Backend

- **Language:** Python 3.11+
- **Framework:** FastAPI (API 서버)
- **Orchestration:** **LangGraph** (Stateful Agent Workflow), LangChain
- **Database:**
  - **Graph DB:** **Neo4j** (AuraDB or Self-hosted Enterprise)
  - **Vector DB:** Neo4j Vector Index (통합 사용) 또는 Pinecone/Weaviate
  - **RDBMS:** PostgreSQL (사용자 정보, 결제, 메타데이터 관리)
- **Task Queue:** Celery / Redis (비동기 데이터 인덱싱 처리)

### Frontend

- **Framework:** Next.js 14+ (App Router)
- **UI Library:** Shadcn/ui, Tailwind CSS
- **Graph Visualization:** React Force Graph 또는 Neo4j 관련 라이브러리

### AI/LLM

- **Models:** GPT-4o (Main Reasoning), GPT-3.5-turbo/Claude-3-Haiku (Extraction & Indexing - 비용 최적화)
- **Embedding:** OpenAI text-embedding-3-small/large

## 5. 데이터 모델링 (Graph Schema 예시)

- **Nodes:** `User`, `Email`, `Document`, `Person`, `Organization`, `Topic`, `Date`
- **Relationships:**
  - `(:User)-[:SENT]->(:Email)`
  - `(:Email)-[:MENTIONS]->(:Topic)`
  - `(:Document)-[:CREATED_BY]->(:Person)`
  - `(:Email)-[:HAS_ATTACHMENT]->(:Document)`

## 6. 마일스톤 (Milestones)

### Phase 1: MVP (Minimum Viable Product)

- Google 로그인 및 Drive/Gmail 읽기 권한 획득.
- 기본적인 텍스트 추출 및 Vector+Graph 인덱싱 파이프라인 구축.
- LangGraph 기반의 단순 QA 챗봇 구현.
- 로컬 환경에서의 PoC 검증.

### Phase 2: SaaS 화 및 고도화

- 멀티 유저 지원 및 데이터 격리 아키텍처 적용.
- GraphRAG 검색 정확도 튜닝 (Community Detection 등 그래프 알고리즘 적용).
- 초기 사용자 베타 테스트 및 피드백 반영.

### Phase 3: 확장

- Slack, Notion 등 추가 데이터 소스 연동.
- 엔터프라이즈 기능 (SSO, 감사 로그) 추가.

## 7. 주요 고려사항 (Risks & Constraints)

- **개인정보보호 (Privacy):** 사용자의 민감한 이메일/문서를 다루므로 보안이 최우선. LLM 전송 시 PII(개인식별정보) 마스킹 고려 필요.
- **비용 (Cost):** 그래프 구축 시 LLM 토큰 사용량이 많을 수 있음. 소형 모델(SLM) 활용이나 추출 로직 최적화 필수.
- **Google API Quota:** Gmail/Drive API의 사용량 제한(Rate Limit)을 고려한 백그라운드 동기화 설계 필요.
