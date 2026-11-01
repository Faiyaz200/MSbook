import {
  Business,
  DateRangeFilter,
  Product,
  Customer,
  Supplier,
  Voucher,
  JournalEntry,
  StockMovement,
} from '../types';
import { db } from './db';

export interface DateRangeBounds {
  startMs: number;
  endMs: number;
  label: string;
}

export function getDateRangeBounds(
  filter: DateRangeFilter,
  customStart?: string,
  customEnd?: string
): DateRangeBounds {
  const now = new Date();

  // Helper for start of day
  const startOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy.getTime();
  };

  // Helper for end of day
  const endOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy.getTime();
  };

  switch (filter) {
    case 'TODAY': {
      return {
        startMs: startOfDay(now),
        endMs: endOfDay(now),
        label: 'Today',
      };
    }
    case 'YESTERDAY': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startMs: startOfDay(yesterday),
        endMs: endOfDay(yesterday),
        label: 'Yesterday',
      };
    }
    case 'THIS_WEEK': {
      const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
      const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(now);
      monday.setDate(monday.getDate() - distanceToMonday);
      return {
        startMs: startOfDay(monday),
        endMs: endOfDay(now),
        label: 'This Week',
      };
    }
    case 'THIS_MONTH': {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startMs: startOfDay(firstOfMonth),
        endMs: endOfDay(now),
        label: 'This Month',
      };
    }
    case 'PREVIOUS_MONTH': {
      const firstOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startMs: startOfDay(firstOfPrevMonth),
        endMs: endOfDay(lastOfPrevMonth),
        label: 'Previous Month',
      };
    }
    case 'CUSTOM': {
      if (customStart && customEnd) {
        const s = new Date(customStart);
        const e = new Date(customEnd);
        return {
          startMs: startOfDay(s),
          endMs: endOfDay(e),
          label: `${customStart} to ${customEnd}`,
        };
      }
      return {
        startMs: startOfDay(now),
        endMs: endOfDay(now),
        label: 'Today (Custom)',
      };
    }
    default:
      return {
        startMs: startOfDay(now),
        endMs: endOfDay(now),
        label: 'Today',
      };
  }
}

// -------------------------------------------------------------
// 1. Profit & Loss Statement
// -------------------------------------------------------------
export interface ProfitAndLossReport {
  grossSales: number;
  salesReturns: number;
  netSales: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: { name: string; amount: number }[];
  totalExpenses: number;
  otherIncome: number;
  netProfit: number;
  netProfitMarginPercent: number;
}

export function calculateProfitAndLoss(
  businessId: string,
  startMs: number = 0,
  endMs: number = Date.now()
): ProfitAndLossReport {
  const vouchers = db.getVouchers(businessId).filter((v) => v.date >= startMs && v.date <= endMs);
  const journals = db.getJournalEntries(businessId).filter((j) => j.date >= startMs && j.date <= endMs);
  const accounts = db.getLedgerAccounts(businessId);

  // 1. Sales
  const salesVouchers = vouchers.filter(
    (v) => v.voucherType === 'SALES' || v.voucherType === 'SPLIT_PAYMENT'
  );
  const grossSales = salesVouchers.reduce((sum, v) => sum + v.totalAmount, 0);

  // Sales Returns
  const creditNotes = vouchers.filter((v) => v.voucherType === 'CREDIT_NOTE');
  const salesReturns = creditNotes.reduce((sum, v) => sum + v.totalAmount, 0);
  const netSales = Math.max(0, grossSales - salesReturns);

  // 2. COGS (Recorded at sale snapshot from voucher items or journal)
  // Calculate from journal entries debiting Cost of Goods Sold
  let cogs = journals
    .filter((j) => j.accountName.toLowerCase() === 'cost of goods sold')
    .reduce((s, j) => s + j.debit, 0);

  // Fallback: If no journal entries exist, derive from voucher items
  if (cogs === 0 && salesVouchers.length > 0) {
    salesVouchers.forEach((sv) => {
      const items = db.getVoucherItems(sv.id);
      items.forEach((it) => {
        cogs += (it.quantity || 0) * (it.purchaseCostAtSale || 0);
      });
    });
  }

  const grossProfit = netSales - cogs;
  const grossMarginPercent = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

  // 3. Operating Expenses (excluding COGS)
  const expenseAccounts = accounts.filter(
    (a) => a.group === 'EXPENSE' && a.name.toLowerCase() !== 'cost of goods sold'
  );
  const expenseAccountNames = new Set(expenseAccounts.map((a) => a.name.toLowerCase()));

  const expensesMap: Record<string, number> = {};
  journals.forEach((j) => {
    const accLower = j.accountName.toLowerCase();
    if (expenseAccountNames.has(accLower)) {
      const netExpense = j.debit - j.credit;
      if (netExpense > 0) {
        expensesMap[j.accountName] = (expensesMap[j.accountName] || 0) + netExpense;
      }
    }
  });

  const operatingExpenses = Object.entries(expensesMap).map(([name, amount]) => ({
    name,
    amount,
  }));
  const totalExpenses = operatingExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 4. Other Income (excluding Sales Account)
  const incomeAccounts = accounts.filter(
    (a) => a.group === 'INCOME' && a.name.toLowerCase() !== 'sales account'
  );
  const incomeAccountNames = new Set(incomeAccounts.map((a) => a.name.toLowerCase()));
  const otherIncome = journals
    .filter((j) => incomeAccountNames.has(j.accountName.toLowerCase()))
    .reduce((s, j) => s + (j.credit - j.debit), 0);

  // Net Profit
  const netProfit = grossProfit + Math.max(0, otherIncome) - totalExpenses;
  const netProfitMarginPercent = netSales > 0 ? (netProfit / netSales) * 100 : 0;

  return {
    grossSales,
    salesReturns,
    netSales,
    cogs,
    grossProfit,
    grossMarginPercent,
    operatingExpenses,
    totalExpenses,
    otherIncome: Math.max(0, otherIncome),
    netProfit,
    netProfitMarginPercent,
  };
}

// -------------------------------------------------------------
// 2. Balance Sheet
// -------------------------------------------------------------
export interface BalanceSheetItem {
  name: string;
  amount: number;
  note?: string;
}

export interface BalanceSheetReport {
  asOfDate: number;
  assets: {
    cashInHand: number;
    bankBalance: number;
    upiBalance: number;
    sundryDebtors: number; // Customer Outstandings
    closingStock: number; // Inventory valuation
    totalAssets: number;
  };
  liabilities: {
    sundryCreditors: number; // Supplier Outstandings
    otherLiabilities: number;
    totalLiabilities: number;
  };
  equity: {
    ownersCapital: number;
    retainedEarnings: number; // Cumulative net profit
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  discrepancy: number;
}

export function calculateBalanceSheet(
  businessId: string,
  asOfDateMs: number = Date.now()
): BalanceSheetReport {
  const journals = db.getJournalEntries(businessId).filter((j) => j.date <= asOfDateMs);
  const accounts = db.getLedgerAccounts(businessId);
  const customers = db.getCustomers(businessId);
  const suppliers = db.getSuppliers(businessId);
  const products = db.getProducts(businessId);

  const getAccountOpening = (name: string) => {
    const acc = accounts.find((a) => a.name.toLowerCase() === name.toLowerCase());
    return acc?.openingBalance || 0;
  };

  // 1. Assets
  const cashJournals = journals.filter((j) => j.accountName.toLowerCase() === 'cash account');
  const cashInHand = Math.max(
    0,
    getAccountOpening('Cash Account') + cashJournals.reduce((s, j) => s + j.debit - j.credit, 0)
  );

  const bankJournals = journals.filter((j) => j.accountName.toLowerCase() === 'bank account');
  const bankBalance = Math.max(
    0,
    getAccountOpening('Bank Account') + bankJournals.reduce((s, j) => s + j.debit - j.credit, 0)
  );

  const upiJournals = journals.filter((j) => j.accountName.toLowerCase() === 'upi account');
  const upiBalance = Math.max(
    0,
    getAccountOpening('UPI Account') + upiJournals.reduce((s, j) => s + j.debit - j.credit, 0)
  );

  // Sundry Debtors (Customer Outstandings)
  let sundryDebtors = 0;
  customers.forEach((c) => {
    try {
      const ledger = db.getCustomerLedger(businessId, c.id);
      sundryDebtors += Math.max(0, ledger.totalOutstanding);
    } catch {
      // ignore
    }
  });

  // Closing Stock (Current inventory valuation at purchase cost)
  const closingStock = products.reduce(
    (sum, p) => sum + Math.max(0, p.stockQuantity) * (p.purchaseCost || 0),
    0
  );

  const totalAssets = cashInHand + bankBalance + upiBalance + sundryDebtors + closingStock;

  // 2. Liabilities
  let sundryCreditors = 0;
  suppliers.forEach((s) => {
    try {
      const ledger = db.getSupplierLedger(businessId, s.id);
      sundryCreditors += Math.max(0, ledger.totalPayable);
    } catch {
      // ignore
    }
  });
  const otherLiabilities = 0;
  const totalLiabilities = sundryCreditors + otherLiabilities;

  // 3. Equity
  // Cumulative net profit from beginning of time up to asOfDateMs
  const cumulativePL = calculateProfitAndLoss(businessId, 0, asOfDateMs);
  const retainedEarnings = cumulativePL.netProfit;

  // In double-entry: Assets = Liabilities + Equity
  // Equity = Capital + Retained Earnings => Capital = Total Assets - Total Liabilities - Retained Earnings
  // If zero transactions have happened, all are ₹0 and balanced.
  const explicitCapital = getAccountOpening('Capital Account');
  const balancingCapital = totalAssets - totalLiabilities - retainedEarnings;
  const ownersCapital = explicitCapital > 0 ? explicitCapital : Math.max(0, balancingCapital);

  const totalEquity = ownersCapital + retainedEarnings;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const discrepancy = Math.abs(totalAssets - totalLiabilitiesAndEquity);
  const isBalanced = discrepancy < 0.05;

  return {
    asOfDate: asOfDateMs,
    assets: {
      cashInHand,
      bankBalance,
      upiBalance,
      sundryDebtors,
      closingStock,
      totalAssets,
    },
    liabilities: {
      sundryCreditors,
      otherLiabilities,
      totalLiabilities,
    },
    equity: {
      ownersCapital,
      retainedEarnings,
      totalEquity,
    },
    totalLiabilitiesAndEquity,
    isBalanced,
    discrepancy,
  };
}

// -------------------------------------------------------------
// 3. Day Book
// -------------------------------------------------------------
export interface DayBookEntry {
  id: string;
  voucherNumber: string;
  voucherType: string;
  date: number;
  partyName: string;
  narration: string;
  paymentMode: string;
  inflow: number; // Receipts, Cash sales
  outflow: number; // Payments, Cash purchases
  totalAmount: number;
}

export interface DayBookReport {
  entries: DayBookEntry[];
  totalInflow: number;
  totalOutflow: number;
  totalVouchersCount: number;
  netCashFlow: number;
}

export function calculateDayBook(
  businessId: string,
  startMs: number = 0,
  endMs: number = Date.now()
): DayBookReport {
  const vouchers = db
    .getVouchers(businessId)
    .filter((v) => v.date >= startMs && v.date <= endMs)
    .sort((a, b) => b.date - a.date);

  let totalInflow = 0;
  let totalOutflow = 0;

  const entries: DayBookEntry[] = vouchers.map((v) => {
    let inflow = 0;
    let outflow = 0;
    let paymentMode = 'Cash';

    const cash = v.cashAmount || 0;
    const upi = v.upiAmount || 0;
    const bank = v.bankAmount || 0;
    const udhar = v.udharAmount || 0;

    const modes: string[] = [];
    if (cash > 0) modes.push(`Cash ₹${cash}`);
    if (upi > 0) modes.push(`UPI ₹${upi}`);
    if (bank > 0) modes.push(`Bank ₹${bank}`);
    if (udhar > 0) modes.push(`Udhar ₹${udhar}`);
    paymentMode = modes.length > 0 ? modes.join(' + ') : 'Credit';

    if (v.voucherType === 'SALES' || v.voucherType === 'SPLIT_PAYMENT') {
      inflow = cash + upi + bank;
    } else if (v.voucherType === 'RECEIPT') {
      inflow = v.totalAmount;
    } else if (v.voucherType === 'PURCHASE') {
      outflow = cash + bank;
    } else if (v.voucherType === 'PAYMENT') {
      outflow = v.totalAmount;
    }

    totalInflow += inflow;
    totalOutflow += outflow;

    return {
      id: v.id,
      voucherNumber: v.voucherNumber,
      voucherType: v.voucherType,
      date: v.date,
      partyName: v.partyName || 'General Counter',
      narration: v.remarks || `${v.voucherType} entry`,
      paymentMode,
      inflow,
      outflow,
      totalAmount: v.totalAmount,
    };
  });

  return {
    entries,
    totalInflow,
    totalOutflow,
    totalVouchersCount: entries.length,
    netCashFlow: totalInflow - totalOutflow,
  };
}

// -------------------------------------------------------------
// 4. Cash Book
// -------------------------------------------------------------
export interface CashBookEntry {
  id: string;
  voucherId?: string;
  voucherNumber?: string;
  voucherType?: string;
  date: number;
  particulars: string;
  partyName?: string;
  inflow: number;
  outflow: number;
  runningBalance: number;
}

export interface CashBookReport {
  openingBalance: number;
  closingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  entries: CashBookEntry[];
}

export function calculateCashBook(
  businessId: string,
  startMs: number = 0,
  endMs: number = Date.now()
): CashBookReport {
  const journals = db.getJournalEntries(businessId);
  const vouchers = db.getVouchers(businessId);
  const accounts = db.getLedgerAccounts(businessId);

  const cashAcc = accounts.find((a) => a.name.toLowerCase() === 'cash account');
  const baseOpening = cashAcc?.openingBalance || 0;

  // Filter journals strictly touching Cash Account
  const cashJournals = journals.filter((j) => j.accountName.toLowerCase() === 'cash account');

  // Calculate opening balance prior to startMs
  const priorJournals = cashJournals.filter((j) => j.date < startMs);
  const openingBalance =
    baseOpening + priorJournals.reduce((s, j) => s + (j.debit - j.credit), 0);

  // Period entries
  const periodJournals = cashJournals
    .filter((j) => j.date >= startMs && j.date <= endMs)
    .sort((a, b) => a.date - b.date);

  let runningBalance = openingBalance;
  let totalInflow = 0;
  let totalOutflow = 0;

  const entries: CashBookEntry[] = periodJournals.map((j) => {
    const v = j.voucherId ? vouchers.find((item) => item.id === j.voucherId) : null;
    const inflow = j.debit;
    const outflow = j.credit;
    runningBalance += inflow - outflow;
    totalInflow += inflow;
    totalOutflow += outflow;

    return {
      id: j.id,
      voucherId: j.voucherId,
      voucherNumber: v?.voucherNumber || 'JRN',
      voucherType: v?.voucherType || 'JOURNAL',
      date: j.date,
      particulars: j.narration || (inflow > 0 ? 'Cash Received' : 'Cash Paid'),
      partyName: v?.partyName,
      inflow,
      outflow,
      runningBalance,
    };
  });

  return {
    openingBalance: Math.max(0, openingBalance),
    closingBalance: Math.max(0, runningBalance),
    totalInflow,
    totalOutflow,
    entries: entries.reverse(), // latest first
  };
}

// -------------------------------------------------------------
// 5. Bank Book
// -------------------------------------------------------------
export interface BankBookEntry {
  id: string;
  voucherId?: string;
  voucherNumber?: string;
  voucherType?: string;
  date: number;
  particulars: string;
  partyName?: string;
  inflow: number;
  outflow: number;
  runningBalance: number;
}

export interface BankBookReport {
  openingBalance: number;
  closingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  entries: BankBookEntry[];
}

export function calculateBankBook(
  businessId: string,
  startMs: number = 0,
  endMs: number = Date.now()
): BankBookReport {
  const journals = db.getJournalEntries(businessId);
  const vouchers = db.getVouchers(businessId);
  const accounts = db.getLedgerAccounts(businessId);

  const bankAcc = accounts.find((a) => a.name.toLowerCase() === 'bank account');
  const baseOpening = bankAcc?.openingBalance || 0;

  const bankJournals = journals.filter((j) => j.accountName.toLowerCase() === 'bank account');

  const priorJournals = bankJournals.filter((j) => j.date < startMs);
  const openingBalance =
    baseOpening + priorJournals.reduce((s, j) => s + (j.debit - j.credit), 0);

  const periodJournals = bankJournals
    .filter((j) => j.date >= startMs && j.date <= endMs)
    .sort((a, b) => a.date - b.date);

  let runningBalance = openingBalance;
  let totalInflow = 0;
  let totalOutflow = 0;

  const entries: BankBookEntry[] = periodJournals.map((j) => {
    const v = j.voucherId ? vouchers.find((item) => item.id === j.voucherId) : null;
    const inflow = j.debit;
    const outflow = j.credit;
    runningBalance += inflow - outflow;
    totalInflow += inflow;
    totalOutflow += outflow;

    return {
      id: j.id,
      voucherId: j.voucherId,
      voucherNumber: v?.voucherNumber || 'BNK',
      voucherType: v?.voucherType || 'JOURNAL',
      date: j.date,
      particulars: j.narration || (inflow > 0 ? 'Bank Deposit / Credit' : 'Bank Payment / Debit'),
      partyName: v?.partyName,
      inflow,
      outflow,
      runningBalance,
    };
  });

  return {
    openingBalance: Math.max(0, openingBalance),
    closingBalance: Math.max(0, runningBalance),
    totalInflow,
    totalOutflow,
    entries: entries.reverse(),
  };
}

// -------------------------------------------------------------
// 6. Customer Outstanding Report
// -------------------------------------------------------------
export interface CustomerOutstandingRow {
  customerId: string;
  name: string;
  mobileNumber: string;
  openingBalance: number;
  totalInvoiced: number;
  totalReceived: number;
  outstandingBalance: number;
  lastInvoiceDate?: number;
}

export interface CustomerOutstandingReport {
  totalCustomers: number;
  customersWithDueCount: number;
  totalOutstandingDue: number;
  highestDueAmount: number;
  customers: CustomerOutstandingRow[];
}

export function calculateCustomerOutstandingReport(businessId: string): CustomerOutstandingReport {
  const customers = db.getCustomers(businessId);
  const vouchers = db.getVouchers(businessId);

  let totalOutstandingDue = 0;
  let highestDueAmount = 0;
  let customersWithDueCount = 0;

  const rows: CustomerOutstandingRow[] = customers.map((c) => {
    const ledger = db.getCustomerLedger(businessId, c.id);
    const customerVouchers = vouchers
      .filter((v) => v.partyId === c.id)
      .sort((a, b) => b.date - a.date);

    const due = Math.max(0, ledger.totalOutstanding);
    if (due > 0) {
      customersWithDueCount++;
      if (due > highestDueAmount) {
        highestDueAmount = due;
      }
    }
    totalOutstandingDue += due;

    return {
      customerId: c.id,
      name: c.name,
      mobileNumber: c.mobileNumber || '',
      openingBalance: c.openingBalance || 0,
      totalInvoiced: ledger.totalSales,
      totalReceived: ledger.totalReceived,
      outstandingBalance: due,
      lastInvoiceDate: customerVouchers[0]?.date,
    };
  });

  rows.sort((a, b) => b.outstandingBalance - a.outstandingBalance);

  return {
    totalCustomers: customers.length,
    customersWithDueCount,
    totalOutstandingDue,
    highestDueAmount,
    customers: rows,
  };
}

// -------------------------------------------------------------
// 7. Supplier Outstanding Report
// -------------------------------------------------------------
export interface SupplierOutstandingRow {
  supplierId: string;
  name: string;
  mobileNumber: string;
  openingBalance: number;
  totalPurchased: number;
  totalPaid: number;
  payableBalance: number;
  lastPurchaseDate?: number;
}

export interface SupplierOutstandingReport {
  totalSuppliers: number;
  suppliersWithPayableCount: number;
  totalPayableDue: number;
  highestPayableAmount: number;
  suppliers: SupplierOutstandingRow[];
}

export function calculateSupplierOutstandingReport(businessId: string): SupplierOutstandingReport {
  const suppliers = db.getSuppliers(businessId);
  const vouchers = db.getVouchers(businessId);

  let totalPayableDue = 0;
  let highestPayableAmount = 0;
  let suppliersWithPayableCount = 0;

  const rows: SupplierOutstandingRow[] = suppliers.map((s) => {
    const ledger = db.getSupplierLedger(businessId, s.id);
    const supplierVouchers = vouchers
      .filter((v) => v.partyId === s.id && v.voucherType === 'PURCHASE')
      .sort((a, b) => b.date - a.date);

    const payable = Math.max(0, ledger.totalPayable);
    if (payable > 0) {
      suppliersWithPayableCount++;
      if (payable > highestPayableAmount) {
        highestPayableAmount = payable;
      }
    }
    totalPayableDue += payable;

    return {
      supplierId: s.id,
      name: s.name,
      mobileNumber: s.mobileNumber || '',
      openingBalance: s.openingBalance || 0,
      totalPurchased: ledger.totalPurchases,
      totalPaid: ledger.totalPaid,
      payableBalance: payable,
      lastPurchaseDate: supplierVouchers[0]?.date,
    };
  });

  rows.sort((a, b) => b.payableBalance - a.payableBalance);

  return {
    totalSuppliers: suppliers.length,
    suppliersWithPayableCount,
    totalPayableDue,
    highestPayableAmount,
    suppliers: rows,
  };
}

// -------------------------------------------------------------
// 8. Sales Report
// -------------------------------------------------------------
export interface SalesReportRow {
  voucherId: string;
  voucherNumber: string;
  date: number;
  customerName: string;
  totalAmount: number;
  cashAmount: number;
  upiAmount: number;
  bankAmount: number;
  udharAmount: number;
  itemsCount: number;
  cogs: number;
  grossProfit: number;
  paymentMode: string;
}

export interface SalesReport {
  totalSales: number;
  totalInvoices: number;
  avgInvoiceValue: number;
  totalCashReceived: number;
  totalUpiReceived: number;
  totalBankReceived: number;
  totalUdharGiven: number;
  totalCogs: number;
  totalGrossProfit: number;
  rows: SalesReportRow[];
}

export function calculateSalesReport(
  businessId: string,
  startMs: number = 0,
  endMs: number = Date.now()
): SalesReport {
  const vouchers = db
    .getVouchers(businessId)
    .filter(
      (v) =>
        (v.voucherType === 'SALES' || v.voucherType === 'SPLIT_PAYMENT') &&
        v.date >= startMs &&
        v.date <= endMs
    )
    .sort((a, b) => b.date - a.date);

  let totalSales = 0;
  let totalCashReceived = 0;
  let totalUpiReceived = 0;
  let totalBankReceived = 0;
  let totalUdharGiven = 0;
  let totalCogs = 0;
  let totalGrossProfit = 0;

  const rows: SalesReportRow[] = vouchers.map((v) => {
    const items = db.getVoucherItems(v.id);
    const voucherCogs = items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.purchaseCostAtSale || 0),
      0
    );
    const grossProfit = v.totalAmount - voucherCogs;

    totalSales += v.totalAmount;
    totalCashReceived += v.cashAmount || 0;
    totalUpiReceived += v.upiAmount || 0;
    totalBankReceived += v.bankAmount || 0;
    totalUdharGiven += v.udharAmount || 0;
    totalCogs += voucherCogs;
    totalGrossProfit += grossProfit;

    const modes: string[] = [];
    if (v.cashAmount > 0) modes.push('Cash');
    if (v.upiAmount > 0) modes.push('UPI');
    if (v.bankAmount > 0) modes.push('Bank');
    if (v.udharAmount > 0) modes.push('Udhar');
    const paymentMode = modes.length > 0 ? modes.join(' + ') : 'Full Udhar';

    return {
      voucherId: v.id,
      voucherNumber: v.voucherNumber,
      date: v.date,
      customerName: v.partyName || 'Cash Customer',
      totalAmount: v.totalAmount,
      cashAmount: v.cashAmount || 0,
      upiAmount: v.upiAmount || 0,
      bankAmount: v.bankAmount || 0,
      udharAmount: v.udharAmount || 0,
      itemsCount: items.length,
      cogs: voucherCogs,
      grossProfit,
      paymentMode,
    };
  });

  return {
    totalSales,
    totalInvoices: rows.length,
    avgInvoiceValue: rows.length > 0 ? totalSales / rows.length : 0,
    totalCashReceived,
    totalUpiReceived,
    totalBankReceived,
    totalUdharGiven,
    totalCogs,
    totalGrossProfit,
    rows,
  };
}

// -------------------------------------------------------------
// 9. Purchase Report
// -------------------------------------------------------------
export interface PurchaseReportRow {
  voucherId: string;
  voucherNumber: string;
  date: number;
  supplierName: string;
  totalAmount: number;
  cashAmount: number;
  bankAmount: number;
  udharAmount: number;
  itemsCount: number;
  paymentMode: string;
}

export interface PurchaseReport {
  totalPurchases: number;
  totalBills: number;
  totalPaid: number;
  totalDue: number;
  rows: PurchaseReportRow[];
}

export function calculatePurchaseReport(
  businessId: string,
  startMs: number = 0,
  endMs: number = Date.now()
): PurchaseReport {
  const vouchers = db
    .getVouchers(businessId)
    .filter((v) => v.voucherType === 'PURCHASE' && v.date >= startMs && v.date <= endMs)
    .sort((a, b) => b.date - a.date);

  let totalPurchases = 0;
  let totalPaid = 0;
  let totalDue = 0;

  const rows: PurchaseReportRow[] = vouchers.map((v) => {
    const items = db.getVoucherItems(v.id);
    const paid = (v.cashAmount || 0) + (v.bankAmount || 0) + (v.upiAmount || 0);
    const due = v.udharAmount || Math.max(0, v.totalAmount - paid);

    totalPurchases += v.totalAmount;
    totalPaid += paid;
    totalDue += due;

    const modes: string[] = [];
    if (v.cashAmount > 0) modes.push('Cash');
    if (v.bankAmount > 0) modes.push('Bank');
    if (v.upiAmount > 0) modes.push('UPI');
    if (due > 0) modes.push('Credit / Due');
    const paymentMode = modes.length > 0 ? modes.join(' + ') : 'Full Credit';

    return {
      voucherId: v.id,
      voucherNumber: v.voucherNumber,
      date: v.date,
      supplierName: v.partyName || 'General Supplier',
      totalAmount: v.totalAmount,
      cashAmount: v.cashAmount || 0,
      bankAmount: v.bankAmount || 0,
      udharAmount: due,
      itemsCount: items.length,
      paymentMode,
    };
  });

  return {
    totalPurchases,
    totalBills: rows.length,
    totalPaid,
    totalDue,
    rows,
  };
}

// -------------------------------------------------------------
// 10. Expense Report
// -------------------------------------------------------------
export interface ExpenseCategorySummary {
  category: string;
  amount: number;
  percentage: number;
}

export interface ExpenseReportRow {
  id: string;
  date: number;
  category: string;
  narration: string;
  voucherNumber?: string;
  amount: number;
}

export interface ExpenseReport {
  totalExpenses: number;
  categories: ExpenseCategorySummary[];
  rows: ExpenseReportRow[];
}

export function calculateExpenseReport(
  businessId: string,
  startMs: number = 0,
  endMs: number = Date.now()
): ExpenseReport {
  const journals = db.getJournalEntries(businessId).filter((j) => j.date >= startMs && j.date <= endMs);
  const accounts = db.getLedgerAccounts(businessId);
  const vouchers = db.getVouchers(businessId);

  const expenseAccountNames = new Set(
    accounts
      .filter((a) => a.group === 'EXPENSE' && a.name.toLowerCase() !== 'cost of goods sold')
      .map((a) => a.name.toLowerCase())
  );

  const rows: ExpenseReportRow[] = [];
  const catMap: Record<string, number> = {};
  let totalExpenses = 0;

  journals.forEach((j) => {
    if (expenseAccountNames.has(j.accountName.toLowerCase())) {
      const net = j.debit - j.credit;
      if (net > 0) {
        totalExpenses += net;
        catMap[j.accountName] = (catMap[j.accountName] || 0) + net;
        const v = j.voucherId ? vouchers.find((item) => item.id === j.voucherId) : null;
        rows.push({
          id: j.id,
          date: j.date,
          category: j.accountName,
          narration: j.narration || `${j.accountName} payment`,
          voucherNumber: v?.voucherNumber,
          amount: net,
        });
      }
    }
  });

  rows.sort((a, b) => b.date - a.date);

  const categories: ExpenseCategorySummary[] = Object.entries(catMap).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
  }));

  categories.sort((a, b) => b.amount - a.amount);

  return {
    totalExpenses,
    categories,
    rows,
  };
}

// -------------------------------------------------------------
// 11. Stock Summary
// -------------------------------------------------------------
export interface StockSummaryItem {
  productId: string;
  name: string;
  sku: string;
  unit: string;
  category: string;
  currentStock: number;
  purchaseCost: number;
  sellingPrice: number;
  stockValue: number; // At cost
  potentialSalesValue: number; // At selling price
  potentialMargin: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface StockSummaryReport {
  totalProducts: number;
  totalStockUnits: number;
  totalStockValue: number;
  totalPotentialSalesValue: number;
  totalPotentialGrossProfit: number;
  items: StockSummaryItem[];
}

export function calculateStockSummaryReport(businessId: string): StockSummaryReport {
  const products = db.getProducts(businessId);

  let totalStockUnits = 0;
  let totalStockValue = 0;
  let totalPotentialSalesValue = 0;

  const items: StockSummaryItem[] = products.map((p) => {
    const qty = Math.max(0, p.stockQuantity);
    const cost = p.purchaseCost || 0;
    const price = p.sellingPrice || 0;
    const value = qty * cost;
    const retail = qty * price;
    const margin = retail - value;

    totalStockUnits += qty;
    totalStockValue += value;
    totalPotentialSalesValue += retail;

    let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
    if (qty <= 0) {
      status = 'OUT_OF_STOCK';
    } else if (p.minStockLevel && qty <= p.minStockLevel) {
      status = 'LOW_STOCK';
    }

    return {
      productId: p.id,
      name: p.name,
      sku: p.sku || 'N/A',
      unit: p.unit,
      category: p.category || 'General',
      currentStock: p.stockQuantity,
      purchaseCost: cost,
      sellingPrice: price,
      stockValue: value,
      potentialSalesValue: retail,
      potentialMargin: margin,
      status,
    };
  });

  items.sort((a, b) => b.stockValue - a.stockValue);

  return {
    totalProducts: products.length,
    totalStockUnits,
    totalStockValue,
    totalPotentialSalesValue,
    totalPotentialGrossProfit: totalPotentialSalesValue - totalStockValue,
    items,
  };
}

// -------------------------------------------------------------
// 12. Stock Movement Report
// -------------------------------------------------------------
export interface StockMovementReport {
  totalMovements: number;
  totalInwardUnits: number;
  totalOutwardUnits: number;
  movements: StockMovement[];
}

export function calculateStockMovementReport(
  businessId: string,
  startMs: number = 0,
  endMs: number = Date.now()
): StockMovementReport {
  const movements = db
    .getStockMovements(businessId)
    .filter((m) => m.date >= startMs && m.date <= endMs)
    .sort((a, b) => b.date - a.date);

  let totalInwardUnits = 0;
  let totalOutwardUnits = 0;

  movements.forEach((m) => {
    if (m.type === 'IN' || m.type === 'PURCHASE' || m.type === 'OPENING') {
      totalInwardUnits += m.quantity;
    } else if (m.type === 'OUT' || m.type === 'SALE') {
      totalOutwardUnits += m.quantity;
    }
  });

  return {
    totalMovements: movements.length,
    totalInwardUnits,
    totalOutwardUnits,
    movements,
  };
}

// -------------------------------------------------------------
// 13. Low Stock Report
// -------------------------------------------------------------
export interface LowStockItem {
  productId: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  shortageUnits: number;
  purchaseCost: number;
  estimatedReorderCost: number;
  status: 'OUT_OF_STOCK' | 'LOW_STOCK';
}

export interface LowStockReport {
  lowStockCount: number;
  outOfStockCount: number;
  totalEstimatedReorderCost: number;
  items: LowStockItem[];
}

export function calculateLowStockReport(businessId: string): LowStockReport {
  const products = db.getProducts(businessId);

  let outOfStockCount = 0;
  let lowStockCount = 0;
  let totalEstimatedReorderCost = 0;

  const items: LowStockItem[] = [];

  products.forEach((p) => {
    const minLevel = p.minStockLevel || 5; // Default safety threshold 5 if not set
    const current = p.stockQuantity || 0;

    if (current <= minLevel || current <= 0) {
      const isOut = current <= 0;
      if (isOut) {
        outOfStockCount++;
      } else {
        lowStockCount++;
      }

      // Shortage to bring up to at least minLevel + safety buffer (e.g. 10 units or minLevel)
      const targetLevel = Math.max(minLevel * 2, 10);
      const shortage = Math.max(0, targetLevel - current);
      const cost = p.purchaseCost || 0;
      const estimatedCost = shortage * cost;
      totalEstimatedReorderCost += estimatedCost;

      items.push({
        productId: p.id,
        name: p.name,
        category: p.category || 'General',
        unit: p.unit,
        currentStock: current,
        minStockLevel: minLevel,
        shortageUnits: shortage,
        purchaseCost: cost,
        estimatedReorderCost: estimatedCost,
        status: isOut ? 'OUT_OF_STOCK' : 'LOW_STOCK',
      });
    }
  });

  // Sort out-of-stock first, then highest deficit
  items.sort((a, b) => {
    if (a.status === 'OUT_OF_STOCK' && b.status !== 'OUT_OF_STOCK') return -1;
    if (a.status !== 'OUT_OF_STOCK' && b.status === 'OUT_OF_STOCK') return 1;
    return b.shortageUnits - a.shortageUnits;
  });

  return {
    lowStockCount,
    outOfStockCount,
    totalEstimatedReorderCost,
    items,
  };
}
