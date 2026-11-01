import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Shirt, CheckCircle2, Circle } from 'lucide-react';
import { BusinessType, BUSINESS_TYPES } from '../../types';

interface BusinessSelectScreenProps {
  canNavigateBack: boolean;
  onNavigateBack: () => void;
  onBusinessSelected: (type: BusinessType) => void;
}

export const BusinessSelectScreen: React.FC<BusinessSelectScreenProps> = ({
  canNavigateBack,
  onNavigateBack,
  onBusinessSelected,
}) => {
  const [selectedType, setSelectedType] = useState<BusinessType | null>(null);

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none">
      {/* Top Bar */}
      <div className="pt-4 px-5 pb-2 flex items-center min-h-[56px]">
        {canNavigateBack ? (
          <button
            onClick={onNavigateBack}
            className="flex items-center text-[#0F4D32] hover:text-[#0B3B26] transition-colors -ml-2 p-2 rounded-lg"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="font-semibold text-sm">Back</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F4D32] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              MS
            </div>
            <span className="font-bold text-[#0F4D32] tracking-tight text-lg">MSbook</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-3 pb-6">
        <div className="mb-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#0F4D32]">
            Step 1 of 2
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Choose Your Business
        </h1>
        <p className="text-slate-600 text-sm mt-1 leading-relaxed">
          Select your business category to establish your isolated ledger book.
        </p>

        {/* Options */}
        <div className="mt-6 space-y-4">
          {/* 1. Kirana / General Store */}
          <div
            onClick={() => setSelectedType('KIRANA')}
            role="button"
            tabIndex={0}
            className={`w-full p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between text-left ${
              selectedType === 'KIRANA'
                ? 'border-[#0F4D32] bg-[#F2F8F4] shadow-sm ring-1 ring-[#0F4D32]/20'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  selectedType === 'KIRANA'
                    ? 'bg-[#0F4D32] text-white shadow-sm'
                    : 'bg-[#F2F8F4] text-[#0F4D32]'
                }`}
              >
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base leading-snug">
                  {BUSINESS_TYPES.KIRANA.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {BUSINESS_TYPES.KIRANA.description}
                </p>
                <span className="inline-block mt-1 text-[11px] font-medium text-[#0F4D32]">
                  {BUSINESS_TYPES.KIRANA.badge}
                </span>
              </div>
            </div>
            <div className="ml-3 shrink-0">
              {selectedType === 'KIRANA' ? (
                <CheckCircle2 className="w-6 h-6 text-[#0F4D32]" />
              ) : (
                <Circle className="w-6 h-6 text-slate-300" />
              )}
            </div>
          </div>

          {/* 2. Clothing / Men's Wear */}
          <div
            onClick={() => setSelectedType('CLOTHING')}
            role="button"
            tabIndex={0}
            className={`w-full p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between text-left ${
              selectedType === 'CLOTHING'
                ? 'border-[#0F4D32] bg-[#F2F8F4] shadow-sm ring-1 ring-[#0F4D32]/20'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  selectedType === 'CLOTHING'
                    ? 'bg-[#0F4D32] text-white shadow-sm'
                    : 'bg-[#F2F8F4] text-[#0F4D32]'
                }`}
              >
                <Shirt className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base leading-snug">
                  {BUSINESS_TYPES.CLOTHING.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {BUSINESS_TYPES.CLOTHING.description}
                </p>
                <span className="inline-block mt-1 text-[11px] font-medium text-[#0F4D32]">
                  {BUSINESS_TYPES.CLOTHING.badge}
                </span>
              </div>
            </div>
            <div className="ml-3 shrink-0">
              {selectedType === 'CLOTHING' ? (
                <CheckCircle2 className="w-6 h-6 text-[#0F4D32]" />
              ) : (
                <Circle className="w-6 h-6 text-slate-300" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-5 bg-white border-t border-slate-100 shadow-sm">
        <button
          onClick={() => {
            if (selectedType) onBusinessSelected(selectedType);
          }}
          disabled={!selectedType}
          className={`w-full py-3.5 px-4 rounded-xl font-semibold text-base flex items-center justify-center transition-all ${
            selectedType
              ? 'bg-[#0F4D32] text-white hover:bg-[#0B3B26] active:scale-[0.99] shadow-sm'
              : 'bg-[#0F4D32]/30 text-white/70 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
