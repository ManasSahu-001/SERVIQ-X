import { Request, Response, NextFunction } from 'express';
import { conversationService } from '../services/conversation.service.js';
import { messageService } from '../services/message.service.js';
import { sendSuccess } from '../utils/response.js';
import { DEMO_COMPANY_ID } from '../services/store.js';

export const conversationController = {
  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const convs = await conversationService.getConversations(companyId);
      return sendSuccess(res, convs);
    } catch (err) {
      next(err);
    }
  },

  async getConversationById(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const conv = await conversationService.getConversationById(companyId, String(req.params.id));
      return sendSuccess(res, conv);
    } catch (err) {
      next(err);
    }
  },

  async createConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId || (req.headers['x-company-id'] as string) || DEMO_COMPANY_ID;
      const { customerName, customerEmail, subject, message } = req.body;

      const result = await conversationService.createConversation({
        companyId,
        customerName,
        customerEmail,
        subject,
        initialMessage: message,
      });

      return sendSuccess(res, result.conversation, 'Conversation started', 201);
    } catch (err) {
      next(err);
    }
  },

  async addMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const conversationId = String(req.params.id);
      const { text, content, sender, senderName } = req.body;

      const messageContent = text || content;
      const message = await messageService.addMessage({
        companyId,
        conversationId,
        sender: sender || 'agent',
        content: messageContent,
        senderName,
      });

      return sendSuccess(res, message, 'Message dispatched', 201);
    } catch (err) {
      next(err);
    }
  },

  async takeover(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const conversationId = String(req.params.id);
      const agentName = (req.body.agentName as string) || req.user?.email || 'Rahul Sharma';

      const conv = await conversationService.takeoverConversation(companyId, conversationId, agentName);
      return sendSuccess(res, conv, 'Human takeover activated; AI autopilot paused');
    } catch (err) {
      next(err);
    }
  },

  async handback(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.companyId!;
      const conversationId = String(req.params.id);

      const conv = await conversationService.handbackToAI(companyId, conversationId);
      return sendSuccess(res, conv, 'Conversation handed back to AI autopilot');
    } catch (err) {
      next(err);
    }
  },

  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, conversationId } = req.body;
      const companyId = (req.headers['x-company-id'] as string) || req.companyId || DEMO_COMPANY_ID;

      const result = await conversationService.handleCustomerChat({
        message,
        conversationId,
        companyId,
      });

      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
