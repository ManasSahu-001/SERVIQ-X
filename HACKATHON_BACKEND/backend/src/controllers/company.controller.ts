import { Request, Response, NextFunction } from 'express';
import { companyService } from '../services/company.service.js';
import { sendSuccess } from '../utils/response.js';

export const companyController = {
  async createCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const userId = req.user!.id;
      const result = await companyService.createCompany(name, userId);
      return sendSuccess(res, result, 'Company workspace created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async getMyCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await companyService.getUserCompany(userId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
