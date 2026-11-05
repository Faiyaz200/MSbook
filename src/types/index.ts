export type BusinessType = 'KIRANA' | 'CLOTHING';

export interface BusinessTypeMeta {
  type: BusinessType;
  title: string;
  description: string;
  badge: string;
}

export const BUSINESS_TYPES: Record<string, BusinessTypeMeta> = {
  KIRANA: {
    type: 'KIRANA',
    title: 'Kirana / General Store',
    description: 'Provisions, grocery, FMCG & daily essentials store',
    badge: 'Provisions & FMCG',
  },
};

export interface DeletedStockItem {
  id: string;
  businessId: string;
  originalProductId: string;
  name: string;
  deletedAt: number; // timestamp
  stockQuantity: number;
  unit: string;
  purchaseCost: number;
  sellingPrice: number;
  totalValuation: number;
  reason?: string;
}

export interface Business {
  id: string;
  businessName: string;
  businessType: BusinessType;
  ownerName: string;
  mobileNumber: string;
  address: string;
  createdAt: number;
  updatedAt: number;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  mobileNumber: string;
  address: string;
  openingBalance: number; // Default 0
  createdAt: number;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  mobileNumber: string;
  address: string;
  openingBalance: number; // Default 0
  createdAt: number;
}

export type AccountGroup =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'INCOME'
  | 'EXPENSE';

export interface LedgerAccount {
  id: string;
  businessId: string;
  name: string;
  group: AccountGroup;
  subGroup?: string;
  openingBalance: number;
  isSystem: boolean;
  createdAt: number;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku?: string;
  stockQuantity: number;
  purchaseCost?: number;
  sellingPrice?: number;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  category?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  unit: string; // kg, g, ltr, ml, pcs, pkt, box
  sellingPrice: number;
  purchaseCost: number; // Cost basis for COGS
  openingStock?: number;
  stockQuantity: number;
  minStockLevel?: number; // Low stock threshold
  variantInfo: string; // Size/Color summary
  variants?: ProductVariant[];
  createdAt: number;
  updatedAt?: number;
  editNote?: string;
  editHistory?: Array<{
    editedAt: number;
    note: string;
  }>;
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE' | 'PURCHASE' | 'OPENING';

export interface StockMovement {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantInfo?: string; // e.g. "Size 32 / Blue"
  type: StockMovementType;
  quantity: number; // positive number of units moved
  previousStock: number;
  newStock: number;
  referenceNo?: string;
  voucherId?: string;
  reason?: string;
  date: number;
}

export interface InventorySummary {
  totalProducts: number;
  totalStockUnits: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export type VoucherType =
  | 'SALES'
  | 'PURCHASE'
  | 'RECEIPT'
  | 'PAYMENT'
  | 'SPLIT_PAYMENT'
  | 'CONTRA'
  | 'JOURNAL'
  | 'DEBIT_NOTE'
  | 'CREDIT_NOTE';

export interface VoucherMeta {
  type: VoucherType;
  title: string;
  subtitle: string;
  defaultPrefix: string;
  isPrimary: boolean;
  category: 'Main' | 'More';
}

export const VOUCHERS: Record<VoucherType, VoucherMeta> = {
  SALES: {
    type: 'SALES',
    title: 'Sales Voucher',
    subtitle: 'Create Sales Bill',
    defaultPrefix: 'INV',
    isPrimary: true,
    category: 'Main',
  },
  PURCHASE: {
    type: 'PURCHASE',
    title: 'Purchase Voucher',
    subtitle: 'Record Purchase',
    defaultPrefix: 'PUR',
    isPrimary: true,
    category: 'Main',
  },
  RECEIPT: {
    type: 'RECEIPT',
    title: 'Receipt Voucher',
    subtitle: 'Receive Payment',
    defaultPrefix: 'RCT',
    isPrimary: true,
    category: 'Main',
  },
  PAYMENT: {
    type: 'PAYMENT',
    title: 'Payment Voucher',
    subtitle: 'Make Payment',
    defaultPrefix: 'PMT',
    isPrimary: true,
    category: 'Main',
  },
  SPLIT_PAYMENT: {
    type: 'SPLIT_PAYMENT',
    title: 'Split Payment',
    subtitle: 'Multi-Mode Cash/UPI/Credit',
    defaultPrefix: 'SPL',
    isPrimary: true,
    category: 'Main',
  },
  CONTRA: {
    type: 'CONTRA',
    title: 'Contra Voucher',
    subtitle: 'Bank & Cash Transfers',
    defaultPrefix: 'CNT',
    isPrimary: false,
    category: 'More',
  },
  JOURNAL: {
    type: 'JOURNAL',
    title: 'Journal Voucher',
    subtitle: 'Adjustment & Non-Cash Entries',
    defaultPrefix: 'JRN',
    isPrimary: false,
    category: 'More',
  },
  DEBIT_NOTE: {
    type: 'DEBIT_NOTE',
    title: 'Debit Note',
    subtitle: 'Purchase Returns & Supplier Debit',
    defaultPrefix: 'DBN',
    isPrimary: false,
    category: 'More',
  },
  CREDIT_NOTE: {
    type: 'CREDIT_NOTE',
    title: 'Credit Note',
    subtitle: 'Sales Returns & Customer Credit',
    defaultPrefix: 'CRN',
    isPrimary: false,
    category: 'More',
  },
};

export interface Voucher {
  id: string;
  businessId: string;
  voucherType: VoucherType;
  voucherNumber: string;
  date: number;
  partyId?: string;
  partyName?: string;
  totalAmount: number;
  cashAmount: number;
  upiAmount: number;
  bankAmount: number;
  udharAmount: number;
  referenceNo?: string;
  remarks?: string;
  createdAt: number;
}

export interface VoucherItem {
  id: string;
  voucherId: string;
  businessId: string;
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  variantInfo: string;
  sellingPrice: number;
  purchaseCostAtSale: number;
  discount: number;
  lineTotal: number;
}

export interface JournalEntry {
  id: string;
  businessId: string;
  voucherId: string;
  accountName: string;
  partyId?: string;
  debit: number;
  credit: number;
  date: number;
  narration: string;
}

export interface CustomerTransactionRow {
  voucherId: string;
  voucherNumber: string;
  date: number;
  voucherType: string;
  productDetails: string;
  debit: number;
  credit: number;
  totalBill: number;
  cashPaid: number;
  upiPaid: number;
  bankPaid: number;
  udhar: number;
  runningBalance: number;
}

export interface CustomerLedgerSummary {
  customer: Customer;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  totalSales: number;
  cashReceived: number;
  upiReceived: number;
  bankReceived: number;
  totalReceived: number;
  totalOutstanding: number;
  transactions: CustomerTransactionRow[];
}

export interface SupplierTransactionRow {
  voucherId: string;
  voucherNumber: string;
  date: number;
  voucherType: string;
  description: string;
  debit: number; // Payments made to supplier
  credit: number; // Purchases from supplier
  runningBalance: number;
}

export interface SupplierLedgerSummary {
  supplier: Supplier;
  openingBalance: number;
  totalDebit: number; // Payments made
  totalCredit: number; // Purchases / bills
  totalPurchases: number;
  totalPaid: number;
  totalPayable: number;
  transactions: SupplierTransactionRow[];
}

export interface AccountTransactionRow {
  id: string;
  voucherId?: string;
  voucherNumber?: string;
  voucherType?: string;
  date: number;
  narration: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface GeneralLedgerSummary {
  account: LedgerAccount;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  transactions: AccountTransactionRow[];
}

export interface BusinessFinancialSummary {
  cashBalance: number;
  bankBalance: number;
  upiBalance: number;
  customerOutstanding: number;
  supplierOutstanding: number;
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  netProfit: number;
  stockValue: number;
}

export type BottomTabKey = 'DASHBOARD' | 'VOUCHERS' | 'INVENTORY' | 'REPORTS';

export type ReportType =
  | 'PROFIT_LOSS'
  | 'BALANCE_SHEET'
  | 'DAY_BOOK'
  | 'CASH_BOOK'
  | 'BANK_BOOK'
  | 'CUSTOMER_OUTSTANDING'
  | 'SUPPLIER_OUTSTANDING'
  | 'SALES_REPORT'
  | 'PURCHASE_REPORT'
  | 'EXPENSE_REPORT'
  | 'STOCK_SUMMARY'
  | 'STOCK_MOVEMENT'
  | 'LOW_STOCK';

export type DateRangeFilter =
  | 'TODAY'
  | 'YESTERDAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'PREVIOUS_MONTH'
  | 'CUSTOM';

export type ExportDataType =
  | 'CUSTOMERS'
  | 'SUPPLIERS'
  | 'PRODUCTS'
  | 'SALES'
  | 'PURCHASES'
  | 'LEDGERS'
  | 'STOCK_MOVEMENTS';

export type SettingsSubSection =
  | 'HUB'
  | 'PROFILE'
  | 'MANAGE_BUSINESSES'
  | 'FINANCIAL_YEAR'
  | 'INVOICE_SETTINGS'
  | 'DEFAULT_UNITS'
  | 'BACKUP'
  | 'RESTORE'
  | 'EXPORT'
  | 'APP_INFO';

export interface BusinessInvoiceSettings {
  invoicePrefix: string;
  autoNumbering: boolean;
  nextInvoiceNumber: number;
  showBusinessDetails: boolean;
  showCustomerDetails: boolean;
  defaultInvoiceNotes: string;
}

export interface BusinessFinancialYearSettings {
  startDate: string;
  endDate: string;
  label: string;
}

export interface BusinessUnitSettings {
  defaultUnit: string;
  allowedUnits: string[];
}

export interface BusinessSettings {
  businessId: string;
  invoiceSettings: BusinessInvoiceSettings;
  financialYear: BusinessFinancialYearSettings;
  unitSettings: BusinessUnitSettings;
  updatedAt: number;
}

export interface MSbookBackupPayload {
  app: 'MSbook';
  version: string;
  timestamp: number;
  checksum: string;
  businesses: Business[];
  businessSettings?: Record<string, BusinessSettings>;
  customers: Customer[];
  suppliers: Supplier[];
  ledgerAccounts: LedgerAccount[];
  products: Product[];
  stockMovements: StockMovement[];
  vouchers: Voucher[];
  voucherItems: VoucherItem[];
  journalEntries: JournalEntry[];
}

export type ScreenState =
  | { name: 'BUSINESS_SELECT'; isAddingAdditional?: boolean }
  | { name: 'BUSINESS_DETAILS'; businessType: BusinessType; preservedName?: string }
  | { name: 'DASHBOARD' }
  | { name: 'VOUCHERS' }
  | { name: 'SALES_VOUCHER' }
  | { name: 'SPLIT_PAYMENT' }
  | { name: 'RECEIPT_VOUCHER'; preSelectedCustomerId?: string }
  | { name: 'PURCHASE_VOUCHER'; preSelectedSupplierId?: string }
  | { name: 'PAYMENT_VOUCHER'; preSelectedSupplierId?: string }
  | { name: 'CUSTOMER_LEDGER'; customerId?: string }
  | { name: 'SUPPLIER_LEDGER'; supplierId?: string }
  | { name: 'ACCOUNT_LEDGER'; accountName: string }
  | { name: 'VOUCHER_DETAIL'; voucherType: VoucherType }
  | { name: 'LEDGERS' }
  | { name: 'INVENTORY'; selectedProductId?: string; initialTab?: 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MOVEMENTS' }
  | { name: 'PRODUCT_FORM'; mode: 'ADD' | 'EDIT'; productId?: string }
  | { name: 'STOCK_ADJUSTMENT'; productId?: string }
  | { name: 'PRODUCT_DETAIL'; productId: string }
  | { name: 'REPORTS'; selectedReport?: ReportType }
  | { name: 'BUSINESS_SWITCHER' }
  | { name: 'SETTINGS'; initialSubSection?: SettingsSubSection };


