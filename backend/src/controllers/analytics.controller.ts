import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { sendSuccess } from '../utils/response.js';

export const analyticsController = {
  overview(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const data = analyticsService.getOverview(companyId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  conversations(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const data = analyticsService.getConversationsAnalytics(companyId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  tickets(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const data = analyticsService.getTicketsAnalytics(companyId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};
