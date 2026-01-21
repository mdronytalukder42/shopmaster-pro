
import { Sale, Customer, Shop, EditRequest } from "../types";

// ডিপ্লয় করার পর আপনার ব্যাকএন্ড (server.js) যেখানে হোস্ট করবেন সেই লিঙ্কটি এখানে দিতে হবে।
const BACKEND_URL = process.env.VITE_BACKEND_URL || "http://localhost:5000"; 
const OWNER_EMAIL = "mdronytalukder42@gmail.com";

export const notificationService = {
  async testConnection(email: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/test-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || OWNER_EMAIL })
      });
      return await response.json();
    } catch (error) {
      console.error("Backend connection failed:", error);
      return { success: false, error: "Backend server offline or unreachable." };
    }
  },

  async sendSaleInvoice(sale: Sale, customer: Customer, shop: Shop) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/send-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customer.email,
          adminEmail: OWNER_EMAIL, 
          saleId: sale.id.substr(0, 8).toUpperCase(),
          shopName: shop.name,
          customerName: customer.name,
          date: new Date(sale.date).toLocaleString('bn-BD'),
          description: sale.description,
          total: sale.totalAmount,
          paid: sale.paidAmount,
          due: sale.dueAmount
        })
      });
      return await response.json();
    } catch (error) {
      console.warn("Email could not be sent because the backend is not running.");
      return { success: false, error: "Connection error" };
    }
  },

  async notifyAdminOnRequest(request: EditRequest, adminEmail: string) {
    try {
      await fetch(`${BACKEND_URL}/api/notify-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: adminEmail || OWNER_EMAIL,
          requestId: request.id,
          entityType: request.entityType,
          field: request.field,
          requestedBy: request.requestedBy,
          reason: request.reason
        })
      });
    } catch (error) {
      console.warn("Admin notification skipped: Backend offline.");
    }
  }
};
