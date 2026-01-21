
import { supabase } from '../supabase';
import { AppData, EditRequest, User, Customer, Sale, Expense, Investment, MobileTransaction, DailyClosing, DailySummary, Hawlat, HawlatReturn, ChatMessage, CompanySettings, EditStatus } from '../types';

export const databaseService = {
  subscribeToData(onDataUpdate: (data: AppData) => void, initialData: AppData) {
    const currentState: AppData = { ...initialData };

    const fetchData = async () => {
      try {
        const { data: settings, error: settingsErr } = await supabase.from('company_settings').select('*').single();
        if (!settingsErr && settings) currentState.company = settings as CompanySettings;

        const tableConfigs = [
          { name: 'customers', key: 'customers' },
          { name: 'sales', key: 'sales' },
          { name: 'expenses', key: 'expenses' },
          { name: 'investments', key: 'investments' },
          { name: 'mobile_transactions', key: 'mobileTransactions' },
          { name: 'daily_closings', key: 'dailyClosings' },
          { name: 'daily_summaries', key: 'dailySummaries' },
          { name: 'hawlats', key: 'hawlats' },
          { name: 'hawlat_returns', key: 'hawlatReturns' },
          { name: 'hal_khata_sessions', key: 'halKhataSessions' },
          { name: 'edit_requests', key: 'editRequests' },
          { name: 'users', key: 'users' },
          { name: 'messages', key: 'messages' }
        ];

        const results = await Promise.all(
          tableConfigs.map(t => supabase.from(t.name).select('*'))
        );

        results.forEach((res, index) => {
          const config = tableConfigs[index];
          if (res.error) {
            console.warn(`Table ${config.name} fetch warning:`, res.error.message);
            (currentState as any)[config.key] = [];
          } else {
            (currentState as any)[config.key] = res.data || [];
          }
        });

        onDataUpdate({ ...currentState });
      } catch (err) {
        console.error("Critical error fetching initial data:", err);
      }
    };

    fetchData();

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async saveCompanySettings(settings: any) {
    const { data: existing } = await supabase.from('company_settings').select('id').single();
    if (existing) {
      const { error } = await supabase.from('company_settings').update(settings).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('company_settings').insert([settings]);
      if (error) throw error;
    }
  },

  async updateCustomer(item: Customer) {
    // Exact mapping for case-sensitive columns
    const payload = {
      name: item.name,
      mobile: item.mobile,
      "fatherName": item.fatherName,
      "houseName": item.houseName,
      village: item.village,
      area: item.area,
      source: item.source,
      email: item.email,
      photo: item.photo,
      "openingDue": item.openingDue,
      "openingDueDescription": item.openingDueDescription,
      note: item.note,
      "auditHistory": item.auditHistory
    };
    const { error } = await supabase.from('customers').update(payload).eq('id', item.id);
    if (error) throw error;
  },

  async addSale(item: Sale) {
    const payload = {
      id: item.id,
      date: item.date,
      "shopId": item.shopId,
      "customerId": item.customerId,
      description: item.description,
      "totalAmount": item.totalAmount,
      "paidAmount": item.paidAmount,
      "dueAmount": item.dueAmount,
      "paymentType": item.paymentType,
      items: item.items,
      "editHistory": item.editHistory || []
    };
    const { error } = await supabase.from('sales').insert([payload]);
    if (error) throw error;
  },

  async updateSale(item: Sale) {
    const payload = {
      date: item.date,
      "shopId": item.shopId,
      "customerId": item.customerId,
      description: item.description,
      "totalAmount": item.totalAmount,
      "paidAmount": item.paidAmount,
      "dueAmount": item.dueAmount,
      "paymentType": item.paymentType,
      items: item.items,
      "editHistory": item.editHistory
    };
    const { error } = await supabase.from('sales').update(payload).eq('id', item.id);
    if (error) throw error;
  },

  async deleteSale(id: string) {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
  },

  async approveEditRequest(request: EditRequest, reviewerName: string, targetEntity: any) {
    // 1. Update the request status
    const { error: reqErr } = await supabase
      .from('edit_requests')
      .update({
        status: EditStatus.APPROVED,
        "reviewedBy": reviewerName,
        "reviewTimestamp": new Date().toISOString()
      })
      .eq('id', request.id);

    if (reqErr) {
      console.error("Approve Request Error:", reqErr);
      throw reqErr;
    }

    // 2. Update the actual target record
    if (request.entityType === 'SALE') {
      await this.updateSale(targetEntity as Sale);
    } else if (request.entityType === 'CUSTOMER') {
      await this.updateCustomer(targetEntity as Customer);
    }
  },

  async rejectEditRequest(request: EditRequest, reviewerName: string) {
    const { error } = await supabase
      .from('edit_requests')
      .update({
        status: EditStatus.REJECTED,
        "reviewedBy": reviewerName,
        "reviewTimestamp": new Date().toISOString()
      })
      .eq('id', request.id);
    if (error) throw error;
  },

  async addChatMessage(msg: ChatMessage) {
    const { error } = await supabase.from('messages').insert([msg]);
    if (error) throw error;
  },

  async addCustomer(item: Customer) {
    const { error } = await supabase.from('customers').insert([item]);
    if (error) throw error;
  },

  async deleteCustomer(id: string) {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },

  async addExpense(item: Expense) {
    const { error } = await supabase.from('expenses').insert([item]);
    if (error) throw error;
  },

  async deleteExpense(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  },

  async addInvestment(item: Investment) {
    const { error } = await supabase.from('investments').insert([item]);
    if (error) throw error;
  },

  async deleteInvestment(id: string) {
    const { error } = await supabase.from('investments').delete().eq('id', id);
    if (error) throw error;
  },

  async addMobileTx(item: MobileTransaction) {
    const { error } = await supabase.from('mobile_transactions').insert([item]);
    if (error) throw error;
  },

  async deleteMobileTx(id: string) {
    const { error } = await supabase.from('mobile_transactions').delete().eq('id', id);
    if (error) throw error;
  },

  async addHawlat(item: Hawlat) {
    const { error } = await supabase.from('hawlats').insert([item]);
    if (error) throw error;
  },

  async updateHawlat(item: Hawlat) {
    const { error } = await supabase.from('hawlats').update(item).eq('id', item.id);
    if (error) throw error;
  },

  async deleteHawlat(id: string) {
    const { error } = await supabase.from('hawlats').delete().eq('id', id);
    if (error) throw error;
  },

  async addHawlatReturn(item: HawlatReturn) {
    const { error } = await supabase.from('hawlat_returns').insert([item]);
    if (error) throw error;
  },

  async addHalKhataSession(item: any) {
    const { error } = await supabase.from('hal_khata_sessions').insert([item]);
    if (error) throw error;
  },

  async addEditRequest(item: EditRequest) {
    const { error } = await supabase.from('edit_requests').insert([item]);
    if (error) throw error;
  },

  async addDailyClosing(item: DailyClosing) {
    const { error } = await supabase.from('daily_closings').insert([item]);
    if (error) throw error;
  },

  async deleteDailyClosing(id: string) {
    const { error } = await supabase.from('daily_closings').delete().eq('id', id);
    if (error) throw error;
  },

  async addDailySummary(item: DailySummary) {
    const { error } = await supabase.from('daily_summaries').upsert([item]);
    if (error) throw error;
  },

  async getUserProfile(uid: string): Promise<Partial<User> | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
    if (error) return null;
    return data;
  },

  async updateUserProfile(uid: string, data: Partial<User>) {
    const { error } = await supabase.from('users').upsert({ id: uid, ...data });
    if (error) throw error;
  },

  async updateUsersList(users: User[]) {
    for (const u of users) {
      await this.updateUserProfile(u.id, u);
    }
  }
};
