import React, { useState } from 'react';
import {
  Users,
  Truck,
  BookOpen,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { Business } from '../../types';
import { CustomerLedgerScreen } from './CustomerLedgerScreen';
import { SupplierLedgerScreen } from './SupplierLedgerScreen';
import { AccountLedgerScreen } from './AccountLedgerScreen';

interface LedgersHubScreenProps {
  activeBusiness: Business;
  onNavigateBack: () => void;
  onNavigateToReceipt?: (customerId?: string) => void;
  onNavigateToPayment?: (supplierId?: string) => void;
  onNavigateToPurchase?: (supplierId?: string) => void;
}

export const LedgersHubScreen: React.FC<LedgersHubScreenProps> = ({
  activeBusiness,
  onNavigateBack,
  onNavigateToReceipt,
  onNavigateToPayment,
  onNavigateToPurchase,
}) => {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'SUPPLIERS' | 'ACCOUNTS'>('CUSTOMERS');

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
      {/* MSbook Native App Header */}
      <div className="bg-[#0F4D32] text-white px-5 pt-4 pb-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#0F4D32] font-black text-lg flex items-center justify-center shadow-xs">
              MS
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none text-white">
                Ledgers Hub
              </h1>
              <p className="text-[11px] text-emerald-100 font-medium mt-1 truncate max-w-[200px]">
                {activeBusiness.businessName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold border border-white/20">
            <span>Books</span>
          </div>
        </div>

        {/* 3 Ledger Category Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'CUSTOMERS'
                ? 'bg-white text-[#0F4D32] shadow-xs'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers</span>
          </button>

          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'SUPPLIERS'
                ? 'bg-white text-[#0F4D32] shadow-xs'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Suppliers</span>
          </button>

          <button
            onClick={() => setActiveTab('ACCOUNTS')}
            className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ACCOUNTS'
                ? 'bg-white text-[#0F4D32] shadow-xs'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Accounts</span>
          </button>
        </div>
      </div>

      {/* Screen Body */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'CUSTOMERS' && (
          <CustomerLedgerScreen
            activeBusiness={activeBusiness}
            onNavigateBack={onNavigateBack}
            onNavigateToReceipt={onNavigateToReceipt}
          />
        )}

        {activeTab === 'SUPPLIERS' && (
          <SupplierLedgerScreen
            activeBusiness={activeBusiness}
            onNavigateBack={onNavigateBack}
            onNavigateToPayment={onNavigateToPayment}
            onNavigateToPurchase={onNavigateToPurchase}
          />
        )}

        {activeTab === 'ACCOUNTS' && (
          <AccountLedgerScreen
            activeBusiness={activeBusiness}
            onNavigateBack={onNavigateBack}
          />
        )}
      </div>
    </div>
  );
};
