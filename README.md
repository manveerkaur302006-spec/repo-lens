# RepoLens

RepoLens is an opinionated toolset for analyzing, indexing and summarizing code repositories using modern vector search, LLM-backed orchestration, and graph analysis.

This repository contains a full-stack reference implementation comprising a Python backend (FastAPI) and a TypeScript + React frontend (Vite). It integrates embeddings, vector DBs, and knowledge-graph storage to enable fast repository-level search, structural analysis, and summarization.

## Quick overview

- **Backend**: Python + FastAPI (async) with services for parsing, embeddings, RAG, orchestration, and persistence.
- **Frontend**: React + TypeScript + Vite; lightweight UI for submitting repository URLs, showing summaries, chat and visual graph views.
- **Persistence & infra**: Postgres (relational metadata), Neo4j (code structure graph), Chroma (vector store for embeddings).
- **Workers**: background analysis worker(s) that clone repos, parse files, generate embeddings, and orchestrate analysis tasks.
- **Why**: This combination balances structured graph queries (Neo4j) with fast semantic search (Chroma) and reliable relational metadata (Postgres).

## Architecture

1. Client (frontend) triggers an analysis request (URL or repo).  
2. Backend orchestrates analysis using the `analysis_orchestrator` service and dispatches work to `analysis_worker`.  
3. Worker clones repo, parses source files (tree-sitter), extracts code regions, and computes embeddings.  
4. Embeddings are persisted to Chroma; code structure is persisted to Neo4j; metadata stored in Postgres.  
5. RAG and summarization services combine graph context + vector search + LLM responses to build summaries and chat answers.

High-level files of interest

- `backend/src/main.py` — FastAPI entrypoint, app configuration and lifespan hooks.
- `backend/src/api/routes.py` — API endpoints exposed to the frontend.
- `backend/src/services/` — service implementations (embedding_service, rag_service, parser_service, github_service, etc.).
- `backend/src/database/` — clients for Postgres, Neo4j, and Chroma.
- `backend/src/parsers/` — language support and Tree-sitter based parsing.
- `frontend/src/` — React app, UI components and pages.

## Technology choices — what and why

- FastAPI (Backend): modern, async-first Python framework with excellent developer ergonomics, auto-generated OpenAPI, and compatibility with `uvicorn` for production ASGI.
- React + TypeScript + Vite (Frontend): fast dev server, typed UI components for predictable code and DX.
- Tree-sitter (parsers): robust, fast parsing across many languages — ideal for structural analysis of code.
- Chroma (vector DB): lightweight vector store for embeddings with local/remote deployments; suitable for prototype and production.
- Neo4j (graph DB): stores code structure and relationships (call graph, type relations) where graph queries are more natural and performant.
- Postgres: reliable relational store for indexed metadata, job records, and transactional needs.
- Google GenAI (or other LLMs): used by the summarization/RAG services to synthesize human-friendly descriptions.

## Setup & local development

Prereqs: Python 3.11+, Node 18+, Docker (optional for infra), git

1) Run with Docker Compose (recommended for full stack)

```bash
docker compose up --build
```

This brings up backend, frontend, and the configured services (Postgres, Neo4j, etc.) if present in `docker-compose.yml`.

2) Run backend locally (fast iteration)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at `http://localhost:8000` and the OpenAPI docs at `/docs`.

3) Run frontend locally

```bash
cd frontend
npm install
npm run dev
```

Open the dev UI at the URL printed by Vite (usually `http://localhost:5173`). The frontend talks to the backend API; configure the API base URL in `frontend/src/api/client.ts` if needed.

## Environment variables and secrets

The project may require API keys or credentials for LLM providers, and DB connection strings. Typical env vars:

- `DATABASE_URL` — Postgres connection string
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` — Neo4j connection
- `CHROMA_SETTINGS` — Chroma configuration if remote
- `GOOGLE_GENAI_API_KEY` — Google GenAI key or alternate provider env

Set these in your shell, or in a `.env` file and load them before starting the backend.

## Running tests

Backend tests use `pytest` and `pytest-asyncio`.

```bash
cd backend
pytest
```

Frontend tests (if present) can be run with your chosen test runner (e.g., Vitest, Jest).

## Development notes & extension points

- Parser support: `backend/src/parsers` centralizes language-specific parsing. Add or tune Tree-sitter grammars for more accurate extraction.
- Embeddings: `embedding_service.py` abstracts embedding generation. Swap models/providers by updating this service.
- RAG and Summarization: `rag_service.py` and `summary_service.py` show where LLM prompts and retrieval logic live. Tune prompts or add context sources to improve results.
- Graph modeling: `graph_service.py` contains logic to map code elements to graph nodes/edges. Extend to capture additional relationships (dependencies, ownership, tests).

## Security & operational notes

- Secrets: never commit API keys or credentials. Use environment variables or a secrets manager.
- Rate limits & costs: LLM calls may be billable. Implement batching, caching, and usage quotas for production.
- Data retention: embeddings and extracted code may be sensitive. Treat storage with appropriate access controls.

## Contributing

1. Fork the repo and create a feature branch.  
2. Run tests and linters locally.  
3. Open a PR with a clear description of the change and the motivation.

## Where to look first (recommended onboarding)

1. Read `backend/src/main.py` to understand app lifecycle and DB init.  
2. Inspect `backend/src/services/analysis_orchestrator.py` to follow request flows.  
3. Inspect `backend/src/parsers/tree_sitter_parser.py` to understand extraction rules.  
4. Start the stack with `docker compose up` and run an end-to-end analysis from the UI.

## Next steps & ideas

- Add automated integration tests that run analysis on small sample repos.  
- Add caching layer to reduce repeated LLM/embedding calls.  
- Add role-based access control to the API for multi-user deployments.

