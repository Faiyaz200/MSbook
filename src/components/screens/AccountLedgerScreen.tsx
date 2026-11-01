import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Search,
  IndianRupee,
  Layers,
  AlertCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Business, LedgerAccount, GeneralLedgerSummary, AccountGroup } from '../../types';
import { db } from '../../services/db';

interface AccountLedgerScreenProps {
  activeBusiness: Business;
  initialAccountName?: string;
  onNavigateBack: () => void;
}

export const AccountLedgerScreen: React.FC<AccountLedgerScreenProps> = ({
  activeBusiness,
  initialAccountName,
  onNavigateBack,
}) => {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [selectedAccountName, setSelectedAccountName] = useState<string>(
    initialAccountName || 'Cash Account'
  );
  const [ledgerSummary, setLedgerSummary] = useState<GeneralLedgerSummary | null>(null);

  // Add Custom Ledger Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formGroup, setFormGroup] = useState<AccountGroup>('EXPENSE');
  const [formSubGroup, setFormSubGroup] = useState('');
  const [formOpeningBalance, setFormOpeningBalance] = useState('0');
  const [formError, setFormError] = useState<string | null>(null);

  const loadAccounts = () => {
    const list = db.getLedgerAccounts(activeBusiness.id);
    setAccounts(list);
    if (list.length > 0 && (!selectedAccountName || !list.some((a) => a.name === selectedAccountName))) {
      setSelectedAccountName(list[0].name);
    }
  };

  useEffect(() => {
    loadAccounts();
    const unsub = db.subscribe(() => {
      loadAccounts();
    });
    return () => unsub();
  }, [activeBusiness.id]);

  useEffect(() => {
    if (selectedAccountName) {
      try {
        const summary = db.getAccountLedger(activeBusiness.id, selectedAccountName);
        setLedgerSummary(summary);
      } catch {
        setLedgerSummary(null);
      }
    }
  }, [selectedAccountName, activeBusiness.id]);

  const handleSaveCustomLedger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Account name is required');
      return;
    }

    try {
      const created = db.createCustomLedger({
        businessId: activeBusiness.id,
        name: formName.trim(),
        group: formGroup,
        subGroup: formSubGroup.trim(),
        openingBalance: parseFloat(formOpeningBalance) || 0,
      });

      setSelectedAccountName(created.name);
      setIsFormOpen(false);
      setFormName('');
      setFormSubGroup('');
      setFormOpeningBalance('0');
      setFormError(null);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create ledger');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
      {/* Top Native Header */}
      <div className="pt-3 px-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-white min-h-[56px] shrink-0 shadow-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateBack}
            className="flex items-center text-[#0F4D32] hover:text-[#0B3B26] p-1.5 rounded-lg -ml-1.5"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="font-semibold text-sm">Back</span>
          </button>
          <div className="ml-1">
            <h2 className="font-bold text-slate-900 text-sm leading-tight">General Ledgers</h2>
            <span className="text-[10px] text-slate-400">Cash, Bank, Expenses & Incomes</span>
          </div>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0F4D32] text-white rounded-xl text-xs font-semibold hover:bg-[#0B3B26] active:scale-[0.97] transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Ledger</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Ledger Selector Pills */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Select Account Ledger:</span>
            <span className="text-[10px] text-slate-400">{accounts.length} Ledgers</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {accounts.map((acc) => {
              const isSelected = acc.name.toLowerCase() === selectedAccountName.toLowerCase();
              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountName(acc.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-[#0F4D32] text-white shadow-xs'
                      : 'bg-[#F2F8F4] text-[#0F4D32] hover:bg-emerald-100'
                  }`}
                >
                  {acc.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Account Statement */}
        {ledgerSummary && (
          <>
            {/* Account Overview Header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5E9] text-[#0F4D32] uppercase">
                    {ledgerSummary.account.group}
                    {ledgerSummary.account.subGroup ? ` • ${ledgerSummary.account.subGroup}` : ''}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {ledgerSummary.account.name}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Closing Balance
                  </span>
                  <span
                    className={`font-mono text-lg font-bold ${
                      ledgerSummary.closingBalance >= 0 ? 'text-[#0F4D32]' : 'text-rose-700'
                    }`}
                  >
                    ₹{ledgerSummary.closingBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Summary Metrics */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Account Summary
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {ledgerSummary.transactions.length} Entries
                </span>
              </div>

              {/* Opening Balance Separated from Entries */}
              <div className="p-2.5 rounded-xl bg-[#F8FAF8] border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">Opening Balance</span>
                  <p className="text-[10px] text-slate-500">Initial configured balance</p>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ₹{(ledgerSummary.openingBalance || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Debit vs Credit Totals */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block">Total Debits</span>
                  <span className="font-mono text-sm font-bold text-slate-900 mt-0.5 block">
                    ₹{ledgerSummary.totalDebit.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block">Total Credits</span>
                  <span className="font-mono text-sm font-bold text-slate-900 mt-0.5 block">
                    ₹{ledgerSummary.totalCredit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Transactions List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 px-1">
                Detailed Transaction Entries
              </h4>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                {ledgerSummary.transactions.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No transactions recorded in {ledgerSummary.account.name} yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {ledgerSummary.transactions.map((tx) => (
                      <div key={tx.id} className="p-3.5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">
                              {tx.voucherNumber || 'Journal Entry'}
                            </span>
                            {tx.voucherType && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {tx.voucherType}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(tx.date).toLocaleDateString('en-IN')}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-1">
                          {tx.narration}
                        </p>

                        <div className="pt-1 flex items-center justify-between text-[11px] font-mono border-t border-slate-50">
                          <div className="space-x-3 text-slate-500">
                            {tx.debit > 0 && (
                              <span>
                                Dr: <strong className="text-slate-800">₹{tx.debit}</strong>
                              </span>
                            )}
                            {tx.credit > 0 && (
                              <span>
                                Cr: <strong className="text-slate-800">₹{tx.credit}</strong>
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-400 font-sans text-[10px] mr-1">Bal:</span>
                            <strong className="text-[#0F4D32]">
                              ₹{tx.runningBalance}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Custom Ledger Form Modal/Screen */}
      {isFormOpen && (
        <div className="absolute inset-0 z-40 bg-[#F8FAF8] flex flex-col">
          <div className="pt-3 px-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-white min-h-[56px] shrink-0 shadow-xs">
            <button
              onClick={() => setIsFormOpen(false)}
              className="flex items-center text-[#0F4D32] hover:text-[#0B3B26] p-1.5 rounded-lg -ml-1.5"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span className="font-semibold text-sm">Cancel</span>
            </button>
            <h3 className="font-bold text-sm text-slate-900">Add Custom Ledger</h3>
            <div className="w-14" />
          </div>

          <form onSubmit={handleSaveCustomLedger} className="flex-1 overflow-y-auto p-5 space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ledger Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Printing & Stationery, Delivery Charges"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0F4D32]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Account Group
                </label>
                <select
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value as AccountGroup)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0F4D32] bg-white"
                >
                  <option value="EXPENSE">Expense (Indirect / Operating)</option>
                  <option value="INCOME">Income (Direct / Indirect)</option>
                  <option value="ASSET">Asset (Current / Fixed)</option>
                  <option value="LIABILITY">Liability (Current / Loan)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Sub-group / Category (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Office Expenses, Bank Interest"
                  value={formSubGroup}
                  onChange={(e) => setFormSubGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0F4D32]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Opening Balance (₹) (Default: 0)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={formOpeningBalance}
                  onChange={(e) => setFormOpeningBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-[#0F4D32]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0F4D32] text-white font-bold text-sm hover:bg-[#0B3B26] active:scale-[0.98] transition-all shadow-xs"
            >
              Save Ledger Account
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
