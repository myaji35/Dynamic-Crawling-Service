# Low-Level Design (LLD): GraphMind SaaS

## 1. 디렉토리 구조 (Directory Structure)

### 1.1 Monorepo Structure

```
root/
├── apps/
│   ├── web/                 # Next.js 16 Frontend
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── ...
│   └── api/                 # Python FastAPI Backend
│       ├── app/
│       │   ├── api/         # Endpoints
│       │   ├── core/        # Config, Security
│       │   ├── services/    # Business Logic (Ingestion, Graph)
│       │   ├── models/      # Pydantic Models
│       │   └── utils/
│       ├── main.py
│       └── requirements.txt
├── packages/                # Shared Libraries (Optional)
├── docker-compose.yml
└── README.md
```

## 2. 데이터베이스 스키마 (Neo4j Schema Design)

### 2.1 Nodes (Labels & Properties)

- **`User`**
  - `id`: String (Clerk User ID, Unique Index)
  - `email`: String
  - `name`: String
- **`Document`**
  - `id`: String (Drive File ID)
  - `title`: String
  - `mimeType`: String
  - `url`: String
  - `content`: String (Embedding 대상)
  - `createdAt`: DateTime
  - `embedding`: Vector<Float>
- **`Email`**
  - `id`: String (Gmail Message ID)
  - `subject`: String
  - `sender`: String
  - `date`: DateTime
  - `snippet`: String
  - `embedding`: Vector<Float>
- **`Person`**
  - `name`: String
  - `email`: String (Optional)
- **`Entity`** (Generic)
  - `name`: String
  - `type`: String (e.g., Organization, Project, Location)

### 2.2 Relationships (Edge Types)

- `(:User)-[:OWNS]->(:Document)`
- `(:User)-[:RECEIVED]->(:Email)`
- `(:User)-[:SENT]->(:Email)`
- `(:Email)-[:MENTIONS]->(:Person)`
- `(:Email)-[:RELATES_TO]->(:Project)`
- `(:Document)-[:REFERENCES]->(:Document)`
- `(:Document)-[:CONTAINS_TOPIC]->(:Entity)`

## 3. API 명세 (API Specifications)

### 3.1 Backend API (FastAPI)

#### Authentication

- 모든 요청 헤더에 `Authorization: Bearer <Clerk_Token>` 포함.
- Middleware에서 Token 검증 및 `User` 컨텍스트 주입.

#### Ingestion Endpoints

- `POST /api/v1/ingest/drive/sync`
  - Desc: Google Drive 변경사항 동기화 트리거.
  - Body: `{ "folder_ids": ["..."] }`
- `POST /api/v1/ingest/gmail/sync`
  - Desc: Gmail 최근 메일 동기화 트리거.

#### Chat & Graph Endpoints

- `POST /api/v1/chat/stream`
  - Desc: 사용자 질문에 대한 스트리밍 답변.
  - Body: `{ "message": "...", "history": [...] }`
  - Response: SSE (Server-Sent Events).
- `GET /api/v1/graph/visualize`
  - Desc: 특정 쿼리 또는 문서 주변의 그래프 데이터 조회.
  - Query Params: `node_id`, `depth`.

## 4. 컴포넌트 설계 (Component Design)

### 4.1 Frontend Components (Next.js)

- **`ChatInterface`**:
  - `useChat` (Vercel AI SDK) 활용.
  - 메시지 입력 및 스트리밍 렌더링.
  - 답변 내 인용(Citation) 클릭 시 원본 문서 링크/그래프 노드 하이라이트.
- **`GraphVisualizer`**:
  - `react-force-graph-2d` 사용.
  - 노드 클릭 시 상세 정보 패널(Side Panel) 표시.
  - Zoom/Pan 제어.
- **`ConnectButton`**:
  - Google OAuth 연동 상태 표시 및 재인증 트리거.

### 4.2 Backend Services (Python)

- **`IngestionService`**:
  - Google API Client 관리.
  - 파일 다운로드 -> 텍스트 추출(Unstructured.io) -> 청킹.
- **`GraphBuilder`**:
  - LLM(OpenAI)을 호출하여 텍스트에서 엔티티/관계 추출 (JSON Output).
  - Neo4j Cypher 쿼리 생성 및 실행 (Batch 처리).
- **`RAGAgent` (LangGraph)**:
  - **State**: `messages`, `context`, `steps`.
  - **Nodes**:
    - `retrieve_vector`: 벡터 검색.
    - `retrieve_graph`: Cypher 쿼리 생성 및 그래프 탐색.
    - `generate_answer`: 최종 답변 생성.
  - **Edges**: 검색 결과가 불충분하면 검색 쿼리 재작성(Rewrite) 루프.

## 5. 데이터 흐름 (Data Flow)

### 5.1 Ingestion Flow

1.  User clicks "Sync Now" (Frontend).
2.  API calls `ingest/drive/sync` (Backend).
3.  Backend adds task to Celery Queue.
4.  Worker fetches file list from Google Drive API.
5.  For each new file:
    - Download content.
    - Extract text & Metadata.
    - **LLM Extraction:** Extract Entities & Relations.
    - **Embedding:** Create Vector Embedding.
    - **Neo4j Write:** Create Nodes & Edges.

### 5.2 Query Flow

1.  User asks "What did Alex say about Project X?"
2.  `RAGAgent` analyzes query.
3.  **Step 1 (Vector):** Search for "Project X", "Alex".
4.  **Step 2 (Graph):** Find `(:Person {name:"Alex"})-[:SENT]->(e:Email)-[:RELATES_TO]->(:Project {name:"Project X"})`.
5.  **Step 3 (Synthesis):** Combine email contents and generate answer.
6.  Stream response to Frontend.
