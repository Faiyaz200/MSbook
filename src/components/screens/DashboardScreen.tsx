import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  PlusCircle,
  ShoppingBag,
  Shirt,
  User,
  Phone,
  MapPin,
  Hash,
  CheckCircle2,
  Receipt,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  IndianRupee,
  Clock,
  TrendingUp,
  Package,
  Settings,
} from 'lucide-react';
import { Business, BUSINESS_TYPES, BusinessFinancialSummary, Voucher } from '../../types';
import { db } from '../../services/db';

interface DashboardScreenProps {
  activeBusiness: Business;
  onNavigateToSwitcher: () => void;
  onNavigateToAddBusiness: () => void;
  onNavigateToSales?: () => void;
  onNavigateToPurchase?: () => void;
  onNavigateToReceipt?: () => void;
  onNavigateToPayment?: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToSettings?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  activeBusiness,
  onNavigateToSwitcher,
  onNavigateToAddBusiness,
  onNavigateToSales,
  onNavigateToPurchase,
  onNavigateToReceipt,
  onNavigateToPayment,
  onNavigateToInventory,
  onNavigateToSettings,
}) => {
  const isClothing = activeBusiness.businessType === 'CLOTHING';
  const meta = BUSINESS_TYPES[activeBusiness.businessType];

  const [summary, setSummary] = useState<BusinessFinancialSummary>({
    cashBalance: 0,
    bankBalance: 0,
    upiBalance: 0,
    customerOutstanding: 0,
    supplierOutstanding: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    netProfit: 0,
    stockValue: 0,
  });

  const [recentVouchers, setRecentVouchers] = useState<Voucher[]>([]);

  const loadData = () => {
    const fin = db.getBusinessFinancialSummary(activeBusiness.id);
    setSummary(fin);
    const list = db.getVouchers(activeBusiness.id).slice(0, 5);
    setRecentVouchers(list);
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [activeBusiness.id]);

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
      {/* MSbook Native App Header (Dark Green #0F4D32) */}
      <div className="bg-[#0F4D32] text-white px-5 pt-4 pb-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#0F4D32] font-black text-lg flex items-center justify-center shadow-xs">
              MS
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none text-white">
                MSbook
              </h1>
              <p className="text-[11px] text-emerald-100 font-medium mt-1">
                Accounting & Business Suite
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Quick Switcher Button */}
            <button
              onClick={onNavigateToSwitcher}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/20"
              title="Switch Active Business"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Switch</span>
            </button>

            {onNavigateToSettings && (
              <button
                onClick={onNavigateToSettings}
                className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold backdrop-blur-xs transition-colors border border-white/20"
                title="Settings, Backup & Restore"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Dashboard Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Active Business Identity Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5E9] text-[#0F4D32] tracking-wider uppercase">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active Business
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1.5 tracking-tight">
                {activeBusiness.businessName}
              </h2>
              <div className="flex items-center space-x-1 text-[#0F4D32] font-semibold text-xs mt-0.5">
                <span>{meta.title}</span>
              </div>
            </div>

            <div className="w-11 h-11 rounded-full bg-[#F2F8F4] flex items-center justify-center text-[#0F4D32] shrink-0 border border-[#0F4D32]/10">
              {isClothing ? (
                <Shirt className="w-5 h-5 text-black stroke-[1.8px]" />
              ) : (
                <ShoppingBag className="w-5 h-5 text-black stroke-[1.8px]" />
              )}
            </div>
          </div>

          <div className="my-3 border-t border-slate-100" />

          {/* Business Details Info Grid */}
          <div className="space-y-1.5 text-xs text-slate-600">
            {activeBusiness.ownerName && (
              <div className="flex items-center">
                <User className="w-3.5 h-3.5 mr-2 text-[#0F4D32] shrink-0" />
                <span className="text-slate-400 mr-1.5">Owner:</span>
                <span className="font-medium text-slate-800">{activeBusiness.ownerName}</span>
              </div>
            )}

            {activeBusiness.mobileNumber && (
              <div className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-2 text-[#0F4D32] shrink-0" />
                <span className="text-slate-400 mr-1.5">Mobile:</span>
                <span className="font-medium text-slate-800">{activeBusiness.mobileNumber}</span>
              </div>
            )}

            {activeBusiness.address && (
              <div className="flex items-start">
                <MapPin className="w-3.5 h-3.5 mr-2 text-[#0F4D32] shrink-0 mt-0.5" />
                <span className="text-slate-400 mr-1.5 shrink-0">Address:</span>
                <span className="font-medium text-slate-800">{activeBusiness.address}</span>
              </div>
            )}

            <div className="flex items-center font-mono text-[10px] text-slate-400 pt-0.5">
              <Hash className="w-3 h-3 mr-1 text-slate-400" />
              <span className="truncate">ID: {activeBusiness.id}</span>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards (100% Real DB records, default ₹0 for clean business) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Financial Balances
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">
              Real-Time Ledger
            </span>
          </div>

          {/* Liquid Balances Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 block">Cash Balance</span>
              <p className="font-mono text-base font-bold text-slate-900 mt-1">
                ₹{summary.cashBalance.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 block">Bank Balance</span>
              <p className="font-mono text-base font-bold text-slate-900 mt-1">
                ₹{summary.bankBalance.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 block">UPI Balance</span>
              <p className="font-mono text-base font-bold text-slate-900 mt-1">
                ₹{summary.upiBalance.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Outstanding Udhar / Payables Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">Customer Due (Receivable)</span>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              </div>
              <p className="font-mono text-lg font-bold text-amber-700 mt-1">
                ₹{summary.customerOutstanding.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Total unpaid customer credit
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600">Supplier Due (Payable)</span>
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
              </div>
              <p className="font-mono text-lg font-bold text-rose-700 mt-1">
                ₹{summary.supplierOutstanding.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Total supplier credit balance
              </span>
            </div>
          </div>

          {/* Performance Overview (Sales, Purchases, Net Profit, Stock) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-600 block">Total Sales</span>
              <p className="font-mono text-base font-bold text-slate-900 mt-1">
                ₹{summary.totalSales.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Total bills generated</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-600 block">Total Purchases</span>
              <p className="font-mono text-base font-bold text-slate-900 mt-1">
                ₹{summary.totalPurchases.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Stock inward expenses</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-600 block">Net Profit</span>
              <p
                className={`font-mono text-base font-bold mt-1 ${
                  summary.netProfit >= 0 ? 'text-[#0F4D32]' : 'text-rose-600'
                }`}
              >
                ₹{summary.netProfit.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Sales - (COGS + Expenses)</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-600 block">Stock Value</span>
              <p className="font-mono text-base font-bold text-slate-900 mt-1">
                ₹{summary.stockValue.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Current inventory basis</span>
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 px-1">
            Quick Actions
          </h3>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={onNavigateToSales}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 active:scale-[0.97] transition-all shadow-xs"
            >
              <div className="w-9 h-9 rounded-full bg-[#F2F8F4] flex items-center justify-center text-slate-900 mb-1 border border-[#0F4D32]/10">
                <Receipt className="w-4 h-4 text-black stroke-[1.8px]" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                Sale Item
              </span>
            </button>

            <button
              onClick={onNavigateToPurchase}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 active:scale-[0.97] transition-all shadow-xs"
            >
              <div className="w-9 h-9 rounded-full bg-[#F2F8F4] flex items-center justify-center text-slate-900 mb-1 border border-[#0F4D32]/10">
                <ShoppingCart className="w-4 h-4 text-black stroke-[1.8px]" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                Purchase
              </span>
            </button>

            <button
              onClick={onNavigateToReceipt}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 active:scale-[0.97] transition-all shadow-xs"
            >
              <div className="w-9 h-9 rounded-full bg-[#F2F8F4] flex items-center justify-center text-slate-900 mb-1 border border-[#0F4D32]/10">
                <ArrowDownLeft className="w-4 h-4 text-black stroke-[1.8px]" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                Receive
              </span>
            </button>

            <button
              onClick={onNavigateToInventory}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 active:scale-[0.97] transition-all shadow-xs"
            >
              <div className="w-9 h-9 rounded-full bg-[#F2F8F4] flex items-center justify-center text-slate-900 mb-1 border border-[#0F4D32]/10">
                <Package className="w-4 h-4 text-black stroke-[1.8px]" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                Inventory
              </span>
            </button>
          </div>
        </div>

        {/* Recent Transactions (Zero fake records) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recent Transactions
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E8F5E9] text-[#0F4D32]">
              {recentVouchers.length} Entries
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {recentVouchers.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#F2F8F4] text-slate-400 mx-auto flex items-center justify-center">
                  <Clock className="w-5 h-5 text-black stroke-[1.5px]" />
                </div>
                <p className="text-xs font-medium text-slate-600">
                  No transactions recorded yet
                </p>
                <p className="text-[11px] text-slate-400">
                  Create a Sales or Purchase voucher to record accounting entries
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentVouchers.map((v) => (
                  <div key={v.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{v.voucherNumber}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {v.voucherType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {v.partyName || v.remarks || 'Direct Transaction'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 block text-sm">
                        ₹{v.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(v.date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Multi-Business Management Actions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={onNavigateToSwitcher}
            className="flex items-center justify-center space-x-2 p-3.5 rounded-xl bg-white border border-[#0F4D32] text-[#0F4D32] hover:bg-[#F2F8F4] active:scale-[0.98] transition-all shadow-xs"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span className="font-semibold text-xs">Switch Business</span>
          </button>

          <button
            onClick={onNavigateToAddBusiness}
            className="flex items-center justify-center space-x-2 p-3.5 rounded-xl bg-[#0F4D32] text-white hover:bg-[#0B3B26] active:scale-[0.98] transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="font-semibold text-xs">Add Business</span>
          </button>
        </div>
      </div>
    </div>
  );
};
