# GraphRAG SaaS 테스트 계획서

## 1. 개요

본 문서는 GraphRAG SaaS 시스템의 테스트 전략을 기술합니다. 백엔드 서비스, API 엔드포인트, 그리고 프론트엔드 통합 테스트를 포함합니다.

## 2. 백엔드 단위 및 통합 테스트 (Backend Unit & Integration Tests)

**도구:** `pytest`, `httpx`

### 2.1 인증 (Authentication) (`apps/api/app/api/endpoints/auth.py`)

- [ ] **GET /authorize**: 유효한 Google OAuth URL과 `state`를 반환하는지 확인.
- [ ] **GET /callback**: `code`와 `state`를 받아 토큰 교환(Mock) 후 Neo4j에 저장하는지 확인.

### 2.2 데이터 수집 서비스 (Ingestion Service) (`apps/api/app/services/drive_service.py`)

- [ ] **DriveService**: Neo4j에서 토큰을 정상적으로 조회하는지 확인.
- [ ] **DriveService**: `list_files`가 파일 목록을 반환하는지 확인 (Mock 또는 실제).
- [ ] **POST /ingest/drive/sync**: 동기화 프로세스가 정상적으로 트리거되는지 확인.

### 2.3 그래프 구축 (Graph Construction) (`apps/api/app/services/extraction_service.py`, `graph_service.py`)

- [ ] **ExtractionService**: LLM 추출 로직이 구조화된 `GraphData`를 반환하는지 확인 (Mock LLM 응답).
- [ ] **GraphService**: `save_graph_data`가 Neo4j에 노드와 관계를 생성하는지 확인.

### 2.4 RAG 엔진 (RAG Engine) (`apps/api/app/services/rag_service.py`)

- [ ] **RAGService**: `_retrieve`가 Neo4j에서 맥락(Context)을 가져오는지 확인.
- [ ] **RAGService**: `_generate`가 답변을 생성하는지 확인.
- [ ] **POST /chat**: 스트리밍 응답 형식이 올바른지 확인.

### 2.5 시각화 (Visualization) (`apps/api/app/api/endpoints/graph.py`)

- [ ] **GET /graph/visualize**: `nodes`와 `links`가 올바른 형식으로 반환되는지 확인.

## 3. 프론트엔드 검증 (Frontend Verification - Manual)

- [ ] **Google 연동**: "Connect Google Workspace" 버튼 클릭 시 리다이렉트 확인.
- [ ] **채팅 인터페이스**: 메시지 입력 시 스트리밍 응답이 표시되는지 확인.
- [ ] **그래프 시각화**: 그래프가 노드와 링크로 렌더링되는지 확인.

## 4. 실행 계획

1.  `pytest` 및 `pytest-asyncio` 설치 (완료).
2.  `apps/api/tests` 디렉토리 생성 및 테스트 코드 작성 (완료).
3.  백엔드 테스트 실행 및 버그 수정.
4.  프론트엔드 수동 검증 진행.
