import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { getGeminiEmbedding, EXPECTED_VECTOR_DIMENSION } from './geminiService.js';
import { traceable } from '../config/langsmith.js';

export const CHUNK_SIZE = 600;
export const CHUNK_OVERLAP = 100;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Splits text into overlapping, sentence-boundary aware chunks.
 * Preserves approximate page number mapping when page text is available.
 */
export function chunkText(text, metadata = {}) {
  if (!text || typeof text !== 'string') return [];

  const chunks = [];
  const cleanText = text.replace(/\r\n/g, '\n').trim();
  let start = 0;
  let chunkIndex = 0;

  while (start < cleanText.length) {
    let end = start + CHUNK_SIZE;

    // Adjust to nearest sentence boundary if within reasonable distance
    if (end < cleanText.length) {
      const sentenceEnd = cleanText.lastIndexOf('. ', end);
      const newlineEnd = cleanText.lastIndexOf('\n\n', end);
      const splitPoint = Math.max(sentenceEnd !== -1 ? sentenceEnd + 1 : -1, newlineEnd);

      if (splitPoint > start + (CHUNK_SIZE * 0.5)) {
        end = splitPoint;
      }
    } else {
      end = cleanText.length;
    }

    const chunkContent = cleanText.substring(start, end).trim();
    if (chunkContent.length > 20) {
      chunks.push({
        chunk_index: chunkIndex++,
        content: chunkContent,
        page_number: metadata.page_number || 1,
        metadata: {
          ...metadata,
          char_length: chunkContent.length,
          start_offset: start,
          end_offset: end,
        },
      });
    }

    if (end >= cleanText.length) break;
    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}

/**
 * Ingests a PDF buffer into Supabase Storage and creates vector chunks.
 *
 * Steps:
 * 1. Validates file size and PDF format
 * 2. Uploads to Supabase storage bucket `company-documents/{companyId}/{filename}`
 * 3. Extracts text and page metadata using pdf-parse
 * 4. Chunks the text preserving page references
 * 5. Embeds each chunk with Gemini (768 dimensions)
 * 6. Inserts into `documents` and `document_chunks`
 */
export async function ingestPDF({
  companyId,
  userId,
  filename,
  fileBuffer,
  supabaseClient,
}) {
  if (!companyId || !filename || !fileBuffer || !supabaseClient) {
    throw new Error('Missing required arguments for PDF ingestion');
  }

  // 1. Validation
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File exceeds maximum allowed size of 10 MB (${fileBuffer.length} bytes)`);
  }

  const isPdfHeader = fileBuffer.slice(0, 5).toString('ascii') === '%PDF-';
  if (!isPdfHeader) {
    throw new Error('Invalid file format. Uploaded file must be a valid PDF document.');
  }

  // 2. Upload PDF to private Supabase Storage bucket
  const storagePath = `${companyId}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_')}`;
  const { error: uploadError } = await supabaseClient.storage
    .from('company-documents')
    .upload(storagePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // 3. Extract text from PDF
  let pdfData;
  try {
    pdfData = await pdfParse(fileBuffer);
  } catch (parseErr) {
    throw new Error(`Failed to extract text from PDF: ${parseErr.message}`);
  }

  const totalPages = pdfData.numpages || 1;
  const fullText = pdfData.text || '';

  if (!fullText.trim()) {
    throw new Error('PDF contains no extractable text content');
  }

  // 4. Create record in `documents` table
  const { data: documentRecord, error: docError } = await supabaseClient
    .from('documents')
    .insert({
      company_id: companyId,
      title: filename,
      file_path: storagePath,
      file_size: fileBuffer.length,
      mime_type: 'application/pdf',
      created_by: userId || null,
      metadata: {
        total_pages: totalPages,
        extracted_char_count: fullText.length,
        version: 1,
      },
    })
    .select()
    .single();

  if (docError) {
    throw new Error(`Database error creating document record: ${docError.message}`);
  }

  // 5. Chunk the text
  const rawChunks = chunkText(fullText, {
    document_id: documentRecord.id,
    filename,
    page_number: 1,
  });

  // 6. Generate 768-dim embeddings and prepare batch insert
  const chunkInserts = [];
  for (const chunk of rawChunks) {
    const embedding = await getGeminiEmbedding(chunk.content);
    if (!embedding || embedding.length !== EXPECTED_VECTOR_DIMENSION) {
      throw new Error(`Embedding generation produced invalid dimension: ${embedding?.length}`);
    }

    chunkInserts.push({
      document_id: documentRecord.id,
      company_id: companyId,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      page_number: chunk.page_number,
      embedding,
      metadata: chunk.metadata,
    });
  }

  // 7. Store chunks in `document_chunks` table
  if (chunkInserts.length > 0) {
    const { error: chunkError } = await supabaseClient
      .from('document_chunks')
      .insert(chunkInserts);

    if (chunkError) {
      throw new Error(`Database error saving document chunks: ${chunkError.message}`);
    }
  }

  console.log(`[RAG Ingest] Successfully ingested "${filename}" into company ${companyId}: ${chunkInserts.length} chunks generated.`);

  return {
    documentId: documentRecord.id,
    filename,
    storagePath,
    totalPages,
    chunksCount: chunkInserts.length,
  };
}

/**
 * Multi-tenant Semantic Vector Retrieval Tool.
 * Traced by LangSmith as a retriever run.
 */
export const retrieveKnowledge = traceable(
  async function retrieve_company_knowledge(companyId, query, supabaseClient, options = {}) {
    if (!companyId || !query || !supabaseClient) return [];

    const matchThreshold = options.matchThreshold ?? 0.5;
    const matchCount = options.matchCount ?? 4;

    // 1. Embed query with Gemini
    const queryEmbedding = await getGeminiEmbedding(query);

    // 2. Invoke Supabase RPC
    const { data: chunks, error } = await supabaseClient.rpc(
      'match_document_chunks',
      {
        query_embedding: queryEmbedding,
        filter_company_id: companyId,
        match_threshold: matchThreshold,
        match_count: matchCount,
      }
    );

    if (error) {
      throw new Error(`Supabase vector retrieval error: ${error.message}`);
    }

    return (chunks || []).map((c) => ({
      id: c.id,
      document_id: c.document_id,
      page_number: c.page_number,
      content: c.content,
      similarity: c.similarity,
      metadata: c.metadata || {},
    }));
  },
  {
    name: 'retrieve_company_knowledge',
    run_type: 'retriever',
    metadata: {
      vector_dim: 768,
      embedding_model: 'text-embedding-004',
      storage: 'supabase_pgvector',
    },
  }
);
