import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

// Observability and config
import './config/langsmith.js';
import { isTracingEnabled, project } from './config/langsmith.js';

// Middleware & Services
import { requireAuth } from './middleware/auth.js';
import { runSupportAgent } from './agent/supportAgent.js';
import { ingestPDF } from './services/ragService.js';
import { invokeGroqWithTracing } from './services/groqService.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Body Parsers & Upload configuration
app.use(express.json({ limit: '10mb' }));
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed.'));
    }
  },
});

// -----------------------------------------------------------------------------
// 1. Healthcheck & Observability Status
// -----------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SERVIQ-X AI Engine',
    observability: {
      langsmith_tracing: isTracingEnabled,
      project: project,
    },
    timestamp: new Date().toISOString(),
  });
});

// -----------------------------------------------------------------------------
// 2. Chat & AI Support Interaction
// -----------------------------------------------------------------------------
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { message, conversation_id, customer_id } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Field "message" is required' });
    }

    const result = await runSupportAgent({
      companyId: req.companyId,
      conversationId: conversation_id,
      customerId: customer_id,
      customerMessage: message,
      supabaseClient: req.supabase,
    });

    res.json(result);
  } catch (err) {
    console.error('[API /api/chat error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. Knowledge Base & PDF Document Management
// -----------------------------------------------------------------------------
app.post('/api/documents/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const result = await ingestPDF({
      companyId: req.companyId,
      userId: req.user.id,
      filename: req.file.originalname,
      fileBuffer: req.file.buffer,
      supabaseClient: req.supabase,
    });

    res.status(201).json({
      message: 'Document successfully ingested and vectorized',
      document: result,
    });
  } catch (err) {
    console.error('[API /api/documents/upload error]:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents', requireAuth, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('documents')
      .select('id, title, file_size, mime_type, metadata, created_at')
      .eq('company_id', req.companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ documents: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await req.supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('company_id', req.companyId);

    if (error) throw error;
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 4. Human-in-the-Loop & Conversation Management
// -----------------------------------------------------------------------------
app.post('/api/conversations/:id/takeover', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await req.supabase
      .from('conversations')
      .update({
        status: 'in_progress',
        metadata: { human_takeover: true, takeover_by: req.user.id, takeover_at: new Date().toISOString() },
      })
      .eq('id', id)
      .eq('company_id', req.companyId);

    if (error) throw error;
    res.json({ message: 'Human agent takeover initiated. AI automatic responses paused.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations/:id/handback', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await req.supabase
      .from('conversations')
      .update({
        status: 'active',
        metadata: { human_takeover: false, handback_at: new Date().toISOString() },
      })
      .eq('id', id)
      .eq('company_id', req.companyId);

    if (error) throw error;
    res.json({ message: 'Conversation control returned to SERVIQ-X AI.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const { data, error } = await req.supabase
      .from('messages')
      .insert({
        conversation_id: id,
        company_id: req.companyId,
        sender_type: 'agent',
        sender_id: req.user.id,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/conversations', requireAuth, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('conversations')
      .select('*')
      .eq('company_id', req.companyId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json({ conversations: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/conversations/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: conversation, error: convError } = await req.supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('company_id', req.companyId)
      .single();

    if (convError) throw convError;

    const { data: messages, error: msgError } = await req.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    res.json({ conversation, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 5. Tickets API
// -----------------------------------------------------------------------------
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

app.patch('/api/tickets/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assigned_to } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;

    const { data, error } = await req.supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', req.companyId)
      .select()
      .single();

    if (error) throw error;
    res.json({ ticket: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[SERVIQ-X] AI Support Engine server running on port ${PORT}`);
  });
}

export default app;
