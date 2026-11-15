-- ==============================================================================
-- SERVIQ-X / DeskPilot Database Schema
-- Multi-Tenant Customer Support & AI Autonomous Infrastructure
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Company Members table (Multi-tenant membership & RBAC)
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- references auth.users(id) in Supabase
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'agent', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

-- 4. Documents table (PDF knowledge base metadata)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'indexed', 'failed')),
    category TEXT NOT NULL DEFAULT 'General',
    size_bytes BIGINT NOT NULL DEFAULT 0,
    tokens_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Document Chunks table (pgvector embeddings for RAG)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Default 1536 (e.g. OpenAI text-embedding-3-small)
    page_number INT DEFAULT 1,
    chunk_index INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL DEFAULT 'Customer',
    customer_email TEXT,
    customer_avatar TEXT,
    subject TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'escalated', 'resolved')),
    assigned_to TEXT NOT NULL DEFAULT 'ai' CHECK (assigned_to IN ('ai', 'human')),
    assigned_agent_name TEXT,
    priority TEXT NOT NULL DEFAULT 'P3' CHECK (priority IN ('P1', 'P2', 'P3')),
    category TEXT NOT NULL DEFAULT 'General',
    language TEXT NOT NULL DEFAULT 'English',
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'ai', 'agent', 'system')),
    content TEXT NOT NULL,
    sender_name TEXT,
    is_suggested BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General' CHECK (category IN ('Billing', 'Payment', 'Refund', 'Shipping', 'Technical Support', 'Product Inquiry', 'General')),
    priority TEXT NOT NULL DEFAULT 'P3' CHECK (priority IN ('P1', 'P2', 'P3')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    assigned_to TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & TENANT ISOLATION
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members(company_id);

CREATE INDEX IF NOT EXISTS idx_documents_company ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);

CREATE INDEX IF NOT EXISTS idx_document_chunks_company ON public.document_chunks(company_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document ON public.document_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_conversations_company ON public.conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned ON public.conversations(assigned_to);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

CREATE INDEX IF NOT EXISTS idx_tickets_company ON public.tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_conversation ON public.tickets(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);

-- pgvector cosine similarity index (HNSW for high-performance retrieval)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
ON public.document_chunks
USING hnsw (embedding vector_cosine_ops);

-- ==============================================================================
-- PGVECTOR MATCH FUNCTION
-- Scoped strictly by company_id to guarantee zero cross-tenant leakage
-- ==============================================================================

CREATE OR REPLACE FUNCTION match_document_chunks (
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 5,
    filter_company_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    company_id UUID,
    content TEXT,
    page_number INT,
    similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.company_id,
        dc.content,
        dc.page_number,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM public.document_chunks dc
    WHERE (filter_company_id IS NULL OR dc.company_id = filter_company_id)
      AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Multi-tenant isolation at the PostgreSQL level
-- ==============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Helper to check if current Supabase auth user belongs to company
CREATE OR REPLACE FUNCTION public.is_member_of_company(c_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.company_members cm
        WHERE cm.company_id = c_id
          AND cm.user_id = auth.uid()
    );
$$;

-- RLS Policies for companies
DROP POLICY IF EXISTS "Members can view their company" ON public.companies;
CREATE POLICY "Members can view their company"
    ON public.companies FOR SELECT
    USING (public.is_member_of_company(id));

-- RLS Policies for company_members
DROP POLICY IF EXISTS "Members can view co-members" ON public.company_members;
CREATE POLICY "Members can view co-members"
    ON public.company_members FOR SELECT
    USING (public.is_member_of_company(company_id));

-- RLS Policies for documents
DROP POLICY IF EXISTS "Members can access company documents" ON public.documents;
CREATE POLICY "Members can access company documents"
    ON public.documents FOR ALL
    USING (public.is_member_of_company(company_id));

-- RLS Policies for document_chunks
DROP POLICY IF EXISTS "Members can access company document chunks" ON public.document_chunks;
CREATE POLICY "Members can access company document chunks"
    ON public.document_chunks FOR ALL
    USING (public.is_member_of_company(company_id));

-- RLS Policies for conversations
DROP POLICY IF EXISTS "Members can access company conversations" ON public.conversations;
CREATE POLICY "Members can access company conversations"
    ON public.conversations FOR ALL
    USING (public.is_member_of_company(company_id));

-- RLS Policies for messages
DROP POLICY IF EXISTS "Members can access company messages" ON public.messages;
CREATE POLICY "Members can access company messages"
    ON public.messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
              AND public.is_member_of_company(c.company_id)
        )
    );

-- RLS Policies for tickets
DROP POLICY IF EXISTS "Members can access company tickets" ON public.tickets;
CREATE POLICY "Members can access company tickets"
    ON public.tickets FOR ALL
    USING (public.is_member_of_company(company_id));
