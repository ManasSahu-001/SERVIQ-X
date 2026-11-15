# SERVIQ-X Backend API & Real-time Integration Contract

This document specifies the REST API endpoints, request/response schemas, error envelopes, and Socket.IO real-time events for **SERVIQ-X**.

---

## 1. Authentication & Tenant Authorization

### Headers
Every request to protected endpoints must include:
```http
Authorization: Bearer <SUPABASE_JWT_TOKEN>
```
To target a specific workspace when a user belongs to multiple organizations:
```http
x-company-id: <COMPANY_UUID>
```

### Demo / Hackathon Test Token
When `DEMO_AUTH_ENABLED=true`, pass:
```http
Authorization: Bearer demo-agent-token
```
This maps to the seeded test user (`00000000-0000-0000-0000-000000000001`) with Admin privileges for Company `11111111-1111-1111-1111-111111111111`.

---

## 2. Standard Response Envelopes

### Success Envelope
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "path": "name",
        "message": "Company name must be at least 2 characters"
      }
    ]
  }
}
```

---

## 3. Endpoints

### 3.1 Health Check
- **`GET /api/health`**
- **Auth**: Public
- **Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-11-15T07:18:00.000Z",
    "version": "1.0.0",
    "environment": "development",
    "services": {
      "supabase": "connected",
      "groq": "live-api",
      "langsmith": "active-tracing"
    }
  },
  "message": "SERVIQ-X Backend API is operational"
}
```

---

### 3.2 Customer Floating Chat Widget
- **`POST /api/chat`**
- **Auth**: Public (Rate-limited to 60 req/min)
- **Request Body**:
```json
{
  "message": "My payment was deducted but order was not confirmed",
  "conversationId": "optional-uuid"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "conv-demo-001",
      "company_id": "11111111-1111-1111-1111-111111111111",
      "customer_name": "Customer (Live Chat)",
      "status": "escalated",
      "assigned_to": "human",
      "priority": "P1",
      "ticket_id": "TCK-8824",
      "messages": []
    },
    "aiReply": "I apologize for any distress regarding your payment deduction! Please share your Order ID or bank transaction reference so we can reconcile it with our gateway immediately.",
    "createdTicket": "TCK-8824"
  }
}
```

---

### 3.3 Company Workspace
- **`POST /api/companies`** (Auth: User JWT)
  - Body: `{ "name": "Acme SaaS" }`
  - Response: `{ "success": true, "data": { "company": {...}, "member": {...} } }`
- **`GET /api/companies/me`** (Auth: User JWT)
  - Returns the authenticated user's workspace & role.

---

### 3.4 Documents & Knowledge Base
- **`POST /api/documents/upload`** (Auth: Bearer JWT + Tenant)
  - Content-Type: `multipart/form-data`
  - Fields: `file` (PDF/TXT), `category` (string, e.g. "Refund Policy")
  - Response: `{ "success": true, "data": { "id": "...", "status": "indexed", "tokens_count": 1250 } }`
- **`GET /api/documents`** (Auth: Bearer JWT + Tenant)
  - Returns list of indexed documents with page counts and tokens.
- **`GET /api/documents/:id`** (Auth: Bearer JWT + Tenant)
- **`DELETE /api/documents/:id`** (Auth: Bearer JWT + Tenant)
  - Cascades deletion to all vector chunks in pgvector.

---

### 3.5 Conversations
- **`POST /api/conversations`** (Auth: Optional JWT)
  - Body: `{ "customerName": "...", "customerEmail": "...", "subject": "...", "message": "..." }`
- **`GET /api/conversations`** (Auth: Bearer JWT + Tenant)
  - Returns all conversations for the tenant with messages, priority, and ticketId.
- **`GET /api/conversations/:id`** (Auth: Bearer JWT + Tenant)
- **`POST /api/conversations/:id/messages`** (Auth: Bearer JWT + Tenant)
  - Body: `{ "content": "Hello customer", "sender": "agent", "senderName": "Agent Name" }`
- **`POST /api/conversations/:id/takeover`** (Auth: Bearer JWT + Tenant)
  - Body: `{ "agentName": "Priya Sharma" }`
  - **Behavior**: Atomically locks conversation to `assigned_to = "human"`, pauses AI autopilot, injects system notice, emits Socket.IO event.
- **`POST /api/conversations/:id/handback`** (Auth: Bearer JWT + Tenant)
  - Restores conversation to AI autopilot.

---

### 3.6 Support Tickets
- **`GET /api/tickets`** (Auth: Bearer JWT + Tenant)
- **`GET /api/tickets/:id`** (Auth: Bearer JWT + Tenant)
- **`POST /api/tickets`** (Auth: Bearer JWT + Tenant)
  - Body:
    ```json
    {
      "conversationId": "optional-uuid",
      "title": "Payment reconciliation request",
      "category": "Payment",
      "priority": "P1",
      "assignedTo": "Support Lead",
      "notes": "Bank reference ref-8812"
    }
    ```
- **`PATCH /api/tickets/:id`** (Auth: Bearer JWT + Tenant)
  - Body: `{ "status": "in_progress" | "resolved", "priority": "P1" | "P2" | "P3", "assignedTo": "..." }`

---

### 3.7 AI Copilot Agent
- **`POST /api/agent/respond`**
  - Body: `{ "conversationId": "...", "message": "..." }`
- **`POST /api/agent/suggest-reply`**
  - Body: `{ "conversationId": "..." }`
  - Returns: `{ "text": "...", "sources": ["Payment Policy (Page 2)"], "confidence": 95 }`
- **`POST /api/agent/summarize`**
  - Body: `{ "conversationId": "..." }`
  - Returns: `{ "summary": "...", "conversationId": "..." }`

---

### 3.8 Analytics
- **`GET /api/analytics/overview`**
- **`GET /api/analytics/conversations`**
- **`GET /api/analytics/tickets`**

---

## 4. Socket.IO Real-Time Engine

### Connection
- **URL**: `ws://localhost:5000` or `http://localhost:5000`
- **Auth**: Pass token in `socket.auth.token` or headers.

### Rooms
- `company:<companyId>` — tenant-wide broadcasts for new tickets, escalations, dashboard metrics.
- `conversation:<conversationId>` — conversation-specific room for live messages and typing indicators.

### Event Names

| Category | Event Name | Direction | Payload |
|---|---|---|---|
| **Customer** | `customer:message` | Both | `{ conversationId, content, senderName }` |
| | `customer:typing` | Both | `{ conversationId, isTyping: boolean }` |
| | `conversation:created` | Server -> Client | `Conversation` object |
| **Agent** | `agent:message` | Both | `{ conversationId, content, senderName }` |
| | `agent:typing` | Both | `{ conversationId, isTyping: boolean }` |
| | `agent:takeover` | Server -> Client | `{ conversationId, agentName, message }` |
| | `agent:handback` | Server -> Client | `{ conversationId, message }` |
| **System** | `conversation:updated` | Server -> Client | `Conversation` object |
| | `conversation:escalated` | Server -> Client | `{ conversationId, ticketId, priority }` |
| | `ticket:created` | Server -> Client | `Ticket` object |
| | `ticket:updated` | Server -> Client | `Ticket` object |
| | `ai:status` | Server -> Client | `{ status: "thinking" \| "responded", conversationId }` |
| | `ai:suggestion` | Server -> Client | `{ text, sources, confidence }` |
