import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  BookOpen,
  Package,
  BarChart3,
} from 'lucide-react';
import { BottomTabKey } from '../types';

interface BottomNavProps {
  currentTab: BottomTabKey;
  onSelectTab: (tab: BottomTabKey) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs: Array<{ key: BottomTabKey; label: string; icon: React.ElementType }> = [
    { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'VOUCHERS', label: 'Vouchers', icon: Receipt },
    { key: 'LEDGERS', label: 'Ledgers', icon: BookOpen },
    { key: 'INVENTORY', label: 'Inventory', icon: Package },
    { key: 'REPORTS', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="h-[60px] bg-white border-t border-slate-200 flex items-center justify-around px-2 select-none shrink-0 shadow-xs z-20">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isSelected = currentTab === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onSelectTab(tab.key)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl ${
              isSelected
                ? 'text-[#0F4D32] font-bold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors ${
                isSelected ? 'bg-[#F2F8F4]' : 'bg-transparent'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isSelected ? 'stroke-[2.3px] scale-105' : 'stroke-[1.8px]'
                }`}
              />
            </div>
            <span
              className={`text-[10px] mt-0.5 tracking-tight ${
                isSelected ? 'font-bold text-[#0F4D32]' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
