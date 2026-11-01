import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Scale,
  BookOpen,
  Wallet,
  Landmark,
  Users,
  Truck,
  Receipt,
  ShoppingBag,
  FileSpreadsheet,
  Boxes,
  Activity,
  AlertTriangle,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  PlusCircle,
  Info,
  Clock,
} from 'lucide-react';
import { Business, ReportType, DateRangeFilter } from '../../types';
import { db } from '../../services/db';
import {
  getDateRangeBounds,
  calculateProfitAndLoss,
  calculateBalanceSheet,
  calculateDayBook,
  calculateCashBook,
  calculateBankBook,
  calculateCustomerOutstandingReport,
  calculateSupplierOutstandingReport,
  calculateSalesReport,
  calculatePurchaseReport,
  calculateExpenseReport,
  calculateStockSummaryReport,
  calculateStockMovementReport,
  calculateLowStockReport,
  ProfitAndLossReport,
  BalanceSheetReport,
  DayBookReport,
  CashBookReport,
  BankBookReport,
  CustomerOutstandingReport,
  SupplierOutstandingReport,
  SalesReport,
  PurchaseReport,
  ExpenseReport,
  StockSummaryReport,
  StockMovementReport,
  LowStockReport,
} from '../../services/reports';

interface ReportsScreenProps {
  activeBusiness: Business;
  initialReportType?: ReportType;
  onNavigateBack: () => void;
  onNavigateToCustomerLedger?: (customerId: string) => void;
  onNavigateToSupplierLedger?: (supplierId: string) => void;
  onNavigateToPurchase?: () => void;
  onNavigateToReceipt?: (customerId?: string) => void;
  onNavigateToPayment?: (supplierId?: string) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  activeBusiness,
  initialReportType,
  onNavigateBack,
  onNavigateToCustomerLedger,
  onNavigateToSupplierLedger,
  onNavigateToPurchase,
  onNavigateToReceipt,
  onNavigateToPayment,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(
    initialReportType || null
  );
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Report computation states
  const [plData, setPlData] = useState<ProfitAndLossReport | null>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetReport | null>(null);
  const [dayBookData, setDayBookData] = useState<DayBookReport | null>(null);
  const [cashBookData, setCashBookData] = useState<CashBookReport | null>(null);
  const [bankBookData, setBankBookData] = useState<BankBookReport | null>(null);
  const [customerOutstandingData, setCustomerOutstandingData] =
    useState<CustomerOutstandingReport | null>(null);
  const [supplierOutstandingData, setSupplierOutstandingData] =
    useState<SupplierOutstandingReport | null>(null);
  const [salesReportData, setSalesReportData] = useState<SalesReport | null>(null);
  const [purchaseReportData, setPurchaseReportData] = useState<PurchaseReport | null>(null);
  const [expenseReportData, setExpenseReportData] = useState<ExpenseReport | null>(null);
  const [stockSummaryData, setStockSummaryData] = useState<StockSummaryReport | null>(null);
  const [stockMovementData, setStockMovementData] = useState<StockMovementReport | null>(null);
  const [lowStockData, setLowStockData] = useState<LowStockReport | null>(null);

  // Recalculate reports when business, selectedReport, or dateFilter changes
  const refreshReports = () => {
    const bounds = getDateRangeBounds(dateFilter, customStartDate, customEndDate);

    if (selectedReport === 'PROFIT_LOSS' || !selectedReport) {
      setPlData(calculateProfitAndLoss(activeBusiness.id, bounds.startMs, bounds.endMs));
    }
    if (selectedReport === 'BALANCE_SHEET' || !selectedReport) {
      setBalanceSheetData(calculateBalanceSheet(activeBusiness.id, bounds.endMs));
    }
    if (selectedReport === 'DAY_BOOK' || !selectedReport) {
      setDayBookData(calculateDayBook(activeBusiness.id, bounds.startMs, bounds.endMs));
    }
    if (selectedReport === 'CASH_BOOK' || !selectedReport) {
      setCashBookData(calculateCashBook(activeBusiness.id, bounds.startMs, bounds.endMs));
    }
    if (selectedReport === 'BANK_BOOK' || !selectedReport) {
      setBankBookData(calculateBankBook(activeBusiness.id, bounds.startMs, bounds.endMs));
    }
    if (selectedReport === 'CUSTOMER_OUTSTANDING' || !selectedReport) {
      setCustomerOutstandingData(calculateCustomerOutstandingReport(activeBusiness.id));
    }
    if (selectedReport === 'SUPPLIER_OUTSTANDING' || !selectedReport) {
      setSupplierOutstandingData(calculateSupplierOutstandingReport(activeBusiness.id));
    }
    if (selectedReport === 'SALES_REPORT' || !selectedReport) {
      setSalesReportData(calculateSalesReport(activeBusiness.id, bounds.startMs, bounds.endMs));
    }
    if (selectedReport === 'PURCHASE_REPORT' || !selectedReport) {
      setPurchaseReportData(calculatePurchaseReport(activeBusiness.id, bounds.startMs, bounds.endMs));
    }
    if (selectedReport === 'EXPENSE_REPORT' || !selectedReport) {
      setExpenseReportData(calculateExpenseReport(activeBusiness.id, bounds.startMs, bounds.endMs));
    }
    if (selectedReport === 'STOCK_SUMMARY' || !selectedReport) {
      setStockSummaryData(calculateStockSummaryReport(activeBusiness.id));
    }
    if (selectedReport === 'STOCK_MOVEMENT' || !selectedReport) {
      setStockMovementData(calculateStockMovementReport(activeBusiness.id, bounds.startMs, bounds.endMs));
    }
    if (selectedReport === 'LOW_STOCK' || !selectedReport) {
      setLowStockData(calculateLowStockReport(activeBusiness.id));
    }
  };

  useEffect(() => {
    refreshReports();
    const unsub = db.subscribe(() => {
      refreshReports();
    });
    return () => unsub();
  }, [activeBusiness.id, selectedReport, dateFilter, customStartDate, customEndDate]);

  const formatCurrency = (amt: number) => {
    return `₹${Math.round(amt).toLocaleString('en-IN')}`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Date filter selector bar
  const renderDateFilterBar = () => {
    const filters: { id: DateRangeFilter; label: string }[] = [
      { id: 'TODAY', label: 'Today' },
      { id: 'YESTERDAY', label: 'Yesterday' },
      { id: 'THIS_WEEK', label: 'This Week' },
      { id: 'THIS_MONTH', label: 'This Month' },
      { id: 'PREVIOUS_MONTH', label: 'Prev Month' },
      { id: 'CUSTOM', label: 'Custom' },
    ];

    return (
      <div className="bg-white border-b border-slate-200 px-4 py-2 shrink-0 shadow-2xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setDateFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                dateFilter === f.id
                  ? 'bg-[#0F4D32] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {dateFilter === 'CUSTOM' && (
          <div className="flex items-center space-x-2 pt-2 pb-1 text-xs">
            <div className="flex-1 flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span className="text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent text-slate-800 focus:outline-hidden text-xs w-full"
              />
            </div>
            <div className="flex-1 flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span className="text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent text-slate-800 focus:outline-hidden text-xs w-full"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // ------------------------------------------------------------------
  // 1. HUB VIEW: 13 Reports Directory
  // ------------------------------------------------------------------
  if (!selectedReport) {
    const reportCategories = [
      {
        title: 'Financial Statements',
        description: 'Core accounting balance & profitability records',
        reports: [
          {
            id: 'PROFIT_LOSS' as ReportType,
            name: 'Profit & Loss Statement',
            desc: 'Net Sales, COGS, Operating Expenses & Net Profit',
            icon: TrendingUp,
            badge: plData ? formatCurrency(plData.netProfit) : '₹0',
            badgeColor: (plData?.netProfit || 0) >= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50',
          },
          {
            id: 'BALANCE_SHEET' as ReportType,
            name: 'Balance Sheet',
            desc: 'Assets, Liabilities & Owner Equity (Double-Entry)',
            icon: Scale,
            badge: balanceSheetData?.isBalanced ? 'Balanced' : 'Checked',
            badgeColor: 'text-[#0F4D32] bg-emerald-50',
          },
        ],
      },
      {
        title: 'Cash & Banking',
        description: 'Real-time liquidity and daily cash flow ledgers',
        reports: [
          {
            id: 'DAY_BOOK' as ReportType,
            name: 'Day Book',
            desc: 'Chronological register of all voucher entries',
            icon: BookOpen,
            badge: `${dayBookData?.totalVouchersCount || 0} entries`,
            badgeColor: 'text-slate-700 bg-slate-100',
          },
          {
            id: 'CASH_BOOK' as ReportType,
            name: 'Cash Book',
            desc: 'Strictly cash inflows, outflows & closing cash',
            icon: Wallet,
            badge: cashBookData ? formatCurrency(cashBookData.closingBalance) : '₹0',
            badgeColor: 'text-emerald-700 bg-emerald-50',
          },
          {
            id: 'BANK_BOOK' as ReportType,
            name: 'Bank Book',
            desc: 'Bank account deposits, withdrawals & ledger balance',
            icon: Landmark,
            badge: bankBookData ? formatCurrency(bankBookData.closingBalance) : '₹0',
            badgeColor: 'text-blue-700 bg-blue-50',
          },
        ],
      },
      {
        title: 'Party Outstandings',
        description: 'Accounts receivable & payable balances',
        reports: [
          {
            id: 'CUSTOMER_OUTSTANDING' as ReportType,
            name: 'Customer Outstanding Report',
            desc: 'Debtors list, pending Udhar & direct receipt collection',
            icon: Users,
            badge: customerOutstandingData ? formatCurrency(customerOutstandingData.totalOutstandingDue) : '₹0',
            badgeColor: 'text-amber-700 bg-amber-50',
          },
          {
            id: 'SUPPLIER_OUTSTANDING' as ReportType,
            name: 'Supplier Outstanding Report',
            desc: 'Creditors list, payable dues & direct bill payments',
            icon: Truck,
            badge: supplierOutstandingData ? formatCurrency(supplierOutstandingData.totalPayableDue) : '₹0',
            badgeColor: 'text-red-700 bg-red-50',
          },
        ],
      },
      {
        title: 'Transaction Registers',
        description: 'Detailed purchase, sales & expense audit books',
        reports: [
          {
            id: 'SALES_REPORT' as ReportType,
            name: 'Sales Report',
            desc: 'Sales register, invoices, bill total & profit margin',
            icon: Receipt,
            badge: salesReportData ? formatCurrency(salesReportData.totalSales) : '₹0',
            badgeColor: 'text-emerald-700 bg-emerald-50',
          },
          {
            id: 'PURCHASE_REPORT' as ReportType,
            name: 'Purchase Report',
            desc: 'Inward purchase bills, paid amounts & supplier credit',
            icon: ShoppingBag,
            badge: purchaseReportData ? formatCurrency(purchaseReportData.totalPurchases) : '₹0',
            badgeColor: 'text-indigo-700 bg-indigo-50',
          },
          {
            id: 'EXPENSE_REPORT' as ReportType,
            name: 'Expense Report',
            desc: 'Categorized business expenditures & overhead breakdown',
            icon: FileSpreadsheet,
            badge: expenseReportData ? formatCurrency(expenseReportData.totalExpenses) : '₹0',
            badgeColor: 'text-rose-700 bg-rose-50',
          },
        ],
      },
      {
        title: 'Inventory Reports',
        description: 'Stock valuation, inward/outward movements & low stock',
        reports: [
          {
            id: 'STOCK_SUMMARY' as ReportType,
            name: 'Stock Summary',
            desc: 'Product-wise stock valuation at purchase cost',
            icon: Boxes,
            badge: stockSummaryData ? formatCurrency(stockSummaryData.totalStockValue) : '₹0',
            badgeColor: 'text-emerald-700 bg-emerald-50',
          },
          {
            id: 'STOCK_MOVEMENT' as ReportType,
            name: 'Stock Movement Report',
            desc: 'Audit trail of inward, outward & stock adjustments',
            icon: Activity,
            badge: `${stockMovementData?.totalMovements || 0} moves`,
            badgeColor: 'text-slate-700 bg-slate-100',
          },
          {
            id: 'LOW_STOCK' as ReportType,
            name: 'Low Stock Report',
            desc: 'Items needing urgent reordering & shortage deficit',
            icon: AlertTriangle,
            badge: lowStockData ? `${lowStockData.lowStockCount + lowStockData.outOfStockCount} items` : '0',
            badgeColor: (lowStockData?.outOfStockCount || 0) > 0 ? 'text-red-700 bg-red-50' : 'text-slate-600 bg-slate-100',
          },
        ],
      },
    ];

    return (
      <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
        {/* Dark Green Native Header */}
        <div className="bg-[#0F4D32] text-white px-4 pt-3 pb-3 shrink-0 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onNavigateBack}
              className="p-1.5 -ml-1.5 hover:bg-white/10 rounded-lg active:scale-95 transition-all text-white"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 mr-1 inline" />
              <span className="font-semibold text-sm">Back</span>
            </button>
            <div className="ml-1">
              <h1 className="font-bold text-sm tracking-wide leading-tight">Reports & Statements</h1>
              <p className="text-[10px] text-white/70">{activeBusiness.businessName}</p>
            </div>
          </div>
          <div className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-medium tracking-wide">
            13 Reports
          </div>
        </div>

        {/* Global Date Filter for Hub preview metrics */}
        {renderDateFilterBar()}

        {/* Reports Directory Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {reportCategories.map((cat, idx) => (
            <div key={idx} className="space-y-2">
              <div className="px-1 flex items-baseline justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  {cat.title}
                </h3>
                <span className="text-[10px] text-slate-400">{cat.reports.length} reports</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
                {cat.reports.map((rep) => {
                  const Icon = rep.icon;
                  return (
                    <button
                      key={rep.id}
                      onClick={() => setSelectedReport(rep.id)}
                      className="w-full px-3.5 py-3 flex items-center justify-between hover:bg-[#F2F8F4] active:bg-[#E8F2EC] transition-all text-left group"
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className="w-9 h-9 rounded-xl bg-[#F2F8F4] text-[#0F4D32] flex items-center justify-center shrink-0 border border-[#0F4D32]/10 group-hover:scale-105 transition-transform">
                          <Icon className="w-5 h-5 text-black stroke-[1.8px]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {rep.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate leading-snug">
                            {rep.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span
                          className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md ${rep.badgeColor}`}
                        >
                          {rep.badge}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4D32] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 2. REPORT DETAIL VIEW (When an individual report is active)
  // ------------------------------------------------------------------
  const bounds = getDateRangeBounds(dateFilter, customStartDate, customEndDate);

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
      {/* Dark Green Native Header */}
      <div className="bg-[#0F4D32] text-white px-4 pt-3 pb-3 shrink-0 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedReport(null)}
            className="p-1.5 -ml-1.5 hover:bg-white/10 rounded-lg active:scale-95 transition-all text-white"
            title="Back to Reports Hub"
          >
            <ArrowLeft className="w-5 h-5 mr-1 inline" />
            <span className="font-semibold text-sm">Reports</span>
          </button>
          <div className="ml-1">
            <h1 className="font-bold text-sm tracking-wide leading-tight">
              {selectedReport === 'PROFIT_LOSS' && 'Profit & Loss Statement'}
              {selectedReport === 'BALANCE_SHEET' && 'Balance Sheet'}
              {selectedReport === 'DAY_BOOK' && 'Day Book'}
              {selectedReport === 'CASH_BOOK' && 'Cash Book'}
              {selectedReport === 'BANK_BOOK' && 'Bank Book'}
              {selectedReport === 'CUSTOMER_OUTSTANDING' && 'Customer Outstanding'}
              {selectedReport === 'SUPPLIER_OUTSTANDING' && 'Supplier Outstanding'}
              {selectedReport === 'SALES_REPORT' && 'Sales Register'}
              {selectedReport === 'PURCHASE_REPORT' && 'Purchase Register'}
              {selectedReport === 'EXPENSE_REPORT' && 'Expense Report'}
              {selectedReport === 'STOCK_SUMMARY' && 'Stock Summary'}
              {selectedReport === 'STOCK_MOVEMENT' && 'Stock Movement'}
              {selectedReport === 'LOW_STOCK' && 'Low Stock Alerts'}
            </h1>
            <p className="text-[10px] text-white/70">
              {activeBusiness.businessName} • {bounds.label}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => refreshReports()}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/90 active:scale-90 transition-all"
            title="Refresh"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Filter Bar (applicable to period reports) */}
      {selectedReport !== 'CUSTOMER_OUTSTANDING' &&
        selectedReport !== 'SUPPLIER_OUTSTANDING' &&
        selectedReport !== 'STOCK_SUMMARY' &&
        selectedReport !== 'LOW_STOCK' &&
        renderDateFilterBar()}

      {/* Report Screen Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ============================================================== */}
        {/* 1. PROFIT & LOSS STATEMENT                                     */}
        {/* ============================================================== */}
        {selectedReport === 'PROFIT_LOSS' && plData && (
          <div className="space-y-4">
            {/* Top Net Profit Summary Card */}
            <div
              className={`rounded-2xl p-4 text-white shadow-xs ${
                plData.netProfit >= 0 ? 'bg-[#0F4D32]' : 'bg-red-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>Net Financial Profit / (Loss)</span>
                <span className="font-semibold bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                  {bounds.label}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div className="text-2xl font-black tracking-tight">
                  {formatCurrency(plData.netProfit)}
                </div>
                <div className="text-xs font-semibold text-white/90">
                  Margin: {plData.netProfitMarginPercent.toFixed(1)}%
                </div>
              </div>
              <p className="text-[11px] text-white/75 mt-1">
                Net Profit = Gross Profit (Net Sales - COGS) + Other Income - Operating Expenses.
              </p>
            </div>

            {/* Trading Account Section: Sales & COGS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  1. Trading Account (Gross Profit)
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  GP: {formatCurrency(plData.grossProfit)} ({plData.grossMarginPercent.toFixed(1)}%)
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Gross Sales</span>
                  <span className="font-semibold">{formatCurrency(plData.grossSales)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Less: Sales Returns (Credit Notes)</span>
                  <span className="font-semibold">(-) {formatCurrency(plData.salesReturns)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-900 font-bold bg-[#F2F8F4] px-2.5 py-1.5 rounded-lg border border-[#0F4D32]/10">
                  <span>Net Sales Revenue</span>
                  <span>{formatCurrency(plData.netSales)}</span>
                </div>
                <div className="flex justify-between items-center text-red-700">
                  <span>Less: Cost of Goods Sold (COGS snapshot)</span>
                  <span className="font-semibold">(-) {formatCurrency(plData.cogs)}</span>
                </div>
                <div className="flex justify-between items-center text-[#0F4D32] font-black text-sm pt-1 border-t border-slate-100">
                  <span>Gross Profit</span>
                  <span>{formatCurrency(plData.grossProfit)}</span>
                </div>
              </div>
            </div>

            {/* Operating Expenses & Other Income */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  2. Indirect Expenses & Other Income
                </span>
                <span className="text-xs font-bold text-slate-700">
                  Total Overhead: {formatCurrency(plData.totalExpenses)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {plData.operatingExpenses.length === 0 ? (
                  <div className="text-slate-400 py-2 text-center text-[11px]">
                    No operating expenses recorded in this period (₹0).
                  </div>
                ) : (
                  plData.operatingExpenses.map((exp, i) => (
                    <div key={i} className="flex justify-between items-center text-slate-600">
                      <span>{exp.name}</span>
                      <span className="font-medium text-slate-800">{formatCurrency(exp.amount)}</span>
                    </div>
                  ))
                )}

                <div className="flex justify-between items-center text-slate-900 font-semibold pt-1 border-t border-slate-100">
                  <span>Total Operating Expenses</span>
                  <span className="text-red-700">(-) {formatCurrency(plData.totalExpenses)}</span>
                </div>

                {plData.otherIncome > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>Other Income</span>
                    <span>(+) {formatCurrency(plData.otherIncome)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Final Accounting Summary */}
            <div className="bg-white rounded-2xl border-2 border-[#0F4D32]/30 p-4 shadow-xs">
              <div className="flex justify-between items-center text-slate-900 font-bold text-sm">
                <span>Final Net Profit / Loss</span>
                <span
                  className={
                    plData.netProfit >= 0 ? 'text-[#0F4D32] text-base' : 'text-red-700 text-base'
                  }
                >
                  {formatCurrency(plData.netProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>Net Margin</span>
                <span>{plData.netProfitMarginPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. BALANCE SHEET                                               */}
        {/* ============================================================== */}
        {selectedReport === 'BALANCE_SHEET' && balanceSheetData && (
          <div className="space-y-4">
            {/* Double Entry Balance Verification Banner */}
            <div
              className={`rounded-2xl p-4 border shadow-xs ${
                balanceSheetData.isBalanced
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-[#0F4D32] shrink-0" />
                <div className="font-bold text-xs sm:text-sm">
                  {balanceSheetData.isBalanced
                    ? 'Double-Entry Accounting Verified: Balanced!'
                    : 'Balance Sheet Discrepancy Detected'}
                </div>
              </div>
              <p className="text-[11px] mt-1 text-slate-600">
                Total Assets ({formatCurrency(balanceSheetData.assets.totalAssets)}) = Total
                Liabilities & Equity ({formatCurrency(balanceSheetData.totalLiabilitiesAndEquity)})
              </p>
            </div>

            {/* Assets Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0F4D32]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    ASSETS (Properties & Receivables)
                  </span>
                </div>
                <span className="text-xs font-bold text-[#0F4D32]">
                  {formatCurrency(balanceSheetData.assets.totalAssets)}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span>Cash-in-Hand (Cash Account)</span>
                  <span className="font-semibold">
                    {formatCurrency(balanceSheetData.assets.cashInHand)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Bank Balance (Bank Account)</span>
                  <span className="font-semibold">
                    {formatCurrency(balanceSheetData.assets.bankBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>UPI / Digital Wallets</span>
                  <span className="font-semibold">
                    {formatCurrency(balanceSheetData.assets.upiBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Sundry Debtors (Customer Outstandings)</span>
                  <span className="font-semibold text-amber-700">
                    {formatCurrency(balanceSheetData.assets.sundryDebtors)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Closing Inventory (Valued at Cost)</span>
                  <span className="font-semibold text-indigo-700">
                    {formatCurrency(balanceSheetData.assets.closingStock)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-black text-slate-900 bg-[#F2F8F4] px-2.5 py-1.5 rounded-lg border border-[#0F4D32]/10">
                  <span>Total Assets</span>
                  <span className="text-[#0F4D32]">
                    {formatCurrency(balanceSheetData.assets.totalAssets)}
                  </span>
                </div>
              </div>
            </div>

            {/* Liabilities & Equity Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    LIABILITIES & OWNER EQUITY
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {formatCurrency(balanceSheetData.totalLiabilitiesAndEquity)}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Liabilities (Current Dues)
                </div>
                <div className="flex justify-between items-center text-slate-700 pl-2">
                  <span>Sundry Creditors (Supplier Payables)</span>
                  <span className="font-semibold text-red-700">
                    {formatCurrency(balanceSheetData.liabilities.sundryCreditors)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pl-2 font-medium">
                  <span>Total Liabilities</span>
                  <span>{formatCurrency(balanceSheetData.liabilities.totalLiabilities)}</span>
                </div>

                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide pt-2 border-t border-slate-100">
                  Capital & Retained Earnings
                </div>
                <div className="flex justify-between items-center text-slate-700 pl-2">
                  <span>Owner's Capital Account</span>
                  <span className="font-semibold">
                    {formatCurrency(balanceSheetData.equity.ownersCapital)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700 pl-2">
                  <span>Retained Earnings / Cumulative Net Profit</span>
                  <span
                    className={
                      balanceSheetData.equity.retainedEarnings >= 0
                        ? 'font-semibold text-emerald-700'
                        : 'font-semibold text-red-700'
                    }
                  >
                    {formatCurrency(balanceSheetData.equity.retainedEarnings)}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-black text-slate-900 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span>Total Liabilities & Equity</span>
                  <span>{formatCurrency(balanceSheetData.totalLiabilitiesAndEquity)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. DAY BOOK                                                    */}
        {/* ============================================================== */}
        {selectedReport === 'DAY_BOOK' && dayBookData && (
          <div className="space-y-3">
            {/* Day Book Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] text-slate-500 font-semibold block">Total Inflow</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-700">
                  {formatCurrency(dayBookData.totalInflow)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] text-slate-500 font-semibold block">Total Outflow</span>
                <span className="text-xs sm:text-sm font-bold text-red-700">
                  {formatCurrency(dayBookData.totalOutflow)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] text-slate-500 font-semibold block">Net Cashflow</span>
                <span
                  className={`text-xs sm:text-sm font-bold ${
                    dayBookData.netCashFlow >= 0 ? 'text-[#0F4D32]' : 'text-red-700'
                  }`}
                >
                  {formatCurrency(dayBookData.netCashFlow)}
                </span>
              </div>
            </div>

            {/* Entries List */}
            {dayBookData.entries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-2xs">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No Day Book entries in this period</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  New sales, purchases, receipts and payments will automatically appear here.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {dayBookData.entries.map((item) => (
                  <div key={item.id} className="p-3 text-xs flex items-center justify-between">
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900">{item.voucherNumber}</span>
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                          {item.voucherType}
                        </span>
                      </div>
                      <p className="text-slate-600 truncate">{item.partyName}</p>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(item.date)} • {item.paymentMode}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatCurrency(item.totalAmount)}
                      </div>
                      {item.inflow > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-700 block">
                          + {formatCurrency(item.inflow)} Inflow
                        </span>
                      )}
                      {item.outflow > 0 && (
                        <span className="text-[10px] font-semibold text-red-700 block">
                          - {formatCurrency(item.outflow)} Outflow
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. CASH BOOK                                                   */}
        {/* ============================================================== */}
        {selectedReport === 'CASH_BOOK' && cashBookData && (
          <div className="space-y-3">
            {/* Opening & Closing Summary Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Opening Cash</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatCurrency(cashBookData.openingBalance)}
                </span>
              </div>
              <div className="bg-[#F2F8F4] p-3 rounded-2xl border border-[#0F4D32]/20 shadow-2xs">
                <span className="text-[10px] text-[#0F4D32] font-semibold block">Closing Cash</span>
                <span className="text-sm font-black text-[#0F4D32]">
                  {formatCurrency(cashBookData.closingBalance)}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
              <div className="px-3.5 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Cash Movement ({cashBookData.entries.length} items)</span>
                <span>Inflow / Outflow</span>
              </div>

              {cashBookData.entries.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No cash transactions recorded in this period.
                </div>
              ) : (
                cashBookData.entries.map((entry) => (
                  <div key={entry.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{entry.particulars}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateTime(entry.date)} • {entry.voucherNumber}
                        {entry.partyName ? ` • ${entry.partyName}` : ''}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Balance after: {formatCurrency(entry.runningBalance)}
                      </div>
                    </div>

                    <div className="text-right">
                      {entry.inflow > 0 && (
                        <span className="font-bold text-emerald-700 text-sm block">
                          + {formatCurrency(entry.inflow)}
                        </span>
                      )}
                      {entry.outflow > 0 && (
                        <span className="font-bold text-red-700 text-sm block">
                          - {formatCurrency(entry.outflow)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. BANK BOOK                                                   */}
        {/* ============================================================== */}
        {selectedReport === 'BANK_BOOK' && bankBookData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Opening Bank</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatCurrency(bankBookData.openingBalance)}
                </span>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 shadow-2xs">
                <span className="text-[10px] text-blue-700 font-semibold block">Closing Bank</span>
                <span className="text-sm font-black text-blue-800">
                  {formatCurrency(bankBookData.closingBalance)}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
              <div className="px-3.5 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Bank Statements ({bankBookData.entries.length} items)</span>
                <span>Credits / Debits</span>
              </div>

              {bankBookData.entries.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No bank entries recorded in this period.
                </div>
              ) : (
                bankBookData.entries.map((entry) => (
                  <div key={entry.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{entry.particulars}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateTime(entry.date)} • {entry.voucherNumber}
                        {entry.partyName ? ` • ${entry.partyName}` : ''}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        Balance after: {formatCurrency(entry.runningBalance)}
                      </div>
                    </div>

                    <div className="text-right">
                      {entry.inflow > 0 && (
                        <span className="font-bold text-emerald-700 text-sm block">
                          + {formatCurrency(entry.inflow)}
                        </span>
                      )}
                      {entry.outflow > 0 && (
                        <span className="font-bold text-red-700 text-sm block">
                          - {formatCurrency(entry.outflow)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 6. CUSTOMER OUTSTANDING REPORT                                */}
        {/* ============================================================== */}
        {selectedReport === 'CUSTOMER_OUTSTANDING' && customerOutstandingData && (
          <div className="space-y-3">
            {/* Outstanding Summary Cards */}
            <div className="bg-[#0F4D32] rounded-2xl p-4 text-white shadow-xs">
              <span className="text-xs text-white/80 block">Total Customer Udhar (Receivables)</span>
              <div className="text-2xl font-black mt-1">
                {formatCurrency(customerOutstandingData.totalOutstandingDue)}
              </div>
              <div className="flex justify-between items-center text-[11px] text-white/80 mt-2 pt-2 border-t border-white/20">
                <span>Customers with Dues: {customerOutstandingData.customersWithDueCount}</span>
                <span>Total Customers: {customerOutstandingData.totalCustomers}</span>
              </div>
            </div>

            {/* Search customer */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search debtor by name or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0F4D32]"
              />
            </div>

            {/* Customer List */}
            {customerOutstandingData.customers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                No customers recorded yet. Add customer ledgers to track Udhar.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {customerOutstandingData.customers
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.mobileNumber.includes(searchQuery)
                  )
                  .map((c) => (
                    <div key={c.customerId} className="p-3 text-xs flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-900 text-sm truncate">{c.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {c.mobileNumber || 'No phone'} • Invoiced: {formatCurrency(c.totalInvoiced)}
                        </div>
                        <div className="text-[10px] text-emerald-700">
                          Received: {formatCurrency(c.totalReceived)}
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <div
                          className={`font-black text-sm ${
                            c.outstandingBalance > 0 ? 'text-amber-700' : 'text-slate-400'
                          }`}
                        >
                          {formatCurrency(c.outstandingBalance)}
                        </div>
                        <div className="flex items-center space-x-1 justify-end">
                          {onNavigateToReceipt && c.outstandingBalance > 0 && (
                            <button
                              onClick={() => onNavigateToReceipt(c.customerId)}
                              className="px-2 py-0.5 bg-emerald-100 text-[#0F4D32] rounded text-[10px] font-semibold hover:bg-emerald-200 transition-colors"
                            >
                              Collect
                            </button>
                          )}
                          {onNavigateToCustomerLedger && (
                            <button
                              onClick={() => onNavigateToCustomerLedger(c.customerId)}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium hover:bg-slate-200 transition-colors flex items-center space-x-0.5"
                            >
                              <span>Ledger</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 7. SUPPLIER OUTSTANDING REPORT                                */}
        {/* ============================================================== */}
        {selectedReport === 'SUPPLIER_OUTSTANDING' && supplierOutstandingData && (
          <div className="space-y-3">
            <div className="bg-slate-900 rounded-2xl p-4 text-white shadow-xs">
              <span className="text-xs text-white/80 block">Total Supplier Dues (Payables)</span>
              <div className="text-2xl font-black mt-1 text-red-400">
                {formatCurrency(supplierOutstandingData.totalPayableDue)}
              </div>
              <div className="flex justify-between items-center text-[11px] text-white/80 mt-2 pt-2 border-t border-white/20">
                <span>Suppliers with Dues: {supplierOutstandingData.suppliersWithPayableCount}</span>
                <span>Total Suppliers: {supplierOutstandingData.totalSuppliers}</span>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0F4D32]"
              />
            </div>

            {supplierOutstandingData.suppliers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                No suppliers recorded yet.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {supplierOutstandingData.suppliers
                  .filter(
                    (s) =>
                      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.mobileNumber.includes(searchQuery)
                  )
                  .map((s) => (
                    <div key={s.supplierId} className="p-3 text-xs flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-900 text-sm truncate">{s.name}</div>
                        <div className="text-[10px] text-slate-400">
                          {s.mobileNumber || 'No phone'} • Purchased: {formatCurrency(s.totalPurchased)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Paid: {formatCurrency(s.totalPaid)}
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <div
                          className={`font-black text-sm ${
                            s.payableBalance > 0 ? 'text-red-700' : 'text-slate-400'
                          }`}
                        >
                          {formatCurrency(s.payableBalance)}
                        </div>
                        <div className="flex items-center space-x-1 justify-end">
                          {onNavigateToPayment && s.payableBalance > 0 && (
                            <button
                              onClick={() => onNavigateToPayment(s.supplierId)}
                              className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-semibold hover:bg-red-100 transition-colors"
                            >
                              Pay
                            </button>
                          )}
                          {onNavigateToSupplierLedger && (
                            <button
                              onClick={() => onNavigateToSupplierLedger(s.supplierId)}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium hover:bg-slate-200 transition-colors flex items-center space-x-0.5"
                            >
                              <span>Ledger</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 8. SALES REPORT                                                */}
        {/* ============================================================== */}
        {selectedReport === 'SALES_REPORT' && salesReportData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Total Revenue</span>
                <span className="text-base font-black text-[#0F4D32]">
                  {formatCurrency(salesReportData.totalSales)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {salesReportData.totalInvoices} Invoices • Avg {formatCurrency(salesReportData.avgInvoiceValue)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Gross Margin</span>
                <span className="text-base font-black text-emerald-700">
                  {formatCurrency(salesReportData.totalGrossProfit)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  COGS: {formatCurrency(salesReportData.totalCogs)}
                </span>
              </div>
            </div>

            {/* Payment Mode Distribution Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs shadow-2xs space-y-1.5">
              <div className="flex justify-between font-bold text-slate-700">
                <span>Collections Breakdown</span>
                <span className="text-[10px] text-slate-400 font-normal">By Payment Mode</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center pt-1 text-[11px]">
                <div className="bg-emerald-50 p-1.5 rounded-lg">
                  <span className="text-emerald-800 font-bold block">
                    {formatCurrency(salesReportData.totalCashReceived)}
                  </span>
                  <span className="text-[9px] text-emerald-600">Cash</span>
                </div>
                <div className="bg-blue-50 p-1.5 rounded-lg">
                  <span className="text-blue-800 font-bold block">
                    {formatCurrency(salesReportData.totalUpiReceived)}
                  </span>
                  <span className="text-[9px] text-blue-600">UPI</span>
                </div>
                <div className="bg-indigo-50 p-1.5 rounded-lg">
                  <span className="text-indigo-800 font-bold block">
                    {formatCurrency(salesReportData.totalBankReceived)}
                  </span>
                  <span className="text-[9px] text-indigo-600">Bank</span>
                </div>
                <div className="bg-amber-50 p-1.5 rounded-lg">
                  <span className="text-amber-800 font-bold block">
                    {formatCurrency(salesReportData.totalUdharGiven)}
                  </span>
                  <span className="text-[9px] text-amber-600">Udhar</span>
                </div>
              </div>
            </div>

            {/* Sales Invoices List */}
            {salesReportData.rows.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                No sales invoices in this period.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {salesReportData.rows.map((row) => (
                  <div key={row.voucherId} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900">{row.voucherNumber}</span>
                        <span className="text-[9px] bg-emerald-50 text-[#0F4D32] px-1.5 py-0.5 rounded font-semibold">
                          {row.paymentMode}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-0.5">{row.customerName}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateTime(row.date)} • {row.itemsCount} items
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatCurrency(row.totalAmount)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        GP: +{formatCurrency(row.grossProfit)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 9. PURCHASE REPORT                                             */}
        {/* ============================================================== */}
        {selectedReport === 'PURCHASE_REPORT' && purchaseReportData && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Total Bills</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatCurrency(purchaseReportData.totalPurchases)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Paid Now</span>
                <span className="text-sm font-bold text-emerald-700">
                  {formatCurrency(purchaseReportData.totalPaid)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Supplier Due</span>
                <span className="text-sm font-bold text-red-700">
                  {formatCurrency(purchaseReportData.totalDue)}
                </span>
              </div>
            </div>

            {purchaseReportData.rows.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                No purchase bills recorded in this period.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {purchaseReportData.rows.map((row) => (
                  <div key={row.voucherId} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900">{row.voucherNumber}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                          {row.paymentMode}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-0.5">{row.supplierName}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateTime(row.date)} • {row.itemsCount} items
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatCurrency(row.totalAmount)}
                      </div>
                      {row.udharAmount > 0 && (
                        <div className="text-[10px] text-red-700 font-medium">
                          Due: {formatCurrency(row.udharAmount)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 10. EXPENSE REPORT                                             */}
        {/* ============================================================== */}
        {selectedReport === 'EXPENSE_REPORT' && expenseReportData && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <span className="text-xs text-slate-400 font-semibold block">Total Period Expenses</span>
              <div className="text-2xl font-black text-rose-700 mt-0.5">
                {formatCurrency(expenseReportData.totalExpenses)}
              </div>

              {/* Category Breakdown */}
              {expenseReportData.categories.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                    Category Distribution
                  </span>
                  {expenseReportData.categories.map((cat, i) => (
                    <div key={i} className="space-y-1 text-xs">
                      <div className="flex justify-between items-center text-slate-700">
                        <span>{cat.category}</span>
                        <span className="font-semibold">{formatCurrency(cat.amount)} ({cat.percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, cat.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {expenseReportData.rows.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                No expenses recorded in this period.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {expenseReportData.rows.map((row) => (
                  <div key={row.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{row.category}</div>
                      <div className="text-slate-500 text-[11px]">{row.narration}</div>
                      <div className="text-[10px] text-slate-400">{formatDateTime(row.date)}</div>
                    </div>
                    <div className="text-right font-bold text-rose-700 text-sm">
                      {formatCurrency(row.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 11. STOCK SUMMARY                                              */}
        {/* ============================================================== */}
        {selectedReport === 'STOCK_SUMMARY' && stockSummaryData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0F4D32] p-3 rounded-2xl text-white shadow-xs">
                <span className="text-[10px] text-white/80 font-semibold block">Inventory Cost Value</span>
                <span className="text-base font-black mt-0.5 block">
                  {formatCurrency(stockSummaryData.totalStockValue)}
                </span>
                <span className="text-[10px] text-white/70 block">
                  {stockSummaryData.totalProducts} items • {stockSummaryData.totalStockUnits} units
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Est. Retail Value</span>
                <span className="text-base font-black text-slate-800 mt-0.5 block">
                  {formatCurrency(stockSummaryData.totalPotentialSalesValue)}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  Potential Profit: {formatCurrency(stockSummaryData.totalPotentialGrossProfit)}
                </span>
              </div>
            </div>

            {stockSummaryData.items.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                No products in stock inventory. Add products in the Inventory tab.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {stockSummaryData.items.map((item) => (
                  <div key={item.productId} className="p-3 text-xs flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 text-sm truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.category} • Cost: {formatCurrency(item.purchaseCost)} • Sell: {formatCurrency(item.sellingPrice)}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {item.currentStock} {item.unit}
                        </span>
                        {item.status === 'OUT_OF_STOCK' && (
                          <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold">
                            Out of Stock
                          </span>
                        )}
                        {item.status === 'LOW_STOCK' && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                            Low Stock
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-slate-900 text-sm">
                        {formatCurrency(item.stockValue)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        Retail: {formatCurrency(item.potentialSalesValue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 12. STOCK MOVEMENT REPORT                                      */}
        {/* ============================================================== */}
        {selectedReport === 'STOCK_MOVEMENT' && stockMovementData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Total Inward Units</span>
                <span className="text-sm font-bold text-emerald-700">
                  +{stockMovementData.totalInwardUnits}
                </span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">Total Outward Units</span>
                <span className="text-sm font-bold text-red-700">
                  -{stockMovementData.totalOutwardUnits}
                </span>
              </div>
            </div>

            {stockMovementData.movements.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                No stock movements logged in this period.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {stockMovementData.movements.map((m) => (
                  <div key={m.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{m.productName}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatDateTime(m.date)} {m.referenceNo ? `• Ref: ${m.referenceNo}` : ''}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Stock: {m.previousStock} → {m.newStock}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.type === 'SALE' || m.type === 'OUT'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {m.type === 'SALE' || m.type === 'OUT' ? '-' : '+'}
                        {m.quantity} Units ({m.type})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 13. LOW STOCK REPORT                                           */}
        {/* ============================================================== */}
        {selectedReport === 'LOW_STOCK' && lowStockData && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Low Stock & Reorder Alert</h4>
                  <p className="text-[10px] text-slate-500">
                    Deficit inventory threshold based on minimum stock warning levels.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Low Stock</span>
                  <span className="font-bold text-amber-700 text-sm">{lowStockData.lowStockCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Out of Stock</span>
                  <span className="font-bold text-red-700 text-sm">{lowStockData.outOfStockCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Est. Restock Cost</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {formatCurrency(lowStockData.totalEstimatedReorderCost)}
                  </span>
                </div>
              </div>
            </div>

            {lowStockData.items.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">All inventory stock levels are healthy!</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  No products are currently below their minimum stock threshold.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {lowStockData.items.map((item) => (
                  <div key={item.productId} className="p-3 text-xs flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-900 text-sm truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {item.category} • Cost: {formatCurrency(item.purchaseCost)}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span
                          className={`font-bold ${
                            item.currentStock <= 0 ? 'text-red-700' : 'text-amber-700'
                          }`}
                        >
                          Stock: {item.currentStock} {item.unit}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          (Min Alert: {item.minStockLevel})
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <div className="text-[10px] text-slate-500">
                        Shortage: <span className="font-bold text-red-700">{item.shortageUnits} {item.unit}</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700">
                        Reorder: {formatCurrency(item.estimatedReorderCost)}
                      </div>
                      {onNavigateToPurchase && (
                        <button
                          onClick={onNavigateToPurchase}
                          className="px-2 py-0.5 bg-[#0F4D32] text-white rounded text-[10px] font-semibold hover:bg-[#0B3B26] transition-colors"
                        >
                          + Purchase
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
