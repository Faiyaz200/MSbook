import React from 'react';
import {
  ArrowLeft,
  Plus,
  ShoppingBag,
  Shirt,
  CheckCircle2,
  Circle,
  Hash,
} from 'lucide-react';
import { Business, BUSINESS_TYPES } from '../../types';
import { db } from '../../services/db';

interface BusinessSwitchScreenProps {
  businesses: Business[];
  activeBusinessId: string | null;
  onNavigateBack: () => void;
  onBusinessSwitched: (businessId: string) => void;
  onNavigateToAddBusiness: () => void;
}

export const BusinessSwitchScreen: React.FC<BusinessSwitchScreenProps> = ({
  businesses,
  activeBusinessId,
  onNavigateBack,
  onBusinessSwitched,
  onNavigateToAddBusiness,
}) => {
  const handleSelectBusiness = (id: string) => {
    db.setActiveBusinessId(id);
    onBusinessSwitched(id);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none">
      {/* Top Bar with System Back navigation */}
      <div className="pt-4 px-5 pb-2 flex items-center min-h-[56px] border-b border-slate-100 bg-white">
        <button
          onClick={onNavigateBack}
          className="flex items-center text-[#0F4D32] hover:text-[#0B3B26] transition-colors -ml-2 p-2 rounded-lg"
          title="Return to Dashboard"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span className="font-semibold text-sm">Back</span>
        </button>
        <h2 className="ml-2 font-bold text-slate-800 text-base">Switch Business</h2>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        <div className="mb-1">
          <p className="text-xs text-slate-500 font-medium">
            Select an active business profile ({businesses.length} registered)
          </p>
        </div>

        {businesses.map((business) => {
          const isActive = business.id === activeBusinessId;
          const isClothing = business.businessType === 'CLOTHING';
          const meta = BUSINESS_TYPES[business.businessType];

          return (
            <div
              key={business.id}
              onClick={() => handleSelectBusiness(business.id)}
              role="button"
              tabIndex={0}
              className={`w-full p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between text-left ${
                isActive
                  ? 'border-[#0F4D32] bg-[#F2F8F4] shadow-xs ring-1 ring-[#0F4D32]/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#0F4D32] text-white shadow-xs'
                      : 'bg-[#F2F8F4] text-[#0F4D32]'
                  }`}
                >
                  {isClothing ? (
                    <Shirt className="w-6 h-6" />
                  ) : (
                    <ShoppingBag className="w-6 h-6" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {business.businessName}
                    </h3>
                    {isActive && (
                      <span className="px-1.5 py-0.5 rounded bg-[#0F4D32] text-white text-[9px] font-bold tracking-wider uppercase shrink-0">
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {meta.title}
                  </p>

                  {(business.ownerName || business.mobileNumber) && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {[business.ownerName, business.mobileNumber]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  )}

                  <div className="flex items-center text-[10px] text-slate-400 font-mono mt-0.5">
                    <Hash className="w-3 h-3 mr-0.5" />
                    <span className="truncate">{business.id}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                {isActive ? (
                  <CheckCircle2 className="w-6 h-6 text-[#0F4D32]" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Action Bar: Add New Business */}
      <div className="p-5 bg-white border-t border-slate-100 shadow-sm">
        <button
          onClick={onNavigateToAddBusiness}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-base bg-[#0F4D32] text-white hover:bg-[#0B3B26] active:scale-[0.99] shadow-sm transition-all flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Business</span>
        </button>
      </div>
    </div>
  );
};
