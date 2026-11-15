# SERVIQ-X Backend & AI Infrastructure

SERVIQ-X is a production-minded autonomous AI customer support backend built with **Node.js, TypeScript, Express.js, LangGraph.js, Groq API, and Supabase (PostgreSQL + pgvector + Auth + Storage)**.

---

## 🏛 Architecture Overview

```
                      +-----------------------------+
                      |   Customer / Agent Client   |
                      +--------------+--------------+
                                     |  REST / Socket.IO
                                     v
                      +-----------------------------+
                      |    Express.js & Socket.IO   |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               |                     |                     |
               v                     v                     v
+-----------------------+ +--------------------+ +--------------------+
| Supabase Auth & Multi | | RAG Engine (PDFs,  | | LangGraph.js Agent |
| Tenant Isolation Middleware | Chunker, pgvector) | | (11-Node Workflow) |
+-----------------------+ +--------------------+ +---------+----------+
                                                           |
                                                           v
                                                +--------------------+
                                                | Groq Llama 3.3 LLM |
                                                | + LangSmith Tracing|
                                                +--------------------+
```

---

## 🚀 Quick Start

### 1. Installation
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(The backend runs out-of-the-box with local deterministic intelligence and memory store when live keys are omitted).*

### 3. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000` with live Socket.IO enabled.

---

## 🧪 Testing & Validation

### Run Full Test Suite (Vitest)
```bash
npm test
```
Executes 21 unit & integration tests covering Authentication, Multi-tenant Isolation, RAG Retrieval, LangGraph Agent Workflow, Human Takeover Guardrails, and End-to-End API flows.

### Run AI & RAG Evaluation Suite
```bash
npm run evaluate
```
Runs the 8 curated evaluation cases (Refunds, Shipping, Payment Anomaly, Human Demand, Angry Sentiment, Anti-Hallucination, Out-of-Scope) and prints a live scorecard measuring:
- Answer Correctness
- Grounded Faithfulness
- Retrieval Quality
- Intent Classification
- Escalation Accuracy
- Tool Execution Idempotency

---

## 🗄 Database Migrations (Supabase)

The database schema and pgvector similarity search function are located at:
```
supabase/migrations/20261115000001_initial_schema.sql
```

To apply to your live Supabase project:
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Paste the contents of `supabase/migrations/20261115000001_initial_schema.sql`.
3. Click **Run**.

Tables created:
1. `companies`
2. `company_members`
3. `documents`
4. `document_chunks` (with 1536-dim pgvector HNSW index)
5. `conversations`
6. `messages`
7. `tickets`

---

## 🛡 Security & Multi-Tenancy

- **Row Level Security (RLS)**: PostgreSQL functions verify that `auth.uid()` belongs to the company workspace.
- **Tenant Middleware**: Resolves and verifies tenant access on every protected request.
- **Race Condition Prevention**: The AI agent re-verifies live database ownership before sending any automated message to prevent race conditions after human takeover.
- **Input Validation**: Strict Zod schemas on body, params, and query parameters.
- **Rate Limiting**: Defends against API abuse and chat spam.

---

## 📡 Key API Examples

### Health Check
```bash
curl -X GET http://localhost:5000/api/health
```

### Customer Live Chat Query
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is your refund timeframe policy?"}'
```

### Human Takeover (Agent Console)
```bash
curl -X POST http://localhost:5000/api/conversations/conv-demo-001/takeover \
  -H "Authorization: Bearer demo-agent-token" \
  -H "Content-Type: application/json" \
  -d '{"agentName": "Rahul Sharma"}'
```

### Request AI Suggested Reply
```bash
curl -X POST http://localhost:5000/api/agent/suggest-reply \
  -H "Authorization: Bearer demo-agent-token" \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "conv-demo-001"}'
```
