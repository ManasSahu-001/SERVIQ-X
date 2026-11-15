import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service.js';
import { sendSuccess } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';

export const documentController = {
  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('No document file was uploaded');
      }

      const companyId = req.companyId!;
      const category = (req.body.category as string) || 'General';

      const doc = await documentService.processAndUploadDocument({
        companyId,
        filename: req.file.originalname,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        sizeBytes: req.file.size,
        category,
      });

      return sendSuccess(res, doc, 'Document indexed successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const docs = await documentService.getDocuments(companyId);
      return sendSuccess(res, docs);
    } catch (err) {
      next(err);
    }
  },

  async getDocumentById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const doc = await documentService.getDocumentById(companyId, String(req.params.id));
      return sendSuccess(res, doc);
    } catch (err) {
      next(err);
    }
  },

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      await documentService.deleteDocument(companyId, String(req.params.id));
      return sendSuccess(res, { deleted: true }, 'Document removed successfully');
    } catch (err) {
      next(err);
    }
  },
};
