import { ExtractedPage } from './pdfParser.js';

export interface ChunkResult {
  content: string;
  pageNumber: number;
  chunkIndex: number;
}

export interface ChunkerOptions {
  chunkSize?: number; // character length target (default ~800 chars ~ 200 tokens)
  chunkOverlap?: number; // character overlap (default 120 chars)
}

export const chunkDocument = (
  pages: ExtractedPage[],
  options: ChunkerOptions = {}
): ChunkResult[] => {
  const chunkSize = options.chunkSize ?? 800;
  const chunkOverlap = options.chunkOverlap ?? 120;
  const chunks: ChunkResult[] = [];
  let globalIndex = 0;

  for (const page of pages) {
    const text = page.text.trim();
    if (!text) continue;

    if (text.length <= chunkSize) {
      chunks.push({
        content: text,
        pageNumber: page.pageNumber,
        chunkIndex: globalIndex++,
      });
      continue;
    }

    // Split text into paragraphs
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + '\n\n' + para).length <= chunkSize) {
        currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
      } else {
        // If current paragraph itself exceeds chunkSize, split by sentences
        if (para.length > chunkSize) {
          const sentences = para.split(/(?<=[.!?])\s+/);
          for (const sentence of sentences) {
            if ((currentChunk + ' ' + sentence).length <= chunkSize) {
              currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
            } else {
              if (currentChunk.trim().length > 0) {
                chunks.push({
                  content: currentChunk.trim(),
                  pageNumber: page.pageNumber,
                  chunkIndex: globalIndex++,
                });
                // Overlap: take the tail of the current chunk
                const overlapText = currentChunk.slice(-chunkOverlap);
                currentChunk = overlapText + ' ' + sentence;
              } else {
                currentChunk = sentence;
              }
            }
          }
        } else {
          if (currentChunk.trim().length > 0) {
            chunks.push({
              content: currentChunk.trim(),
              pageNumber: page.pageNumber,
              chunkIndex: globalIndex++,
            });
            const overlapText = currentChunk.slice(-chunkOverlap);
            currentChunk = overlapText + '\n\n' + para;
          } else {
            currentChunk = para;
          }
        }
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        pageNumber: page.pageNumber,
        chunkIndex: globalIndex++,
      });
    }
  }

  return chunks;
};
