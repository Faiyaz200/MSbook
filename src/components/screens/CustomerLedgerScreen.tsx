import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Plus,
  Search,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ArrowDownLeft,
} from 'lucide-react';
import { Business, Customer, CustomerLedgerSummary } from '../../types';
import { db } from '../../services/db';

interface CustomerLedgerScreenProps {
  activeBusiness: Business;
  initialCustomerId?: string;
  onNavigateBack: () => void;
  onNavigateToReceipt?: (customerId?: string) => void;
}

export const CustomerLedgerScreen: React.FC<CustomerLedgerScreenProps> = ({
  activeBusiness,
  initialCustomerId,
  onNavigateBack,
  onNavigateToReceipt,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialCustomerId || null);
  const [ledgerSummary, setLedgerSummary] = useState<CustomerLedgerSummary | null>(null);

  // Add / Edit Modal or Panel state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formOpeningBalance, setFormOpeningBalance] = useState('0');
  const [formError, setFormError] = useState<string | null>(null);

  const loadCustomers = () => {
    const list = db.getCustomers(activeBusiness.id);
    setCustomers(list);
    if (list.length > 0) {
      if (initialCustomerId && list.some((c) => c.id === initialCustomerId)) {
        setSelectedCustomerId(initialCustomerId);
      } else if (!selectedCustomerId || !list.some((c) => c.id === selectedCustomerId)) {
        setSelectedCustomerId(list[0].id);
      }
    } else {
      setSelectedCustomerId(null);
      setLedgerSummary(null);
    }
  };

  useEffect(() => {
    loadCustomers();
    const unsub = db.subscribe(() => {
      loadCustomers();
    });
    return () => unsub();
  }, [activeBusiness.id]);

  useEffect(() => {
    if (selectedCustomerId) {
      try {
        const summary = db.getCustomerLedger(activeBusiness.id, selectedCustomerId);
        setLedgerSummary(summary);
      } catch {
        setLedgerSummary(null);
      }
    } else {
      setLedgerSummary(null);
    }
  }, [selectedCustomerId, activeBusiness.id, customers]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobileNumber.includes(searchQuery)
  );

  const openAddForm = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormMobile('');
    setFormAddress('');
    setFormOpeningBalance('0');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormMobile(c.mobileNumber || '');
    setFormAddress(c.address || '');
    setFormOpeningBalance((c.openingBalance || 0).toString());
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Customer name is required');
      return;
    }

    const openingBal = parseFloat(formOpeningBalance) || 0;

    try {
      if (editingCustomer) {
        db.updateCustomer(editingCustomer.id, {
          name: formName.trim(),
          mobileNumber: formMobile.trim(),
          address: formAddress.trim(),
          openingBalance: openingBal,
        });
      } else {
        const created = db.createCustomer({
          businessId: activeBusiness.id,
          name: formName.trim(),
          mobileNumber: formMobile.trim(),
          address: formAddress.trim(),
          openingBalance: openingBal,
        });
        setSelectedCustomerId(created.id);
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save customer');
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
            <h2 className="font-bold text-slate-900 text-sm leading-tight">Customer Ledger</h2>
            <span className="text-[10px] text-slate-400">Account Statements & Credit</span>
          </div>
        </div>

        <button
          onClick={openAddForm}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0F4D32] text-white rounded-xl text-xs font-semibold hover:bg-[#0B3B26] active:scale-[0.97] transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {customers.length === 0 ? (
          /* Empty State Matching Requirement 3 */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs my-auto flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-[#F2F8F4] flex items-center justify-center text-[#0F4D32] mb-3 border border-[#0F4D32]/10">
              <User className="w-7 h-7 text-black stroke-[1.8px]" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              No customers added yet.
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[240px] leading-relaxed">
              Add customers to track their purchases, credit balances, and payment receipts.
            </p>
            <button
              onClick={openAddForm}
              className="mt-5 flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0F4D32] text-white font-semibold text-xs hover:bg-[#0B3B26] active:scale-[0.98] transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        ) : (
          <>
            {/* Search Bar & Customer Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer name or mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0F4D32]"
                />
              </div>

              {/* Customer Selector Pills */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                {filteredCustomers.map((c) => {
                  const isSelected = c.id === selectedCustomerId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#0F4D32] text-white shadow-xs'
                          : 'bg-[#F2F8F4] text-[#0F4D32] hover:bg-emerald-100'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Customer Statement */}
            {ledgerSummary && (
              <>
                {/* Customer Details Card with Edit Option */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-base text-slate-900">
                          {ledgerSummary.customer.name}
                        </h3>
                        <button
                          onClick={() => openEditForm(ledgerSummary.customer)}
                          className="p-1 rounded-lg text-slate-400 hover:text-[#0F4D32] hover:bg-slate-50 transition-colors"
                          title="Edit Customer Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                        {ledgerSummary.customer.mobileNumber ? (
                          <span className="flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-[#0F4D32]" />
                            {ledgerSummary.customer.mobileNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No mobile</span>
                        )}

                        {ledgerSummary.customer.address ? (
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-[#0F4D32]" />
                            {ledgerSummary.customer.address}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No address</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Outstanding Due
                      </span>
                      <span
                        className={`font-mono text-lg font-bold ${
                          ledgerSummary.totalOutstanding > 0 ? 'text-amber-700' : 'text-[#0F4D32]'
                        }`}
                      >
                        ₹{ledgerSummary.totalOutstanding.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action: Receive Payment */}
                  {ledgerSummary.totalOutstanding > 0 && onNavigateToReceipt && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Collect pending balance:</span>
                      <button
                        onClick={() => onNavigateToReceipt(ledgerSummary.customer.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Receive Payment</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Account Summary Metrics */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Ledger Summary
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E8F5E9] text-[#0F4D32]">
                      {ledgerSummary.transactions.length} Transactions
                    </span>
                  </div>

                  {/* Opening Balance Separated from Entries */}
                  <div className="p-2.5 rounded-xl bg-[#F8FAF8] border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">Opening Balance</span>
                      <p className="text-[10px] text-slate-500">Initial balance at customer registration</p>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ₹{(ledgerSummary.openingBalance || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Summary Totals */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 block">Total Sales (Debit)</span>
                      <span className="font-mono text-sm font-bold text-slate-900 mt-0.5 block">
                        ₹{ledgerSummary.totalSales.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <span className="text-[11px] font-bold text-emerald-800 block">Total Received (Credit)</span>
                      <span className="font-mono text-sm font-bold text-[#0F4D32] mt-0.5 block">
                        ₹{ledgerSummary.totalReceived.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ledger Transactions Statement */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 px-1">
                    Transaction History
                  </h4>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    {ledgerSummary.transactions.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No transactions recorded for this customer yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {ledgerSummary.transactions.map((tx) => (
                          <div key={tx.voucherId} className="p-3.5 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900">{tx.voucherNumber}</span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    tx.voucherType === 'RECEIPT'
                                      ? 'bg-emerald-100 text-[#0F4D32]'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {tx.voucherType}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {new Date(tx.date).toLocaleDateString('en-IN')}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 line-clamp-1">
                              {tx.productDetails}
                            </p>

                            <div className="pt-1 flex items-center justify-between text-[11px] font-mono border-t border-slate-50">
                              <div className="space-x-3 text-slate-500">
                                {tx.debit > 0 && (
                                  <span>
                                    Debit: <strong className="text-slate-800">₹{tx.debit}</strong>
                                  </span>
                                )}
                                {tx.credit > 0 && (
                                  <span>
                                    Credit: <strong className="text-emerald-700">₹{tx.credit}</strong>
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-slate-400 font-sans text-[10px] mr-1">Bal:</span>
                                <strong
                                  className={tx.runningBalance > 0 ? 'text-amber-700' : 'text-[#0F4D32]'}
                                >
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
          </>
        )}
      </div>

      {/* Add / Edit Customer Form Full Screen / Slide Panel (No dialog popup) */}
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
            <h3 className="font-bold text-sm text-slate-900">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <div className="w-14" />
          </div>

          <form onSubmit={handleSaveCustomer} className="flex-1 overflow-y-auto p-5 space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-xs">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Trading, Mahesh Bhai"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0F4D32]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={formMobile}
                  onChange={(e) => setFormMobile(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0F4D32]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Address (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Street, market, or area"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0F4D32]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Opening Balance (₹) (Default: 0)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formOpeningBalance}
                  onChange={(e) => setFormOpeningBalance(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-[#0F4D32]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Existing pending due balance at time of creating customer.
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#0F4D32] text-white font-bold text-sm hover:bg-[#0B3B26] active:scale-[0.98] transition-all shadow-xs"
            >
              {editingCustomer ? 'Update Customer' : 'Save Customer'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
