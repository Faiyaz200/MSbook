import React, { useState, useEffect, useId } from 'react';
import {
  ArrowLeft,
  Calendar,
  FileText,
  AlertCircle,
  Hash,
  ArrowRightLeft,
  BookOpen,
  RotateCcw,
  Undo2,
  CheckCircle,
  Building,
  User,
  Package,
} from 'lucide-react';
import { Business, Customer, Supplier, VoucherType, VOUCHERS } from '../../types';
import { db } from '../../services/db';

interface VoucherDetailPlaceholderScreenProps {
  voucherType: VoucherType;
  activeBusiness: Business;
  onNavigateBack: () => void;
  onVoucherSaved?: () => void;
}

export const VoucherDetailPlaceholderScreen: React.FC<VoucherDetailPlaceholderScreenProps> = ({
  voucherType,
  activeBusiness,
  onNavigateBack,
  onVoucherSaved,
}) => {
  const meta = VOUCHERS[voucherType] || {
    type: voucherType,
    title: `${voucherType} Voucher`,
    subtitle: 'Accounting Voucher',
    defaultPrefix: voucherType.substring(0, 3),
    isPrimary: false,
    category: 'More',
  };

  const [voucherNumber, setVoucherNumber] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [amount, setAmount] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form IDs for accessibility
  const fromAccountId = useId();
  const toAccountId = useId();
  const debitAccountId = useId();
  const creditAccountId = useId();
  const supplierSelectId = useId();
  const customerSelectId = useId();
  const refundModeId = useId();
  const itemNameId = useId();
  const itemQtyId = useId();
  const itemRateId = useId();
  const amountInputId = useId();
  const remarksInputId = useId();

  // Contra fields
  const [contraFrom, setContraFrom] = useState<'Cash' | 'Bank' | 'UPI'>('Cash');
  const [contraTo, setContraTo] = useState<'Cash' | 'Bank' | 'UPI'>('Bank');

  // Journal fields
  const [journalDebit, setJournalDebit] = useState<string>('Office Expenses');
  const [journalCredit, setJournalCredit] = useState<string>('Cash Account');

  // Debit Note fields (Purchase Return to Supplier)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [customSupplierName, setCustomSupplierName] = useState<string>('');
  const [returnItemName, setReturnItemName] = useState<string>('');
  const [returnItemQty, setReturnItemQty] = useState<string>('1');
  const [returnItemRate, setReturnItemRate] = useState<string>('');

  // Credit Note fields (Sales Return from Customer)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('');
  const [refundMode, setRefundMode] = useState<'UDHAR_REDUCTION' | 'CASH' | 'BANK'>('UDHAR_REDUCTION');

  useEffect(() => {
    const vNum = db.generateNextVoucherNumber(activeBusiness.id, voucherType);
    setVoucherNumber(vNum);
    setCustomers(db.getCustomers(activeBusiness.id));
    setSuppliers(db.getSuppliers(activeBusiness.id));
  }, [activeBusiness.id, voucherType]);

  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const parsedAmount = parseFloat(amount) || 0;

  const handleSave = () => {
    setErrorMessage(null);

    if (parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than ₹0');
      return;
    }

    setIsSubmitting(true);

    try {
      if (voucherType === 'CONTRA') {
        if (contraFrom === contraTo) {
          throw new Error('Transfer source and destination accounts must be different');
        }
        db.saveContraVoucher({
          businessId: activeBusiness.id,
          fromAccount: contraFrom,
          toAccount: contraTo,
          amount: parsedAmount,
          remarks: remarks.trim() || `Contra transfer ${contraFrom} to ${contraTo}`,
        });
      } else if (voucherType === 'JOURNAL') {
        if (!journalDebit.trim() || !journalCredit.trim()) {
          throw new Error('Both Debit and Credit accounts must be specified');
        }
        if (journalDebit.trim().toLowerCase() === journalCredit.trim().toLowerCase()) {
          throw new Error('Debit and Credit accounts cannot be the same');
        }
        db.saveJournalVoucher({
          businessId: activeBusiness.id,
          debitAccountName: journalDebit.trim(),
          creditAccountName: journalCredit.trim(),
          amount: parsedAmount,
          narration: remarks.trim() || `Journal entry: ${journalDebit} / ${journalCredit}`,
        });
      } else if (voucherType === 'DEBIT_NOTE') {
        const sup = suppliers.find((s) => s.id === selectedSupplierId);
        const effectiveName = sup ? sup.name : customSupplierName.trim();
        if (!effectiveName) {
          throw new Error('Supplier name is required for Debit Note (Purchase Return)');
        }

        const items = returnItemName.trim()
          ? [
              {
                productName: returnItemName.trim(),
                quantity: parseFloat(returnItemQty) || 1,
                unit: 'pcs',
                rate: parseFloat(returnItemRate) || parsedAmount,
              },
            ]
          : undefined;

        db.saveDebitNote({
          businessId: activeBusiness.id,
          supplierId: sup?.id,
          supplierName: effectiveName,
          amount: parsedAmount,
          items,
          reason: remarks.trim() || 'Purchase return / supplier debit note',
        });
      } else if (voucherType === 'CREDIT_NOTE') {
        const cust = customers.find((c) => c.id === selectedCustomerId);
        const effectiveName = cust ? cust.name : customCustomerName.trim();
        if (!effectiveName) {
          throw new Error('Customer name is required for Credit Note (Sales Return)');
        }

        const items = returnItemName.trim()
          ? [
              {
                productName: returnItemName.trim(),
                quantity: parseFloat(returnItemQty) || 1,
                unit: 'pcs',
                rate: parseFloat(returnItemRate) || parsedAmount,
              },
            ]
          : undefined;

        db.saveCreditNote({
          businessId: activeBusiness.id,
          customerId: cust?.id,
          customerName: effectiveName,
          amount: parsedAmount,
          refundMode,
          items,
          reason: remarks.trim() || 'Sales return / customer credit note',
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        if (onVoucherSaved) {
          onVoucherSaved();
        } else {
          onNavigateBack();
        }
      }, 900);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to record voucher. Please verify entries.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none">
      {/* Top Header matching MSbook Emerald / Dark Green theme */}
      <div className="pt-4 px-5 pb-3 flex items-center justify-between border-b border-slate-100 bg-[#0F4D32] text-white">
        <button
          onClick={onNavigateBack}
          className="flex items-center text-white/90 hover:text-white transition-colors -ml-2 p-1.5 rounded-lg active:bg-white/10"
          title="Return to Vouchers"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span className="font-semibold text-sm">Back</span>
        </button>
        <div className="text-center min-w-0 px-2">
          <h2 className="font-bold text-sm truncate">{meta.title}</h2>
          <p className="text-[10px] text-emerald-200/80 truncate">
            {activeBusiness.businessName}
          </p>
        </div>
        <div className="w-12 text-right">
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/20 text-white font-bold">
            {voucherNumber || meta.defaultPrefix}
          </span>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {/* Success Banner */}
        {isSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center space-x-3 shadow-xs animate-in fade-in">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-xs">Voucher Saved Successfully!</p>
              <p className="text-[11px] text-emerald-700">
                Double-entry ledger postings have been completed.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Voucher Meta Particulars Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center">
              <Hash className="w-3.5 h-3.5 mr-1.5 text-[#0F4D32]" />
              Voucher No.
            </span>
            <span className="font-mono font-bold text-slate-800">{voucherNumber}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
            <span className="text-slate-500 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#0F4D32]" />
              Date
            </span>
            <span className="font-medium text-slate-700">{currentDateStr}</span>
          </div>
        </div>

        {/* CONTRA VOUCHER FORM */}
        {voucherType === 'CONTRA' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-[#0F4D32] font-bold text-xs uppercase tracking-wider">
              <ArrowRightLeft className="w-4 h-4" />
              <span>Contra Transfer Details</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={fromAccountId} className="block text-[11px] font-semibold text-slate-600 mb-1">
                  From Account (Source)
                </label>
                <select
                  id={fromAccountId}
                  value={contraFrom}
                  onChange={(e) => setContraFrom(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#0F4D32]"
                >
                  <option value="Cash">Cash Account</option>
                  <option value="Bank">Bank Account</option>
                  <option value="UPI">UPI Account</option>
                </select>
              </div>

              <div>
                <label htmlFor={toAccountId} className="block text-[11px] font-semibold text-slate-600 mb-1">
                  To Account (Destination)
                </label>
                <select
                  id={toAccountId}
                  value={contraTo}
                  onChange={(e) => setContraTo(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#0F4D32]"
                >
                  <option value="Bank">Bank Account</option>
                  <option value="Cash">Cash Account</option>
                  <option value="UPI">UPI Account</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F2F8F4] border border-[#0F4D32]/10 text-[11px] text-slate-700 space-y-1">
              <div className="font-semibold text-[#0F4D32]">Accounting Impact:</div>
              <div>• Debit (Deposit): {contraTo} Account (+₹{parsedAmount.toLocaleString('en-IN')})</div>
              <div>• Credit (Withdrawal): {contraFrom} Account (-₹{parsedAmount.toLocaleString('en-IN')})</div>
            </div>
          </div>
        )}

        {/* JOURNAL VOUCHER FORM */}
        {voucherType === 'JOURNAL' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-[#0F4D32] font-bold text-xs uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Double Entry Journal</span>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor={debitAccountId} className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Debit Account (Dr)
                </label>
                <input
                  id={debitAccountId}
                  type="text"
                  value={journalDebit}
                  onChange={(e) => setJournalDebit(e.target.value)}
                  placeholder="e.g. Office Rent / Depreciation / Salary"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#0F4D32]"
                />
              </div>

              <div>
                <label htmlFor={creditAccountId} className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Credit Account (Cr)
                </label>
                <input
                  id={creditAccountId}
                  type="text"
                  value={journalCredit}
                  onChange={(e) => setJournalCredit(e.target.value)}
                  placeholder="e.g. Cash Account / Bank / Outstanding Payable"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#0F4D32]"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F2F8F4] border border-[#0F4D32]/10 text-[11px] text-slate-700 space-y-1">
              <div className="font-semibold text-[#0F4D32]">Journal Balancing:</div>
              <div>• Dr {journalDebit || '[Account]'}: ₹{parsedAmount.toLocaleString('en-IN')}</div>
              <div>• Cr {journalCredit || '[Account]'}: ₹{parsedAmount.toLocaleString('en-IN')}</div>
            </div>
          </div>
        )}

        {/* DEBIT NOTE (PURCHASE RETURN) */}
        {voucherType === 'DEBIT_NOTE' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-[#0F4D32] font-bold text-xs uppercase tracking-wider">
              <Undo2 className="w-4 h-4" />
              <span>Purchase Return Details</span>
            </div>

            <div>
              <label htmlFor={supplierSelectId} className="block text-[11px] font-semibold text-slate-600 mb-1">
                Supplier
              </label>
              {suppliers.length > 0 ? (
                <select
                  id={supplierSelectId}
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#0F4D32]"
                >
                  <option value="">-- Choose Supplier or Enter Below --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.mobileNumber ? `(${s.mobileNumber})` : ''}
                    </option>
                  ))}
                </select>
              ) : null}

              {(!selectedSupplierId || suppliers.length === 0) && (
                <input
                  type="text"
                  value={customSupplierName}
                  onChange={(e) => setCustomSupplierName(e.target.value)}
                  placeholder="Supplier name"
                  className="w-full text-xs p-2.5 mt-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#0F4D32]"
                />
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 block mb-2">
                Item Returned (Optional - restores inventory automatically)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    id={itemNameId}
                    aria-label="Product Name"
                    type="text"
                    value={returnItemName}
                    onChange={(e) => setReturnItemName(e.target.value)}
                    placeholder="Product name"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <input
                    id={itemQtyId}
                    aria-label="Quantity"
                    type="number"
                    value={returnItemQty}
                    onChange={(e) => setReturnItemQty(e.target.value)}
                    placeholder="Qty"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 text-center"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F2F8F4] border border-[#0F4D32]/10 text-[11px] text-slate-700 space-y-1">
              <div className="font-semibold text-[#0F4D32]">Accounting Impact:</div>
              <div>• Reduces Supplier Payable debt by ₹{parsedAmount.toLocaleString('en-IN')}</div>
              <div>• Credits Purchase Account / reverses cost basis</div>
            </div>
          </div>
        )}

        {/* CREDIT NOTE (SALES RETURN) */}
        {voucherType === 'CREDIT_NOTE' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-[#0F4D32] font-bold text-xs uppercase tracking-wider">
              <RotateCcw className="w-4 h-4" />
              <span>Sales Return Details</span>
            </div>

            <div>
              <label htmlFor={customerSelectId} className="block text-[11px] font-semibold text-slate-600 mb-1">
                Customer
              </label>
              {customers.length > 0 ? (
                <select
                  id={customerSelectId}
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#0F4D32]"
                >
                  <option value="">-- Choose Customer or Enter Below --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.mobileNumber ? `(${c.mobileNumber})` : ''}
                    </option>
                  ))}
                </select>
              ) : null}

              {(!selectedCustomerId || customers.length === 0) && (
                <input
                  type="text"
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full text-xs p-2.5 mt-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#0F4D32]"
                />
              )}
            </div>

            <div>
              <label htmlFor={refundModeId} className="block text-[11px] font-semibold text-slate-600 mb-1">
                Refund Method
              </label>
              <select
                id={refundModeId}
                value={refundMode}
                onChange={(e) => setRefundMode(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#0F4D32]"
              >
                <option value="UDHAR_REDUCTION">Reduce Customer Credit / Outstanding Balance</option>
                <option value="CASH">Refund Cash Immediately</option>
                <option value="BANK">Refund via Bank / UPI</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 block mb-2">
                Item Returned (Optional - increments stock back into inventory)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    value={returnItemName}
                    onChange={(e) => setReturnItemName(e.target.value)}
                    placeholder="Product name"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={returnItemQty}
                    onChange={(e) => setReturnItemQty(e.target.value)}
                    placeholder="Qty"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 text-center"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F2F8F4] border border-[#0F4D32]/10 text-[11px] text-slate-700 space-y-1">
              <div className="font-semibold text-[#0F4D32]">Accounting Impact:</div>
              <div>• Reverses Sales Revenue by ₹{parsedAmount.toLocaleString('en-IN')}</div>
              <div>• {refundMode === 'UDHAR_REDUCTION' ? 'Reduces Customer Receivable' : `Disburses ${refundMode} Refund`}</div>
            </div>
          </div>
        )}

        {/* AMOUNT & REMARKS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
          <div>
            <label htmlFor={amountInputId} className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
              Total Transaction Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-[#0F4D32]">₹</span>
              <input
                id={amountInputId}
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className="w-full pl-8 pr-4 py-2.5 text-lg font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
          </div>

          <div>
            <label htmlFor={remarksInputId} className="block text-[11px] font-semibold text-slate-600 mb-1">
              Remarks / Narration
            </label>
            <input
              id={remarksInputId}
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional description"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0F4D32]"
            />
          </div>
        </div>
      </div>

      {/* Bottom Sticky Save Bar */}
      <div className="p-4 bg-white border-t border-slate-100 shadow-sm">
        <button
          onClick={handleSave}
          disabled={isSubmitting || parsedAmount <= 0}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 ${
            isSubmitting || parsedAmount <= 0
              ? 'bg-[#0F4D32]/40 text-white cursor-not-allowed'
              : 'bg-[#0F4D32] hover:bg-[#0B3B26] text-white active:scale-[0.99] cursor-pointer'
          }`}
        >
          <span>{isSubmitting ? 'Recording Ledger...' : `Save ${meta.title}`}</span>
        </button>
      </div>
    </div>
  );
};
