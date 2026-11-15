import { parsePdfBuffer } from '../rag/pdfParser.js';
import { chunkDocument } from '../rag/chunker.js';
import { defaultEmbeddingProvider } from '../rag/embeddings.js';
import { store } from './store.js';
import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { Document } from '../types/index.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export const documentService = {
  async processAndUploadDocument(params: {
    companyId: string;
    filename: string;
    buffer: Buffer;
    mimetype: string;
    sizeBytes: number;
    category?: string;
  }): Promise<Document> {
    const { companyId, filename, buffer, sizeBytes, category = 'General' } = params;

    logger.info({ companyId, filename, sizeBytes }, 'Starting document processing pipeline');

    // 1. Initial Document record in processing state
    const storagePath = `documents/${companyId}/${Date.now()}_${filename.replace(/\s+/g, '_')}`;

    let doc = store.createDocument({
      company_id: companyId,
      filename,
      storage_path: storagePath,
      status: 'processing',
      category,
      size_bytes: sizeBytes,
    });

    try {
      // 2. Text Extraction
      const parsedDoc = await parsePdfBuffer(buffer);
      if (!parsedDoc.fullText || parsedDoc.fullText.trim().length === 0) {
        throw new ValidationError('Could not extract any readable text from the uploaded document');
      }

      // 3. Chunking
      const chunks = chunkDocument(parsedDoc.pages, {
        chunkSize: 700,
        chunkOverlap: 100,
      });

      logger.info({ filename, chunkCount: chunks.length }, 'Document chunked successfully');

      // 4. Embedding Generation
      const chunkTexts = chunks.map((c) => c.content);
      const embeddings = await defaultEmbeddingProvider.generateBatchEmbeddings(chunkTexts);

      // 5. Store Chunks in pgvector / memory store
      const chunksToSave = chunks.map((c, i) => ({
        company_id: companyId,
        document_id: doc.id,
        content: c.content,
        page_number: c.pageNumber,
        chunk_index: c.chunkIndex,
        embedding: embeddings[i],
      }));

      store.saveChunks(chunksToSave);

      // 6. Update Document status to indexed
      doc.status = 'indexed';
      doc.tokens_count = Math.floor(parsedDoc.fullText.length / 4);

      // If Supabase is configured, upload to Supabase Storage & Database
      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseAdmin();
          await supabase.storage.from('kb-documents').upload(storagePath, buffer, {
            contentType: params.mimetype,
            upsert: true,
          });

          await supabase.from('documents').insert({
            id: doc.id,
            company_id: companyId,
            filename,
            storage_path: storagePath,
            status: 'indexed',
            category,
            size_bytes: sizeBytes,
            tokens_count: doc.tokens_count,
          });

          const supabaseChunks = chunksToSave.map((c) => ({
            company_id: c.company_id,
            document_id: c.document_id,
            content: c.content,
            page_number: c.page_number,
            chunk_index: c.chunk_index,
            embedding: c.embedding,
          }));

          await supabase.from('document_chunks').insert(supabaseChunks);
        } catch (supabaseErr: any) {
          logger.warn({ error: supabaseErr.message }, 'Failed to sync uploaded document with Supabase; saved in memory store');
        }
      }

      logger.info({ documentId: doc.id, filename }, 'Document indexed and ready for RAG');
      return doc;
    } catch (err: any) {
      doc.status = 'failed';
      doc.error_message = err.message;
      logger.error({ error: err.message, documentId: doc.id }, 'Document processing pipeline failed');
      throw err;
    }
  },

  async getDocuments(companyId: string): Promise<Document[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });

        if (!error && data) return data;
      } catch (err: any) {
        logger.warn({ error: err.message }, 'Supabase getDocuments failed; using store');
      }
    }
    return store.getDocumentsByCompany(companyId);
  },

  async getDocumentById(companyId: string, docId: string): Promise<Document> {
    const doc = store.getDocumentById(companyId, docId);
    if (!doc) {
      throw new NotFoundError('Document not found in this company workspace');
    }
    return doc;
  },

  async deleteDocument(companyId: string, docId: string): Promise<boolean> {
    logger.info({ companyId, docId }, 'Deleting document and associated chunks');

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('documents').delete().eq('id', docId).eq('company_id', companyId);
      } catch (err: any) {
        logger.warn({ error: err.message }, 'Supabase delete document failed');
      }
    }

    const deleted = store.deleteDocument(companyId, docId);
    if (!deleted) {
      throw new NotFoundError('Document not found or already deleted');
    }
    return true;
  },
};
