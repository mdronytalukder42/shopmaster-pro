
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const BACKEND_URL = process.env.VITE_BACKEND_URL || "http://localhost:5000";

const realTimeSms = async (mobile: string, message: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/send-sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: mobile, message })
    });
    
    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Backend Server Error");
    }

    const result = await response.json();
    if (result.success) {
      console.log(`%c[SMS SENT] To ${mobile}: ${message}`, "color: #10b981; font-weight: bold;");
      return { success: true };
    } else {
      throw new Error(result.error);
    }
  } catch (err: any) {
    console.group("SMS Gateway (Simulation Mode)");
    console.warn("Status: Backend unreachable at " + BACKEND_URL);
    console.log(`To: ${mobile}`);
    console.log(`Message: ${message}`);
    console.groupEnd();
    return { success: true, simulated: true };
  }
};

export const smsService = {
  async sendDueReminder(customerName: string, mobile: string, dueAmount: number, shopName: string) {
    try {
      const prompt = `Write a short, professional Bengali SMS for customer ${customerName} (Due: ৳${dueAmount}) from ${shopName}. Return ONLY text.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      const message = response.text?.trim() || `সম্মানিত ${customerName}, ${shopName}-এ আপনার বকেয়া ৳${dueAmount}। পরিশোধ করার জন্য অনুরোধ করা হলো।`;
      return await realTimeSms(mobile, message);
    } catch (error: any) {
      console.error("SMS Generation Error:", error);
      return { success: false, error: error.message };
    }
  },

  async sendHalKhataInvitation(customerName: string, mobile: string, shopName: string, date: string, customText: string) {
    return await realTimeSms(mobile, customText);
  }
};
