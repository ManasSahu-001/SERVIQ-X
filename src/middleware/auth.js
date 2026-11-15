import { createScopedClient, getAdminClient } from '../supabaseClient.js';

/**
 * Express middleware to verify Supabase JWT token and enforce company tenancy
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const client = createScopedClient(token);

    // Validate the token and fetch user
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    // Attach user and scoped client to request
    req.user = user;
    req.supabase = client;

    // Multi-tenant check: if companyId is supplied in body or params, verify membership
    const targetCompanyId = req.params.companyId || req.body.company_id || req.headers['x-company-id'];
    if (targetCompanyId) {
      const { data: membership, error: memErr } = await client
        .from('company_members')
        .select('role')
        .eq('company_id', targetCompanyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (memErr || !membership) {
        return res.status(403).json({
          error: 'Access denied: Caller is not a verified member of the specified company',
        });
      }

      req.companyId = targetCompanyId;
      req.userRole = membership.role;
    }

    next();
  } catch (err) {
    console.error('Auth verification error:', err);
    return res.status(500).json({ error: 'Internal authentication error' });
  }
};
