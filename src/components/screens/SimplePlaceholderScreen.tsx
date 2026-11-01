import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Business } from '../../types';

interface SimplePlaceholderScreenProps {
  title: string;
  subtitle: string;
  stageDescription: string;
  icon: LucideIcon;
  activeBusiness: Business;
}

export const SimplePlaceholderScreen: React.FC<SimplePlaceholderScreenProps> = ({
  title,
  subtitle,
  stageDescription,
  icon: Icon,
  activeBusiness,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none">
      {/* Top Header */}
      <div className="bg-[#0F4D32] text-white px-5 pt-4 pb-5 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-white text-[#0F4D32] font-black text-lg flex items-center justify-center shadow-xs">
            MS
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none text-white">
              {title}
            </h1>
            <p className="text-[11px] text-emerald-100 font-medium mt-1 truncate max-w-[220px]">
              {activeBusiness.businessName}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#F2F8F4] flex items-center justify-center text-[#0F4D32] border border-[#0F4D32]/10 mb-4">
          <Icon className="w-8 h-8 stroke-[1.8px]" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">{subtitle}</p>

        <div className="mt-6 w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-xs">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5E9] text-[#0F4D32] uppercase tracking-wider mb-2">
            Upcoming Stage
          </span>
          <p className="text-xs text-slate-600 leading-relaxed">
            {stageDescription}
          </p>
        </div>
      </div>
    </div>
  );
};
