import { store, DEMO_COMPANY_ID } from './store.js';
import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { Company, CompanyMember } from '../types/index.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export const companyService = {
  async createCompany(name: string, userId: string): Promise<{ company: Company; member: CompanyMember }> {
    logger.info({ name, userId }, 'Creating new company workspace');

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();

      // Transactional company + admin member creation
      const { data: company, error: compErr } = await supabase
        .from('companies')
        .insert({ name })
        .select()
        .single();

      if (compErr || !company) {
        throw new ConflictError(`Could not create company: ${compErr?.message}`);
      }

      const { data: member, error: memErr } = await supabase
        .from('company_members')
        .insert({
          company_id: company.id,
          user_id: userId,
          role: 'admin',
        })
        .select()
        .single();

      if (memErr) {
        // Rollback company on member insertion failure
        await supabase.from('companies').delete().eq('id', company.id);
        throw new ConflictError(`Could not create admin membership: ${memErr.message}`);
      }

      return { company, member };
    }

    // In-memory store
    const company = store.createCompany(name);
    const member = store.addMember(company.id, userId, 'admin');
    return { company, member };
  },

  async getUserCompany(userId: string): Promise<{ company: Company; member: CompanyMember }> {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdmin();
      const { data: member, error: memErr } = await supabase
        .from('company_members')
        .select('*, companies(*)')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (memErr || !member || !member.companies) {
        throw new NotFoundError('No company workspace found for this user');
      }

      return {
        company: member.companies as unknown as Company,
        member: {
          id: member.id,
          company_id: member.company_id,
          user_id: member.user_id,
          role: member.role,
          created_at: member.created_at,
        },
      };
    }

    const member = store.getMemberByUserId(userId);
    if (!member) {
      // Fallback to demo company
      const demoComp = store.getCompany(DEMO_COMPANY_ID)!;
      const demoMem = store.addMember(DEMO_COMPANY_ID, userId, 'admin');
      return { company: demoComp, member: demoMem };
    }

    const comp = store.getCompany(member.company_id);
    if (!comp) {
      throw new NotFoundError('Assigned company workspace not found');
    }

    return { company: comp, member };
  },
};
