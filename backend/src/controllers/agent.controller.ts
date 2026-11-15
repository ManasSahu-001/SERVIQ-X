import { Request, Response, NextFunction } from 'express';
import { agentService } from '../services/agent.service.js';
import { sendSuccess } from '../utils/response.js';

export const agentController = {
  async respond(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const { conversationId, message } = req.body;

      const result = await agentService.respond(companyId, conversationId, message);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async suggestReply(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const { conversationId } = req.body;

      const result = await agentService.suggestReply(companyId, conversationId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async summarize(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const { conversationId } = req.body;

      const result = await agentService.summarizeConversation(companyId, conversationId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
