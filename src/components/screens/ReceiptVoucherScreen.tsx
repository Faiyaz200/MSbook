import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Business, Customer } from '../../types';
import { db } from '../../services/db';

interface ReceiptVoucherScreenProps {
  activeBusiness: Business;
  preSelectedCustomerId?: string;
  onNavigateBack: () => void;
  onReceiptSaved: () => void;
}

export const ReceiptVoucherScreen: React.FC<ReceiptVoucherScreenProps> = ({
  activeBusiness,
  preSelectedCustomerId,
  onNavigateBack,
  onReceiptSaved,
}) => {
  const [receiptNumber, setReceiptNumber] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerOutstanding, setCustomerOutstanding] = useState(0);

  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank'>('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const no = db.generateNextVoucherNumber(activeBusiness.id, 'RECEIPT');
    setReceiptNumber(no);
    const list = db.getCustomers(activeBusiness.id);
    setCustomers(list);
    if (list.length > 0) {
      const target = preSelectedCustomerId || list[0].id;
      setSelectedCustomerId(target);
    }
  }, [activeBusiness.id, preSelectedCustomerId]);

  useEffect(() => {
    if (selectedCustomerId) {
      try {
        const ledger = db.getCustomerLedger(activeBusiness.id, selectedCustomerId);
        setCustomerOutstanding(ledger.totalOutstanding);
        if (!amount && ledger.totalOutstanding > 0) {
          setAmount(ledger.totalOutstanding.toString());
        }
      } catch {
        setCustomerOutstanding(0);
      }
    }
  }, [selectedCustomerId, activeBusiness.id]);

  const numAmount = parseFloat(amount) || 0;
  const newOutstanding = Math.max(0, customerOutstanding - numAmount);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setErrorMessage('Please select a customer');
      return;
    }
    if (numAmount <= 0) {
      setErrorMessage('Receipt amount must be greater than zero');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const customer = customers.find((c) => c.id === selectedCustomerId)!;
      db.saveReceiptVoucher({
        businessId: activeBusiness.id,
        customer,
        amount: numAmount,
        paymentMode,
        referenceNo: referenceNo.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      onReceiptSaved();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save receipt');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
      {/* Top Header */}
      <div className="pt-3 px-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-white min-h-[56px] shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateBack}
            className="flex items-center text-[#0F4D32] hover:text-[#0B3B26] p-1.5 rounded-lg -ml-1.5"
            title="Back to Vouchers"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="font-semibold text-sm">Back</span>
          </button>
          <div className="ml-1">
            <h2 className="font-bold text-slate-900 text-sm leading-tight">Receipt Voucher</h2>
            <span className="text-[10px] font-mono font-bold text-[#0F4D32]">{receiptNumber}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-[#0F4D32]">{activeBusiness.businessName}</span>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-xs text-red-600 font-medium">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Customer & Current Balance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
            <User className="w-4 h-4 text-[#0F4D32]" />
            <span>Select Customer *</span>
          </label>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.mobileNumber ? `(${c.mobileNumber})` : ''}
              </option>
            ))}
          </select>

          {/* Outstanding Balance Comparison */}
          <div className="p-3 bg-[#F2F8F4] rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Current Outstanding</span>
              <span className="font-bold text-amber-700 text-sm">₹{customerOutstanding}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Balance After Receipt</span>
              <span className="font-bold text-[#0F4D32] text-sm">₹{newOutstanding}</span>
            </div>
          </div>
        </div>

        {/* Receipt Amount & Mode */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Receipt Amount (₹) *</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'UPI', 'Bank'] as const).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    paymentMode === mode
                      ? 'bg-[#0F4D32] text-white border-[#0F4D32]'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Reference / UTR / Cheque No.</label>
            <input
              type="text"
              placeholder="e.g. UPI-982348234"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">Remarks</label>
            <input
              type="text"
              placeholder="e.g. Cleared bill 003 partially"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
            />
          </div>
        </div>

        {/* Double Entry Note */}
        <div className="p-3 bg-[#F2F8F4] border border-[#0F4D32]/20 rounded-xl text-xs text-slate-600">
          <span className="font-bold text-[#0F4D32] block mb-0.5">Automatic Accounting:</span>
          <span>
            Debit: {paymentMode} Account ₹{numAmount} • Credit: Customer Receivable ₹{numAmount} (Reduces customer debt; not counted as sale).
          </span>
        </div>
      </form>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 bg-white border-t border-slate-100 shadow-sm shrink-0">
        <button
          type="button"
          onClick={handleSave}
          disabled={numAmount <= 0 || isSaving}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-sm ${
            numAmount > 0 && !isSaving
              ? 'bg-[#0F4D32] text-white hover:bg-[#0B3B26]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <span>Saving Receipt...</span>
          ) : (
            <span>Save Receipt Voucher • ₹{numAmount}</span>
          )}
        </button>
      </div>
    </div>
  );
};
