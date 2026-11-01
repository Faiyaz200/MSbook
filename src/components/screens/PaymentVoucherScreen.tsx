import React, { useState, useEffect } from 'react';
import { ArrowLeft, Truck, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Business, Supplier } from '../../types';
import { db } from '../../services/db';

interface PaymentVoucherScreenProps {
  activeBusiness: Business;
  preSelectedSupplierId?: string;
  onNavigateBack: () => void;
  onPaymentSaved: () => void;
}

export const PaymentVoucherScreen: React.FC<PaymentVoucherScreenProps> = ({
  activeBusiness,
  preSelectedSupplierId,
  onNavigateBack,
  onPaymentSaved,
}) => {
  const [voucherNumber, setVoucherNumber] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierPayable, setSupplierPayable] = useState(0);

  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank'>('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [remarks, setRemarks] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const no = db.generateNextVoucherNumber(activeBusiness.id, 'PAYMENT');
    setVoucherNumber(no);
    const list = db.getSuppliers(activeBusiness.id);
    setSuppliers(list);
    if (list.length > 0) {
      const target = preSelectedSupplierId || list[0].id;
      setSelectedSupplierId(target);
    }
  }, [activeBusiness.id, preSelectedSupplierId]);

  useEffect(() => {
    if (selectedSupplierId) {
      try {
        const ledger = db.getSupplierLedger(activeBusiness.id, selectedSupplierId);
        setSupplierPayable(ledger.totalPayable);
        if (!amount && ledger.totalPayable > 0) {
          setAmount(ledger.totalPayable.toString());
        }
      } catch {
        setSupplierPayable(0);
      }
    }
  }, [selectedSupplierId, activeBusiness.id]);

  const numAmount = parseFloat(amount) || 0;
  const newPayable = Math.max(0, supplierPayable - numAmount);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setErrorMessage('Please select a supplier');
      return;
    }
    if (numAmount <= 0) {
      setErrorMessage('Payment amount must be greater than zero');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId)!;
      db.savePaymentVoucher({
        businessId: activeBusiness.id,
        supplier,
        amount: numAmount,
        paymentMode,
        referenceNo: referenceNo.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      onPaymentSaved();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save payment voucher');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
      {/* Top Header */}
      <div className="pt-3 px-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-white min-h-[56px] shrink-0 shadow-xs">
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
            <h2 className="font-bold text-slate-900 text-sm leading-tight">Payment Voucher</h2>
            <span className="text-[10px] text-slate-400">Make Supplier Payment</span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono text-xs font-bold text-slate-900 block">{voucherNumber}</span>
          <span className="text-[10px] text-slate-400">Auto Number</span>
        </div>
      </div>

      {/* Main Form Body */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Supplier Selection Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 flex items-center">
              <Truck className="w-4 h-4 mr-1.5 text-[#0F4D32]" />
              Select Supplier / Vendor
            </label>
            <span className="text-[11px] font-semibold text-slate-500">
              {suppliers.length} Registered
            </span>
          </div>

          {suppliers.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              No suppliers added yet. Please add a supplier first from the Supplier Ledger or Purchase Voucher.
            </div>
          ) : (
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0F4D32] bg-white font-medium"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.mobileNumber ? `(${s.mobileNumber})` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Current Supplier Due Card */}
          {selectedSupplierId && (
            <div className="p-3 rounded-xl bg-[#F8FAF8] border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Current Payable Due</span>
                <p className="font-mono text-base font-bold text-rose-700 mt-0.5">
                  ₹{supplierPayable.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-medium">Remaining After Payment</span>
                <p className="font-mono text-base font-bold text-[#0F4D32] mt-0.5">
                  ₹{newPayable.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Amount & Mode */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1">
              Payment Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="any"
              required
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-lg font-mono font-bold focus:outline-none focus:border-[#0F4D32]"
            />
          </div>

          {/* Payment Mode Selector */}
          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1.5">
              Disbursement Account (Payment Mode)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'UPI', 'Bank'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2.5 rounded-xl font-bold text-xs transition-all border ${
                    paymentMode === mode
                      ? 'bg-[#0F4D32] text-white border-[#0F4D32] shadow-xs'
                      : 'bg-[#F8FAF8] text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Reference / Cheque / UTR No. (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. UTR-982138129 or Cheque #00123"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0F4D32]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Cleared bill PUR-2026-0001"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0F4D32]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving || suppliers.length === 0}
          className="w-full py-3.5 rounded-2xl bg-[#0F4D32] text-white font-bold text-sm hover:bg-[#0B3B26] active:scale-[0.98] transition-all shadow-xs disabled:opacity-50"
        >
          {isSaving ? 'Recording Payment...' : `Record Payment of ₹${numAmount.toLocaleString('en-IN')}`}
        </button>
      </form>
    </div>
  );
};
