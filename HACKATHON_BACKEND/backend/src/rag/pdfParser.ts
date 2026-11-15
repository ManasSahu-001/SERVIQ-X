import { logger } from '../config/logger.js';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  fullText: string;
  pages: ExtractedPage[];
  pageCount: number;
}

export const cleanText = (text: string): string => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Replace non-printable ASCII control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize excessive multiple consecutive spaces/tabs
    .replace(/[ \t]+/g, ' ')
    // Normalize more than two consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const parsePdfBuffer = async (buffer: Buffer): Promise<ParsedDocument> => {
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;

    const parsed = await pdfParse(buffer);
    const cleanedFull = cleanText(parsed.text || '');

    // Estimate page division if per-page text is combined by pdf-parse
    const pageCount = parsed.numpages || 1;
    const pages: ExtractedPage[] = [];

    // Split text into pages if form feed character \f exists
    const rawPages = parsed.text.split('\f');
    if (rawPages.length > 1) {
      rawPages.forEach((p: string, idx: number) => {
        const pageText = cleanText(p);
        if (pageText.length > 0) {
          pages.push({ pageNumber: idx + 1, text: pageText });
        }
      });
    } else {
      // Chunk evenly across reported pageCount
      const chunkSize = Math.max(1, Math.ceil(cleanedFull.length / pageCount));
      for (let i = 0; i < pageCount; i++) {
        const slice = cleanedFull.slice(i * chunkSize, (i + 1) * chunkSize);
        if (slice.trim().length > 0) {
          pages.push({ pageNumber: i + 1, text: slice });
        }
      }
    }

    if (pages.length === 0 && cleanedFull.length > 0) {
      pages.push({ pageNumber: 1, text: cleanedFull });
    }

    return {
      fullText: cleanedFull,
      pages,
      pageCount: pages.length || 1,
    };
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to parse PDF with pdf-parse');
    // Fallback: check if the buffer is plaintext
    const rawString = buffer.toString('utf-8');
    const cleaned = cleanText(rawString);
    return {
      fullText: cleaned,
      pages: [{ pageNumber: 1, text: cleaned }],
      pageCount: 1,
    };
  }
};
