# DeskPilot — The Autonomous AI Support Desk

DeskPilot is a next-generation AI-powered customer support platform tailored for modern SaaS and D2C businesses. It automates repetitive customer inquiries, resolves tickets using indexed knowledge base documents, triages issues into priority tiers (P1/P2/P3), and enables seamless human handover.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:5173/`.

### 3. Production Build
```bash
npm run build
npm run preview
```

---

## 🎨 Visual Identity & Design System

DeskPilot is crafted as a premium dark-mode SaaS product:
- **Background**: `#0B0B0F`
- **Secondary Surface**: `#14141B`
- **Card Background**: `#191920`
- **Primary Accent**: `#FFB33F` (Vibrant warm Amber)
- **Secondary Accent**: `#F5A623`
- **Primary Text**: `#F5F5F5`
- **Muted Text**: `#A1A1AA`
- **Borders**: `#292932`
- **Priority P1 (Urgent)**: Red (`#EF4444`)
- **Priority P2 (Medium)**: Amber (`#FFB33F`)
- **Priority P3 (Normal)**: Emerald (`#10B981`)
- **Typography**: Google Font `Plus Jakarta Sans` & `JetBrains Mono`

---

## 📱 Application Pages & Routes

| Route | Page | Purpose |
|---|---|---|
| `/` | **Landing Page** | Product hero, features, 3-step setup, interactive live chat preview |
| `/login` | **Authentication (Login)** | Work email & password with quick-fill demo button |
| `/signup` | **Authentication (Signup)** | Registration with full validation & onboarding redirect |
| `/onboarding` | **Business Onboarding** | 4-step wizard: Business info, Knowledge base upload, AI params, Support hours |
| `/dashboard` | **Main Agent Dashboard** | 4 top metrics, searchable conversation list, live workspace with AI Copilot, takeover banner, and ticket inspector |
| `/inbox` | **Agent Inbox** | Quick alias for conversation triage workspace |
| `/tickets` | **Ticket Management** | Dedicated ticket table with status, priority, category filters, sorting, and detail modal |
| `/knowledge-base` | **Knowledge Base** | Document repository for PDF/TXT uploads, embedding status, and RAG categories |
| `/analytics` | **Analytics & Reports** | 5 key KPI cards + 4 interactive Recharts graphs (Timeline, AI vs Human, Categories, Priorities) |
| `/settings` | **Platform Settings** | General, AI Agent parameters, Human handover triggers, Appearance color picker, and Account profile |

---

## 💬 Floating Customer Chat Widget

DeskPilot includes an interactive customer-facing widget that floats at the bottom-right on all views (and can be launched via **"Launch Customer Chat Demo"** in the sidebar):
- Realistic conversation flow with AI autopilot.
- Demo quick prompts (e.g., *"My payment was deducted but my order was not confirmed (P1)"*).
- Auto-generates tickets and links them in real-time to the Agent Dashboard.
- Allows the customer to explicitly click *"Request Human Agent"*.

---

## 🔄 The Master Demo Flow (Judges Walkthrough)

1. **Customer opens chat**: Click the floating chat bubble on the landing page or dashboard.
2. **Customer sends complaint**: Click *"Payment deducted (P1)"* prompt: *"My payment was deducted but my order was not confirmed."*
3. **AI responds**: DeskPilot AI asks for the Order ID (`ORD-1024`).
4. **Ticket created**: An urgent P1 ticket (`TCK-8821` / `TCK-8825`) is generated automatically.
5. **Agent sees ticket in Dashboard**: On `/dashboard`, the conversation appears marked with an amber/red priority pill.
6. **Agent reviews AI Copilot**: Sees the AI suggested reply with 96% confidence score citing `Payment Policy (doc-3)`.
7. **Human takes over**: Agent clicks *"Take Over Conversation"*. The green takeover banner activates, disabling automatic AI responses.
8. **Agent resolves issue**: Agent sends custom message and clicks *"Mark as Resolved"*.

---

## 🔌 Backend Integration Contract

All frontend network requests are isolated in the `src/services/` layer:
- `services/api.ts`: Central Axios client configured with `VITE_API_BASE_URL` (default: `http://localhost:5000`).
- `services/conversationService.ts`
- `services/ticketService.ts`
- `services/knowledgeBaseService.ts`
- `services/analyticsService.ts`
- `services/settingsService.ts`

### Mock Mode vs. Live Backend API Switch
A live indicator is embedded in the DeskPilot sidebar:
- **Demo / Mock Mode (Default)**: Employs realistic offline mock state with full reactivity.
- **Live Backend API**: Toggled with a single click or by setting `VITE_API_BASE_URL`.

### Proposed Backend Endpoints:
```
GET    /api/conversations           # List all conversations
GET    /api/conversations/:id       # Get conversation thread by ID
POST   /api/conversations/:id/messages # Send message (agent/ai/customer)
POST   /api/conversations/:id/takeover # Take over conversation
POST   /api/conversations/:id/handback # Hand conversation back to AI autopilot
POST   /api/chat                    # Customer chat query (Gemini API integration)
GET    /api/tickets                 # List tickets
GET    /api/tickets/:id             # Ticket details
PATCH  /api/tickets/:id             # Update ticket status / priority / agent
POST   /api/tickets                 # Create new ticket
GET    /api/knowledge-base          # List uploaded docs
POST   /api/knowledge-base/upload   # Upload and chunk PDF/TXT files
DELETE /api/knowledge-base/:id      # Delete document
GET    /api/analytics               # Retrieve KPI metrics and timeline data
GET    /api/settings                # Fetch settings
PATCH  /api/settings                # Save settings
```
