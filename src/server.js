import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Initialize LangSmith Tracing configuration before loading agent and models
import './config/langsmith.js';
import { isTracingEnabled, project } from './config/langsmith.js';
import { requireAuth } from './middleware/auth.js';
import { runSupportAgent } from './agent/supportAgent.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '10mb' }));

// Health Check with LangSmith status
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SERVIQ-X Backend',
    observability: {
      langsmith_tracing: isTracingEnabled,
      project: project,
    },
    timestamp: new Date().toISOString(),
  });
});

// Protected: AI Support Chat Endpoint (invokes LangGraph agent)
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { message, conversation_id } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Field "message" is required' });
    }

    const result = await runSupportAgent({
      companyId: req.companyId,
      conversationId: conversation_id,
      customerMessage: message,
      supabaseClient: req.supabase,
    });

    res.json(result);
  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Protected: Semantic Vector Search Endpoint
app.post('/api/documents/search', requireAuth, async (req, res) => {
  try {
    const { query_embedding, match_threshold = 0.5, match_count = 5 } = req.body;
    if (!query_embedding || !Array.isArray(query_embedding)) {
      return res.status(400).json({ error: 'Array "query_embedding" (768 dimensions) is required' });
    }

    const { data, error } = await req.supabase.rpc('match_document_chunks', {
      query_embedding,
      filter_company_id: req.companyId,
      match_threshold,
      match_count,
    });

    if (error) throw error;
    res.json({ results: data });
  } catch (err) {
    console.error('Search endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Protected: Multi-tenant Tickets API
app.get('/api/tickets', requireAuth, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('tickets')
      .select('*')
      .eq('company_id', req.companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ tickets: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tickets', requireAuth, async (req, res) => {
  try {
    const { title, description, priority, conversation_id } = req.body;
    const { data, error } = await req.supabase
      .from('tickets')
      .insert({
        company_id: req.companyId,
        conversation_id,
        title,
        description,
        priority: priority || 'medium',
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ticket: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[DeskPilot] Express server running on port ${PORT}`);
  });
}

export default app;
