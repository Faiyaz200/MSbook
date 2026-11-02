import React, { useState } from 'react';
import {
  Receipt,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  Split,
  RefreshCw,
  FileEdit,
  Undo2,
  Redo2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { Business, VoucherType } from '../../types';

interface VoucherScreenProps {
  activeBusiness: Business;
  onNavigateToVoucher: (type: VoucherType) => void;
  onNavigateToCustomerLedger?: () => void;
}

export const VoucherScreen: React.FC<VoucherScreenProps> = ({
  activeBusiness,
  onNavigateToVoucher,
  onNavigateToCustomerLedger,
}) => {
  const [isMoreExpanded, setIsMoreExpanded] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none">
      {/* MSbook Native App Header (matches Dashboard design reference exactly) */}
      <div className="bg-[#0F4D32] text-white px-5 pt-4 pb-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#0F4D32] font-black text-lg flex items-center justify-center shadow-xs">
              MS
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none text-white">
                Vouchers Hub
              </h1>
              <p className="text-[11px] text-emerald-100 font-medium mt-1 truncate max-w-[200px]">
                {activeBusiness.businessName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold border border-white/20">
            <span>Accounting</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            Main Vouchers
          </h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#E8F5E9] text-[#0F4D32]">
            4 Core Types
          </span>
        </div>

        {/* 1. 2-COLUMN GRID FOR 4 MAIN VOUCHERS */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1. Sale Item */}
          <div
            onClick={() => onNavigateToVoucher('SALES')}
            role="button"
            tabIndex={0}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-full bg-[#F2F8F4] flex items-center justify-center text-slate-900 border border-[#0F4D32]/10">
                <Receipt className="w-5 h-5 text-black stroke-[1.8px]" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4D32] transition-colors" />
            </div>

            <div className="mt-3">
              <h3 className="font-bold text-slate-900 text-sm leading-tight">
                Sale Item
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Create Sale Bill
              </p>
            </div>
          </div>

          {/* 2. Purchase Voucher */}
          <div
            onClick={() => onNavigateToVoucher('PURCHASE')}
            role="button"
            tabIndex={0}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-full bg-[#F2F8F4] flex items-center justify-center text-slate-900 border border-[#0F4D32]/10">
                <ShoppingCart className="w-5 h-5 text-black stroke-[1.8px]" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4D32] transition-colors" />
            </div>

            <div className="mt-3">
              <h3 className="font-bold text-slate-900 text-sm leading-tight">
                Purchase Voucher
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Record Purchase
              </p>
            </div>
          </div>

          {/* 3. Receipt Voucher */}
          <div
            onClick={() => onNavigateToVoucher('RECEIPT')}
            role="button"
            tabIndex={0}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-full bg-[#F2F8F4] flex items-center justify-center text-slate-900 border border-[#0F4D32]/10">
                <ArrowDownLeft className="w-5 h-5 text-black stroke-[1.8px]" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4D32] transition-colors" />
            </div>

            <div className="mt-3">
              <h3 className="font-bold text-slate-900 text-sm leading-tight">
                Receipt Voucher
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Receive Payment
              </p>
            </div>
          </div>

          {/* 4. Payment Voucher */}
          <div
            onClick={() => onNavigateToVoucher('PAYMENT')}
            role="button"
            tabIndex={0}
            className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between text-left group"
          >
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-full bg-[#F2F8F4] flex items-center justify-center text-slate-900 border border-[#0F4D32]/10">
                <ArrowUpRight className="w-5 h-5 text-black stroke-[1.8px]" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4D32] transition-colors" />
            </div>

            <div className="mt-3">
              <h3 className="font-bold text-slate-900 text-sm leading-tight">
                Payment Voucher
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Make Payment
              </p>
            </div>
          </div>
        </div>

        {/* 2. EXPANDABLE SECTION: MORE VOUCHERS */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Header Toggle */}
          <button
            onClick={() => setIsMoreExpanded(!isMoreExpanded)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-[#F2F8F4] flex items-center justify-center text-[#0F4D32]">
                <RefreshCw className="w-4 h-4 text-black stroke-[1.8px]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">More Vouchers</h3>
                <p className="text-[11px] text-slate-500">
                  Contra, Journal, Debit & Credit Notes
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F2F8F4] text-[#0F4D32]">
                4 Types
              </span>
              {isMoreExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              )}
            </div>
          </button>

          {/* Expanded List Cards */}
          {isMoreExpanded && (
            <div className="p-3 bg-[#F2F8F4]/50 border-t border-slate-100 space-y-2">
              {/* 6. Contra Voucher */}
              <div
                onClick={() => onNavigateToVoucher('CONTRA')}
                role="button"
                tabIndex={0}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#F2F8F4] flex items-center justify-center text-slate-900">
                    <RefreshCw className="w-4 h-4 text-black stroke-[1.8px]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Contra Voucher
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Bank & Cash Transfers
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4D32] transition-colors" />
              </div>

              {/* 7. Journal Voucher */}
              <div
                onClick={() => onNavigateToVoucher('JOURNAL')}
                role="button"
                tabIndex={0}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#F2F8F4] flex items-center justify-center text-slate-900">
                    <FileEdit className="w-4 h-4 text-black stroke-[1.8px]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Journal Voucher
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Adjustment & Non-Cash Entries
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4D32] transition-colors" />
              </div>

              {/* 8. Debit Note */}
              <div
                onClick={() => onNavigateToVoucher('DEBIT_NOTE')}
                role="button"
                tabIndex={0}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#F2F8F4] flex items-center justify-center text-slate-900">
                    <Undo2 className="w-4 h-4 text-black stroke-[1.8px]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Debit Note</h4>
                    <p className="text-[11px] text-slate-500">
                      Purchase Returns & Supplier Debit
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4D32] transition-colors" />
              </div>

              {/* 9. Credit Note */}
              <div
                onClick={() => onNavigateToVoucher('CREDIT_NOTE')}
                role="button"
                tabIndex={0}
                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#F2F8F4] flex items-center justify-center text-slate-900">
                    <Redo2 className="w-4 h-4 text-black stroke-[1.8px]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Credit Note</h4>
                    <p className="text-[11px] text-slate-500">
                      Sales Returns & Customer Credit
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4D32] transition-colors" />
              </div>
            </div>
          )}
        </div>

        {/* Customer Ledger Quick Card */}
        {onNavigateToCustomerLedger && (
          <div
            onClick={onNavigateToCustomerLedger}
            role="button"
            tabIndex={0}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#F2F8F4] flex items-center justify-center text-[#0F4D32]">
                <BookOpen className="w-5 h-5 text-black stroke-[1.8px]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  Customer Ledgers & Statement
                </h4>
                <p className="text-[11px] text-slate-500">
                  View Rahul's history & payment mode totals
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0F4D32] transition-colors" />
          </div>
        )}
      </div>
    </div>
  );
};
