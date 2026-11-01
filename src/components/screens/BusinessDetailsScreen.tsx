import React, { useState } from 'react';
import { ArrowLeft, Building2, User, Phone, MapPin, AlertCircle } from 'lucide-react';
import { BusinessType, BUSINESS_TYPES } from '../../types';
import { db } from '../../services/db';

interface BusinessDetailsScreenProps {
  businessType: BusinessType;
  onNavigateBack: () => void;
  onBusinessCreated: () => void;
}

export const BusinessDetailsScreen: React.FC<BusinessDetailsScreenProps> = ({
  businessType,
  onNavigateBack,
  onBusinessCreated,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const meta = BUSINESS_TYPES[businessType];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = businessName.trim();
    if (!trimmed) {
      setErrorMessage('Business name is mandatory');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      db.insertBusiness({
        businessName: trimmed,
        businessType,
        ownerName,
        mobileNumber,
        address,
      });

      // Navigate to dashboard
      onBusinessCreated();
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create business');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none">
      {/* Top Bar with System Back navigation */}
      <div className="pt-4 px-5 pb-2 flex items-center min-h-[56px] border-b border-slate-100 bg-white">
        <button
          onClick={onNavigateBack}
          className="flex items-center text-[#0F4D32] hover:text-[#0B3B26] transition-colors -ml-2 p-2 rounded-lg"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span className="font-semibold text-sm">Back</span>
        </button>
        <h2 className="ml-2 font-bold text-slate-800 text-base">Business Details</h2>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
        {/* Category Header Badge */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-[#E8F5E9] text-[#0F4D32]">
            {meta.title}
          </span>
          <span className="text-slate-400 text-xs">• Step 2 of 2</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Enter Business Info
        </h1>
        <p className="text-slate-600 text-xs mt-1 leading-relaxed">
          Provide your business name to create your dedicated accounting book.
        </p>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* 1. Business Name (Mandatory) */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Business Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4 text-[#0F4D32]" />
              </div>
              <input
                type="text"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  if (errorMessage && e.target.value.trim()) {
                    setErrorMessage(null);
                  }
                }}
                placeholder="e.g. My Kirana Store, Royal Garments"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none transition-all ${
                  errorMessage
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-300 focus:border-[#0F4D32] focus:ring-2 focus:ring-[#0F4D32]/20'
                }`}
                autoFocus
              />
            </div>
            {errorMessage && (
              <div className="flex items-center mt-1.5 text-xs text-red-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5 mr-1 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* 2. Owner Name (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Owner Name <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:border-[#0F4D32] focus:ring-2 focus:ring-[#0F4D32]/20 transition-all"
              />
            </div>
          </div>

          {/* 3. Mobile Number (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:border-[#0F4D32] focus:ring-2 focus:ring-[#0F4D32]/20 transition-all"
              />
            </div>
          </div>

          {/* 4. Business Address (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Business Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-0 pl-3.5 pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="e.g. Shop #12, Market Road"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:border-[#0F4D32] focus:ring-2 focus:ring-[#0F4D32]/20 transition-all resize-none"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Action Bar: Continue Button only (No Cancel button) */}
      <div className="p-5 bg-white border-t border-slate-100 shadow-sm">
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl font-semibold text-base bg-[#0F4D32] text-white hover:bg-[#0B3B26] active:scale-[0.99] shadow-sm transition-all flex items-center justify-center"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Continue'
          )}
        </button>
      </div>
    </div>
  );
};
