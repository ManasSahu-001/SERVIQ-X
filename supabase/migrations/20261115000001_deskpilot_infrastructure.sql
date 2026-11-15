-- ==============================================================================
-- DeskPilot — Production Supabase Infrastructure Migration
-- Description: Core tables, multi-tenant RLS, pgvector (768d), storage & vector RPC
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. PRIVATE SCHEMA FOR INTERNAL SECURITY FUNCTIONS
CREATE SCHEMA IF NOT EXISTS private;
REVOKE USAGE ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- 3. TABLES

-- (1) Companies
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- (2) Company Members
CREATE TABLE IF NOT EXISTS public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'agent', 'member')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT company_members_company_user_unique UNIQUE (company_id, user_id)
);

-- (3) Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_path text,
  file_size bigint,
  mime_type text DEFAULT 'application/pdf' CHECK (mime_type = 'application/pdf'),
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- (4) Document Chunks (768-dimensional Gemini embeddings)
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  content text NOT NULL,
  page_number integer,
  embedding vector(768),
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- (5) Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id text,
  customer_name text,
  customer_email text,
  title text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived', 'escalated')),
  channel text DEFAULT 'chat',
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- (6) Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'agent', 'ai', 'system')),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- (7) Tickets
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 4. INDEXES FOR HIGH-PERFORMANCE MULTI-TENANCY & CASCADE
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON public.companies(created_by);

CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);

CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON public.documents(created_by);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_company_id ON public.document_chunks(company_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON public.document_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON public.conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_company_status ON public.conversations(company_id, status);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_company_id ON public.messages(company_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_tickets_company_id ON public.tickets(company_id);
CREATE INDEX IF NOT EXISTS idx_tickets_conversation_id ON public.tickets(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_company_status ON public.tickets(company_id, status);

-- 5. TRIGGER FUNCTIONS & AUTOMATION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_companies_updated_at') THEN
    CREATE TRIGGER set_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_company_members_updated_at') THEN
    CREATE TRIGGER set_company_members_updated_at BEFORE UPDATE ON public.company_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_documents_updated_at') THEN
    CREATE TRIGGER set_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_conversations_updated_at') THEN
    CREATE TRIGGER set_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_tickets_updated_at') THEN
    CREATE TRIGGER set_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- Automatic company creator -> 'owner' membership trigger
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := (SELECT auth.uid());
  IF current_user_id IS NOT NULL THEN
    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (NEW.id, current_user_id, 'owner')
    ON CONFLICT (company_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_company() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_company() TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_company_created') THEN
    CREATE TRIGGER on_company_created
      AFTER INSERT ON public.companies
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_company();
  END IF;
END $$;

-- 6. PRIVATE SECURITY HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION private.is_company_member(cid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.company_members 
    WHERE company_id = cid 
      AND user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION private.has_company_role(cid uuid, allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.company_members 
    WHERE company_id = cid 
      AND user_id = (SELECT auth.uid())
      AND role = ANY(allowed_roles)
  );
$$;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated, service_role;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies FORCE ROW LEVEL SECURITY;

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members FORCE ROW LEVEL SECURITY;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks FORCE ROW LEVEL SECURITY;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.companies, public.company_members, public.documents, public.document_chunks, public.conversations, public.messages, public.tickets FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies, public.company_members, public.documents, public.document_chunks, public.conversations, public.messages, public.tickets TO authenticated, service_role;

-- (1) companies
CREATE POLICY "companies_select_member" ON public.companies FOR SELECT TO authenticated USING (created_by = (SELECT auth.uid()) OR private.is_company_member(id));
CREATE POLICY "companies_insert_auth" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "companies_update_admin" ON public.companies FOR UPDATE TO authenticated USING (private.has_company_role(id, ARRAY['owner', 'admin'])) WITH CHECK (private.has_company_role(id, ARRAY['owner', 'admin']));
CREATE POLICY "companies_delete_owner" ON public.companies FOR DELETE TO authenticated USING (private.has_company_role(id, ARRAY['owner']));

-- (2) company_members
CREATE POLICY "company_members_select_member" ON public.company_members FOR SELECT TO authenticated USING (private.is_company_member(company_id));
CREATE POLICY "company_members_insert_admin" ON public.company_members FOR INSERT TO authenticated WITH CHECK (private.has_company_role(company_id, ARRAY['owner', 'admin']));
CREATE POLICY "company_members_update_admin" ON public.company_members FOR UPDATE TO authenticated USING (private.has_company_role(company_id, ARRAY['owner', 'admin'])) WITH CHECK (private.has_company_role(company_id, ARRAY['owner', 'admin']));
CREATE POLICY "company_members_delete_admin_or_self" ON public.company_members FOR DELETE TO authenticated USING (private.has_company_role(company_id, ARRAY['owner', 'admin']) OR user_id = (SELECT auth.uid()));

-- (3) documents
CREATE POLICY "documents_select_member" ON public.documents FOR SELECT TO authenticated USING (private.is_company_member(company_id));
CREATE POLICY "documents_insert_member" ON public.documents FOR INSERT TO authenticated WITH CHECK (private.is_company_member(company_id));
CREATE POLICY "documents_update_member" ON public.documents FOR UPDATE TO authenticated USING (private.is_company_member(company_id)) WITH CHECK (private.is_company_member(company_id));
CREATE POLICY "documents_delete_member" ON public.documents FOR DELETE TO authenticated USING (private.is_company_member(company_id));

-- (4) document_chunks
CREATE POLICY "document_chunks_select_member" ON public.document_chunks FOR SELECT TO authenticated USING (private.is_company_member(company_id));
CREATE POLICY "document_chunks_insert_member" ON public.document_chunks FOR INSERT TO authenticated WITH CHECK (private.is_company_member(company_id));
CREATE POLICY "document_chunks_update_member" ON public.document_chunks FOR UPDATE TO authenticated USING (private.is_company_member(company_id)) WITH CHECK (private.is_company_member(company_id));
CREATE POLICY "document_chunks_delete_member" ON public.document_chunks FOR DELETE TO authenticated USING (private.is_company_member(company_id));

-- (5) conversations
CREATE POLICY "conversations_select_member" ON public.conversations FOR SELECT TO authenticated USING (private.is_company_member(company_id));
CREATE POLICY "conversations_insert_member" ON public.conversations FOR INSERT TO authenticated WITH CHECK (private.is_company_member(company_id));
CREATE POLICY "conversations_update_member" ON public.conversations FOR UPDATE TO authenticated USING (private.is_company_member(company_id)) WITH CHECK (private.is_company_member(company_id));
CREATE POLICY "conversations_delete_member" ON public.conversations FOR DELETE TO authenticated USING (private.is_company_member(company_id));

-- (6) messages
CREATE POLICY "messages_select_member" ON public.messages FOR SELECT TO authenticated USING (private.is_company_member(company_id));
CREATE POLICY "messages_insert_member" ON public.messages FOR INSERT TO authenticated WITH CHECK (private.is_company_member(company_id));
CREATE POLICY "messages_update_member" ON public.messages FOR UPDATE TO authenticated USING (private.is_company_member(company_id)) WITH CHECK (private.is_company_member(company_id));
CREATE POLICY "messages_delete_member" ON public.messages FOR DELETE TO authenticated USING (private.is_company_member(company_id));

-- (7) tickets
CREATE POLICY "tickets_select_member" ON public.tickets FOR SELECT TO authenticated USING (private.is_company_member(company_id));
CREATE POLICY "tickets_insert_member" ON public.tickets FOR INSERT TO authenticated WITH CHECK (private.is_company_member(company_id));
CREATE POLICY "tickets_update_member" ON public.tickets FOR UPDATE TO authenticated USING (private.is_company_member(company_id)) WITH CHECK (private.is_company_member(company_id));
CREATE POLICY "tickets_delete_member" ON public.tickets FOR DELETE TO authenticated USING (private.is_company_member(company_id));

-- 8. STORAGE BUCKET & POLICIES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-documents',
  'company-documents',
  false,
  10485760, -- 10 MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

CREATE POLICY "company_documents_select_policy"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'company-documents'
  AND pg_input_is_valid((storage.foldername(name))[1], 'uuid')
  AND private.is_company_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "company_documents_insert_policy"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-documents'
  AND pg_input_is_valid((storage.foldername(name))[1], 'uuid')
  AND private.is_company_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "company_documents_update_policy"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-documents'
  AND pg_input_is_valid((storage.foldername(name))[1], 'uuid')
  AND private.is_company_member(((storage.foldername(name))[1])::uuid)
)
WITH CHECK (
  bucket_id = 'company-documents'
  AND pg_input_is_valid((storage.foldername(name))[1], 'uuid')
  AND private.is_company_member(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "company_documents_delete_policy"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-documents'
  AND pg_input_is_valid((storage.foldername(name))[1], 'uuid')
  AND private.is_company_member(((storage.foldername(name))[1])::uuid)
);

-- 9. VECTOR SIMILARITY SEARCH RPC
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding vector(768),
  filter_company_id uuid,
  match_threshold float DEFAULT 0.0,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  page_number int,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, extensions, pg_catalog
AS $$
BEGIN
  -- Multi-tenant authorization verification
  IF (SELECT auth.role()) = 'authenticated' THEN
    IF NOT private.is_company_member(filter_company_id) THEN
      RAISE EXCEPTION 'Access denied: Caller is not a verified member of company %', filter_company_id;
    END IF;
  ELSIF (SELECT auth.role()) IS NULL OR (SELECT auth.role()) = 'anon' THEN
    RAISE EXCEPTION 'Access denied: Anonymous users are not permitted to perform vector searches.';
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.page_number,
    dc.content,
    dc.metadata,
    (1 - (dc.embedding <=> query_embedding))::float AS similarity
  FROM public.document_chunks dc
  WHERE dc.company_id = filter_company_id
    AND (1 - (dc.embedding <=> query_embedding)) > match_threshold
  ORDER BY dc.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.match_document_chunks(vector(768), uuid, float, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_document_chunks(vector(768), uuid, float, int) TO authenticated, service_role;
