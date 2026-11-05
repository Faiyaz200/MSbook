import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  IndianRupee,
  Wallet,
  Landmark,
  Package,
  MessageCircle,
  ArrowDownLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Business, Customer } from '../../types';
import { db } from '../../services/db';

interface ReportsScreenProps {
  activeBusiness: Business;
  onNavigateBack: () => void;
  onNavigateToCustomerLedger?: (customerId: string) => void;
  onNavigateToSupplierLedger?: (supplierId: string) => void;
  onNavigateToPurchase?: () => void;
  onNavigateToReceipt?: (customerId?: string) => void;
  onNavigateToPayment?: (supplierId?: string) => void;
  initialReportType?: any;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  activeBusiness,
  onNavigateToReceipt,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerBalances, setCustomerBalances] = useState<
    Array<{ customer: Customer; balance: number; lastDate?: number }>
  >([]);
  const [searchCust, setSearchCust] = useState('');

  // Financial Balances & P&L
  const [financials, setFinancials] = useState({
    cashBalance: 0,
    bankBalance: 0,
    upiBalance: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    netProfit: 0,
    stockValue: 0,
    totalCustomerUdhar: 0,
  });

  const loadData = () => {
    const fin = db.getBusinessFinancialSummary(activeBusiness.id);
    const custList = db.getCustomers(activeBusiness.id);
    setCustomers(custList);

    // Calculate customer balances from ledger summaries
    let totalUdhar = 0;
    const balances = custList
      .map((c) => {
        const sum = db.getCustomerLedger(activeBusiness.id, c.id);
        const bal = sum.totalOutstanding;
        if (bal > 0) {
          totalUdhar += bal;
        }
        const lastTx = sum.transactions[sum.transactions.length - 1];
        return {
          customer: c,
          balance: bal,
          lastDate: lastTx ? lastTx.date : c.createdAt,
        };
      })
      .filter((cb) => cb.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    setCustomerBalances(balances);
    setFinancials({
      cashBalance: fin.cashBalance,
      bankBalance: fin.bankBalance,
      upiBalance: fin.upiBalance,
      totalSales: fin.totalSales,
      totalPurchases: fin.totalPurchases,
      totalExpenses: fin.totalExpenses,
      netProfit: fin.netProfit,
      stockValue: fin.stockValue,
      totalCustomerUdhar: totalUdhar,
    });
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [activeBusiness.id]);

  // Filtered customer list for udhari
  const filteredUdhari = customerBalances.filter((cb) => {
    const q = searchCust.trim().toLowerCase();
    return (
      q === '' ||
      cb.customer.name.toLowerCase().includes(q) ||
      cb.customer.mobileNumber.toLowerCase().includes(q)
    );
  });

  const profitMargin =
    financials.totalSales > 0
      ? ((financials.netProfit / financials.totalSales) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
      {/* Header (MSbook Dark Green) */}
      <div className="bg-[#0F4D32] text-white px-5 pt-4 pb-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#0F4D32] font-black text-lg flex items-center justify-center shadow-xs">
              MS
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none text-white">
                Reports & Statements
              </h1>
              <p className="text-[11px] text-emerald-100 font-medium mt-1 truncate max-w-[200px]">
                {activeBusiness.businessName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold border border-white/20">
            <span>Financial Reports</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* 1. Net Profit Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0F4D32] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Profit & Loss Statement</h3>
                <span className="text-[10px] text-slate-400">Total Business Performance</span>
              </div>
            </div>

            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full ${
                financials.netProfit >= 0
                  ? 'bg-emerald-50 text-[#0F4D32] border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              Margin: {profitMargin}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            <div className="bg-[#F8FAF8] rounded-xl p-2.5">
              <span className="text-[10px] text-slate-500 font-medium block">Total Sales</span>
              <span className="font-mono text-xs font-bold text-slate-900 block mt-0.5">
                ₹{financials.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>
            </div>
            <div className="bg-[#F8FAF8] rounded-xl p-2.5">
              <span className="text-[10px] text-slate-500 font-medium block">Purchases</span>
              <span className="font-mono text-xs font-bold text-slate-900 block mt-0.5">
                ₹{financials.totalPurchases.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>
            </div>
            <div className="bg-[#F2F8F4] border border-emerald-200 rounded-xl p-2.5">
              <span className="text-[10px] text-[#0F4D32] font-bold block">Net Profit</span>
              <span
                className={`font-mono text-xs font-black block mt-0.5 ${
                  financials.netProfit >= 0 ? 'text-[#0F4D32]' : 'text-red-600'
                }`}
              >
                ₹{financials.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Customer Receivables List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Customer Receivables</h3>
                <span className="text-[10px] text-slate-400">Outstanding customer balances</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Total Outstanding</span>
              <span className="font-mono text-sm font-black text-amber-800">
                ₹{financials.totalCustomerUdhar.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer name or mobile..."
              value={searchCust}
              onChange={(e) => setSearchCust(e.target.value)}
              className="w-full bg-[#F8FAF8] border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-[#0F4D32]"
            />
          </div>

          {/* Customer Rows */}
          {customerBalances.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 bg-[#F8FAF8] rounded-xl">
              No outstanding customer balances. All accounts cleared!
            </div>
          ) : filteredUdhari.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching customers found for "{searchCust}"
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUdhari.map(({ customer, balance, lastDate }) => {
                const dateStr = lastDate
                  ? new Date(lastDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                    })
                  : '';

                const whatsappUrl = customer.mobileNumber
                  ? `https://wa.me/91${customer.mobileNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hello ${customer.name}, your total outstanding balance at MSbook is ₹${balance.toFixed(
                        1
                      )}. Please settle payment at your earliest convenience. Thank you!`
                    )}`
                  : null;

                return (
                  <div
                    key={customer.id}
                    className="p-3 rounded-xl bg-[#F8FAF8] border border-slate-200 flex items-center justify-between hover:border-amber-400 transition-colors"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{customer.name}</h4>
                      <p className="text-[10px] text-slate-500">
                        {customer.mobileNumber ? customer.mobileNumber : 'No mobile'}
                        {dateStr && ` • Last: ${dateStr}`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <span className="font-mono text-xs font-black text-amber-800 block">
                          ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-[9px] text-amber-700 font-semibold">Due</span>
                      </div>

                      {/* WhatsApp Reminder Button */}
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                          title="Send WhatsApp payment reminder"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}

                      {/* Receive Payment Button */}
                      {onNavigateToReceipt && (
                        <button
                          type="button"
                          onClick={() => onNavigateToReceipt(customer.id)}
                          className="px-2 py-1 rounded-lg bg-[#0F4D32] text-white text-[10px] font-bold hover:bg-[#0B3B26] transition-colors"
                        >
                          Receive
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Liquid Balances (Cash, Bank, UPI) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-500 flex items-center space-x-1">
              <Wallet className="w-3 h-3 text-[#0F4D32]" />
              <span>Cash In Hand</span>
            </span>
            <p className="font-mono text-sm font-bold text-slate-900 mt-1">
              ₹{financials.cashBalance.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-500 flex items-center space-x-1">
              <Landmark className="w-3 h-3 text-blue-600" />
              <span>UPI & Bank</span>
            </span>
            <p className="font-mono text-sm font-bold text-slate-900 mt-1">
              ₹{(financials.bankBalance + financials.upiBalance).toLocaleString('en-IN', {
                maximumFractionDigits: 1,
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
