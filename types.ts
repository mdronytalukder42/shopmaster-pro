
export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER'
}

export enum ShopType {
  ELECTRIC = 'Electric',
  KITCHEN = 'Kitchen',
  TEA_SHOP = 'Tea Shop'
}

export enum PaymentType {
  CASH = 'CASH',
  BAKI = 'BAKI',
  PARTIAL = 'PARTIAL'
}

export enum MobileBankType {
  BKASH = 'bKash',
  NAGAD = 'Nagad',
  ROCKET = 'Rocket',
  RECHARGE = 'Recharge'
}

export enum EditStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
}

export interface AuditEntry {
  timestamp: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
  editedBy: string;
  approvedBy?: string; // Who approved the change
}

export interface EditRequest {
  id: string;
  entityType: 'SALE' | 'CUSTOMER';
  entityId: string;
  field: 'ledger_entry' | string;
  oldValue: any;
  newValue: any;
  reason: string;
  requestedBy: string;
  timestamp: string;
  status: EditStatus;
  reviewedBy?: string;
  reviewTimestamp?: string;
}

export interface CompanySettings {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  adminEmail?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
  photo?: string;
}

export interface Shop {
  id: string;
  name: string;
  type: ShopType;
  logo?: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  fatherName?: string;
  houseName?: string;
  village?: string;
  area: string;
  source?: string;
  email?: string;
  photo?: string;
  openingDue: number;
  openingDueDescription?: string;
  note?: string;
  auditHistory?: AuditEntry[];
}

export interface SaleItem {
  name: string;
  qty: number;
  price: number;
}

export interface Sale {
  id: string;
  date: string;
  shopId: string;
  customerId: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentType: PaymentType;
  items: SaleItem[];
  editHistory?: AuditEntry[];
}

export interface Expense {
  id: string;
  date: string;
  shopId: string;
  type: string;
  amount: number;
  description: string;
  sourceType: 'SHOP' | 'POCKET';
  sourceShopId?: string;
}

export interface Investment {
  id: string;
  date: string;
  shopId: string;
  itemName: string;
  amount: number;
  supplierName?: string;
  description: string;
  sourceType: 'SHOP' | 'POCKET';
  sourceShopId?: string;
}

export interface MobileTransaction {
  id: string;
  date: string;
  type: MobileBankType;
  transactionType: 'IN' | 'OUT';
  amount: number;
  description: string;
  sourceType: 'SHOP' | 'POCKET' | 'WALLET_REVENUE';
  sourceShopId?: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  shopId: string;
  totalSales: number;
  totalCash: number;
  totalDue: number;
  totalExpense: number;
  isClosed: boolean;
  closedAt: string;
}

export interface DailySummary {
  shopId: string;
  date: string;
  content: string;
}

export interface Hawlat {
  id: string;
  date: string;
  receiverName: string;
  fatherName?: string;
  houseName?: string;
  mobile?: string;
  amount: number;
  reason: string;
  sourceType: 'SHOP' | 'POCKET';
  shopId?: string;
  photo?: string;
  status: 'PENDING' | 'COMPLETED';
}

export interface HawlatReturn {
  id: string;
  hawlatId: string;
  date: string;
  amount: number;
  note?: string;
}

export interface AppData {
  company: CompanySettings;
  users: User[];
  shops: Shop[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  investments: Investment[];
  mobileTransactions: MobileTransaction[];
  dailyClosings: DailyClosing[];
  dailySummaries: DailySummary[];
  halKhataSessions: any[];
  hawlats: Hawlat[];
  hawlatReturns: HawlatReturn[];
  editRequests: EditRequest[];
  messages: ChatMessage[];
}
