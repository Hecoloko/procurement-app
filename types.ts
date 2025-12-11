import React from 'react';

export interface NavItem {
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface Company {
  id: string;
  name: string;
}

export type CartType = 'Standard' | 'Recurring' | 'Scheduled';
export type CartStatus = 'Draft' | 'Ready for Review' | 'Submitted';

export type ItemApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export interface CartItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note?: string;
  approvalStatus?: ItemApprovalStatus;
  rejectionReason?: string;
  vendorId?: string;
}

export type RecurringFrequency = 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Quarterly';

export interface Cart {
  id: string;
  companyId: string; // Multi-tenant
  workOrderId: string; // Immutable, globally unique identifier
  name: string; // User-editable cart name
  type: CartType;
  itemCount: number;
  totalCost: number;
  status: CartStatus;
  lastModified: string;
  items: CartItem[];
  propertyId: string;
  category?: string;
  // Scheduling fields
  scheduledDate?: string;
  frequency?: RecurringFrequency;
  startDate?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  lastRunAt?: string;
}

export interface Product {
  id: string;
  companyId?: string; // Multi-tenant
  name: string;
  sku: string;
  description: string;
  unitPrice: number;
  imageUrl: string;
  vendorId?: string;
  primaryCategory: string;
  secondaryCategory: string;
  rating?: number;
  tags?: string[];
  globalProductId?: string;
  vendorOptions?: ProductVendorOption[];
}

export interface ProductVendorOption {
  id: string;
  vendorId: string;
  vendorName?: string; // Enriched
  vendorSku: string;
  price: number;
  isPreferred: boolean;
}

export interface GlobalProduct {
  id: string;
  name: string;
  sku: string;
  description: string;
  unitPrice: number;
  imageUrl: string;
  category: string;
  provider: string;
  specs?: Record<string, any>;
}

export type ApprovalStatus = 'Pending My Approval' | 'Pending Others' | 'Approved' | 'Rejected';

export interface ApprovalRequest {
  id: string;
  cartName: string;
  submittedBy: string;
  submissionDate: string;
  totalCost: number;
  status: ApprovalStatus;
}

export type OrderStatus =
  | 'Draft'
  | 'Ready for Review'
  | 'Submitted'
  | 'Pending My Approval'
  | 'Pending Others'
  | 'Approved'
  | 'Needs Revision'
  | 'Rejected'
  | 'Processing'
  | 'Shipped'
  | 'Completed'
  | 'Scheduled';

export interface Order {
  id: string;
  companyId: string; // Multi-tenant
  cartId: string;
  cartName: string;
  workOrderId?: string; // Derived from Cart
  submittedBy: string;
  submissionDate: string;
  totalCost: number;
  status: OrderStatus;
  type: CartType;
  itemCount: number;
  items: CartItem[];
  purchaseOrders?: PurchaseOrder[];
  statusHistory?: { status: OrderStatus; date: string }[];
  propertyId: string;
  threadId?: string;

  // AR / Billback Fields
  billingStatus?: 'Unbilled' | 'Partially Billed' | 'Billed';
  invoiceId?: string;
}

export interface VendorAccount {
  id: string;
  propertyId: string;
  accountNumber: string;
}

export interface Vendor {
  id: string;
  companyId?: string; // Multi-tenant
  name: string;
  phone?: string;
  email?: string;
  accounts?: VendorAccount[];
}

export type PurchaseOrderStatus = 'Issued' | 'Purchased' | 'In Transit' | 'Received';

export interface PurchaseOrder {
  id: string;
  originalOrderId: string;
  vendorId: string;
  items: CartItem[];
  status: PurchaseOrderStatus;
  eta?: string;
  deliveryProofUrl?: string;
  carrier?: string;
  trackingNumber?: string;
  vendorConfirmationNumber?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  paymentStatus?: 'Unbilled' | 'Billed' | 'Paid';
  invoiceDate?: string;
  dueDate?: string;
  paymentDate?: string;
  paymentMethod?: string;
  amountDue?: number;
  statusHistory?: { status: PurchaseOrderStatus; date: string }[];
  created_at?: string;
}

export interface Account {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  subtype?: string;
  isActive: boolean;
  balance?: number; // Calculated field
}

export interface JournalEntry {
  id: string;
  companyId: string;
  transactionDate: string;
  description: string;
  referenceId?: string;
  lines: JournalLine[];
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  debit: number;
  credit: number;
}

export interface Property {
  id: string;
  companyId?: string; // Multi-tenant
  name: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface Unit {
  id: string;
  propertyId: string;
  name: string;
}


// Admin Settings Types
export interface AdminUser {
  id: string;
  companyId: string; // Multi-tenant
  name: string;
  email: string;
  roleId: string;
  propertyIds: string[];
  avatarUrl: string;
  status: 'Active' | 'Inactive';
}

export type AppModule =
  | 'dashboard'
  | 'carts'
  | 'orders'
  | 'approvals'
  | 'purchaseOrders'
  | 'receiving'
  | 'transactions'
  | 'reports'
  | 'suppliers'
  | 'properties'
  | 'communications'
  | 'integrations'
  // Settings modules
  | 'settings'
  | 'users'
  | 'roles'
  | 'workflows'
  | 'notifications'
  | 'companyProperties';


export type PermissionAction =
  | 'view'
  | 'view-own'
  | 'view-all'
  | 'create'
  | 'edit'
  | 'edit-own'
  | 'delete'
  | 'delete-own'
  | 'approve'
  | 'submit'
  | 'procure'
  | 'impersonate';

export type Permission = `${AppModule}:${PermissionAction}`;

export type PermissionSet = Partial<Record<AppModule, PermissionAction[]>>;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface ApprovalRule {
  id: string;
  name: string;
  conditions: {
    amountMin?: number;
    amountMax?: number;
    glCategories?: string[];
    properties?: string[];
    vendors?: string[];
    roles?: string[];
    overBudget?: boolean;
  };
  steps: { roleId: string }[];
}

export type NotificationEvent = 'cartSubmission' | 'approvalRequest' | 'finalApproval' | 'purchase' | 'reception';

export interface NotificationSetting {
  id: NotificationEvent;
  label: string;
  email: boolean;
  sms: boolean;
  push: boolean;
}

// Transactions Page Types
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed' | 'Approved';

export interface ProcessHistoryEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'in_progress';
}

export interface Transaction {
  id: string;
  submitter: string;
  submitterId: string;
  receiverId: string;
  documentType: string;
  documentDate: string;
  approvalStatus: TransactionStatus;
  ettn: string;

  // Detail Panel Info
  invoiceNumber: string;
  documentNumber: string;
  portalLink: string;
  attachments: { name: string; size: string }[];
  processHistory: ProcessHistoryEvent[];
}

// Communication Types
export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  timestamp: string;
  taggedUserIds?: string[];
}

export interface CommunicationThread {
  id: string;
  companyId?: string; // Multi-tenant
  subject?: string;
  participantIds: string[];
  orderId?: string;
  lastMessageTimestamp: string;
  lastMessageSnippet: string;
  isRead: boolean;
}

// Payment Settings Types
export interface CompanyPaymentSettings {
  id: string;
  companyId: string;
  accountLabel: string;
  solaXKey?: string; // Optional/Partial if we don't want to expose it fully on read, but for admin edit we might need it
  solaIFieldsKey: string;
  isActive: boolean;
}

export interface InvoiceTypeMapping {
  id: string;
  companyId: string;
  invoiceType: string;
  paymentSettingsId: string;
}

// ACCOUNTS RECEIVABLE TYPES

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    propertyId?: string; // Links customer to a property for billback
  };
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled' | 'Void';

export interface Vendor {
  id: string;
  name: string;
  rating?: number;
  contactEmail?: string;
  products?: ProductVendorOption[];
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  paymentPreference?: 'bank_transfer' | 'cheque' | 'qr';
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number; // Selling Price (Final)
  costPrice?: number; // Original Cost
  markupPercentage?: number; // e.g., 20 for 20%
  taxRate?: number;
  totalPrice: number; // Calculated
}

export interface Invoice {
  id: string;
  companyId: string;
  customerId?: string; // Optional now, can be linked to Property/Unit instead
  propertyId?: string;
  unitId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  amountPaid: number;
  notes?: string;
  paymentMethod?: string;
  paymentDate?: string;
  stripeSessionId?: string;
  balanceDue?: number; // Calculated
  createdBy?: string;
  items?: InvoiceItem[];
  customer?: Customer; // Joined
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
}

// AP / AR New Systems

export interface VendorInvoice {
  id: string;
  companyId: string;
  vendorId: string;
  vendorName?: string; // Enriched
  purchaseOrderId?: string;
  invoiceNumber: string;
  invoiceDate: string; // ISO Date
  dueDate?: string;
  totalAmount: number;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Paid' | 'Rejected' | 'Void';
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  pdfUrl?: string;
  items?: VendorInvoiceItem[];
}

export interface VendorInvoiceItem {
  id: string;
  vendorInvoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  propertyId?: string;
  unitId?: string;
  workOrderId?: string;
  expenseCategory?: string;
}

export interface APLedgerEntry {
  id: string;
  companyId: string;
  vendorId: string;
  transactionDate: string; // ISO
  type: 'Invoice' | 'Payment' | 'Credit' | 'Refund';
  referenceId?: string;
  description?: string;
  amount: number;
  balanceAfter?: number;
}

export interface BillableItem {
  id: string;
  companyId: string;
  sourceType: 'Expense' | 'WorkOrder' | 'Manual' | 'Recurring' | 'VendorInvoice' | 'PurchaseOrder';
  sourceId?: string;
  propertyId?: string;
  unitId?: string;
  customerId?: string;
  description: string;
  costAmount: number;
  markupAmount: number;
  totalAmount: number;
  status: 'Pending' | 'Invoiced' | 'Paid' | 'Waived';
  invoiceId?: string;
}

export interface ARLedgerEntry {
  id: string;
  companyId: string;
  customerId: string;
  transactionDate: string;
  type: 'Invoice' | 'Payment' | 'Adjustment' | 'CreditMemo';
  referenceId?: string;
  description?: string;
  amount: number;
  balanceAfter?: number;
}

export interface StripePaymentRecord {
  id: string;
  companyId: string;
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  stripeCustomerId?: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: any;
  createdAt: string;
}