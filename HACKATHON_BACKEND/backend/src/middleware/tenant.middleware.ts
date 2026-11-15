import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { store, DEMO_COMPANY_ID } from '../services/store.js';
import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

export const requireTenant = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required before tenant authorization');
    }

    const requestedCompanyId =
      (req.headers['x-company-id'] as string) ||
      (req.query.company_id as string) ||
      req.user.company_id;

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();

      if (requestedCompanyId) {
        const { data: member, error } = await supabase
          .from('company_members')
          .select('company_id, role')
          .eq('company_id', requestedCompanyId)
          .eq('user_id', req.user.id)
          .single();

        if (error || !member) {
          throw new ForbiddenError('Cross-tenant violation: User does not belong to the requested company');
        }

        req.companyId = member.company_id;
        return next();
      }

      // Default to user's first company membership
      const { data: members, error } = await supabase
        .from('company_members')
        .select('company_id, role')
        .eq('user_id', req.user.id)
        .limit(1);

      if (error || !members || members.length === 0) {
        throw new ForbiddenError('User is not assigned to any active company workspace');
      }

      req.companyId = members[0].company_id;
      return next();
    }

    // Fallback store verification
    if (requestedCompanyId) {
      const isMember = store.isUserMemberOf(requestedCompanyId, req.user.id);
      if (!isMember && requestedCompanyId !== DEMO_COMPANY_ID) {
        throw new ForbiddenError('Cross-tenant violation: User does not belong to the requested company');
      }
      req.companyId = requestedCompanyId;
      return next();
    }

    const member = store.getMemberByUserId(req.user.id);
    if (member) {
      req.companyId = member.company_id;
      return next();
    }

    // Default to demo company if in demo mode
    req.companyId = DEMO_COMPANY_ID;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.role === 'customer') {
    return next(new ForbiddenError('Access denied: Customer accounts cannot access administrative resources'));
  }
  next();
};
