import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react';
import { Business } from '../../types';
import { db } from '../../services/db';

interface PurchaseVoucherScreenProps {
  activeBusiness: Business;
  preSelectedSupplierId?: string;
  onNavigateBack: () => void;
  onPurchaseSaved: () => void;
}

interface PurchaseItem {
  productName: string;
  quantity: number;
  unit: string;
  purchaseCost: number;
}

export const PurchaseVoucherScreen: React.FC<PurchaseVoucherScreenProps> = ({
  activeBusiness,
  preSelectedSupplierId,
  onNavigateBack,
  onPurchaseSaved,
}) => {
  const [voucherNumber, setVoucherNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | undefined>(preSelectedSupplierId);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [unit, setUnit] = useState(activeBusiness.businessType === 'KIRANA' ? 'kg' : 'pcs');
  const [purchaseCost, setPurchaseCost] = useState('');

  const [items, setItems] = useState<PurchaseItem[]>([]);

  const [cashAmount, setCashAmount] = useState('0');
  const [upiAmount, setUpiAmount] = useState('0');
  const [bankAmount, setBankAmount] = useState('0');
  const [creditAmount, setCreditAmount] = useState('0');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const no = db.generateNextVoucherNumber(activeBusiness.id, 'PURCHASE');
    setVoucherNumber(no);
    const existingSuppliers = db.getSuppliers(activeBusiness.id);
    setSuppliers(existingSuppliers);

    if (preSelectedSupplierId) {
      const match = existingSuppliers.find((s) => s.id === preSelectedSupplierId);
      if (match) {
        setSupplierName(match.name);
        setSelectedSupplierId(match.id);
      }
    }
  }, [activeBusiness.id, preSelectedSupplierId]);

  const totalAmount = items.reduce((sum, it) => sum + it.quantity * it.purchaseCost, 0);
  const numCash = parseFloat(cashAmount) || 0;
  const numUpi = parseFloat(upiAmount) || 0;
  const numBank = parseFloat(bankAmount) || 0;
  const numCredit = parseFloat(creditAmount) || 0;
  const totalAllocated = numCash + numUpi + numBank + numCredit;

  const isBalanced = items.length > 0 && Math.abs(totalAmount - totalAllocated) < 0.05;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = productName.trim();
    const qty = parseFloat(quantity) || 0;
    const cost = parseFloat(purchaseCost) || 0;

    if (!name || qty <= 0 || cost <= 0) {
      setErrorMessage('Please fill product name, quantity, and cost price');
      return;
    }

    const newItem: PurchaseItem = {
      productName: name,
      quantity: qty,
      unit,
      purchaseCost: cost,
    };

    const nextItems = [...items, newItem];
    setItems(nextItems);
    const nextTotal = nextItems.reduce((s, it) => s + it.quantity * it.purchaseCost, 0);

    setProductName('');
    setQuantity('10');
    setPurchaseCost('');
    setErrorMessage(null);

    if (items.length === 0) {
      setCashAmount(nextTotal.toString());
    }
  };

  const handleSave = () => {
    if (!supplierName.trim()) {
      setErrorMessage('Please enter supplier name');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Add at least one item');
      return;
    }
    if (!isBalanced) {
      setErrorMessage(`Payment allocations (₹${totalAllocated}) must equal total (₹${totalAmount})`);
      return;
    }

    setIsSaving(true);
    try {
      db.savePurchaseVoucher({
        businessId: activeBusiness.id,
        supplierId: selectedSupplierId,
        supplierName: supplierName.trim(),
        items,
        cashAmount: numCash,
        upiAmount: numUpi,
        bankAmount: numBank,
        creditAmount: numCredit,
      });

      onPurchaseSaved();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save purchase');
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
            <h2 className="font-bold text-slate-900 text-sm leading-tight">Purchase Voucher</h2>
            <span className="text-[10px] font-mono font-bold text-[#0F4D32]">{voucherNumber}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-[#0F4D32]">{activeBusiness.businessName}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-xs text-red-600 font-medium">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Supplier Input */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
          <label className="text-xs font-bold text-slate-800 block">Supplier / Vendor *</label>
          {suppliers.length > 0 && (
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
              {suppliers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSupplierName(s.name);
                    setSelectedSupplierId(s.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors ${
                    supplierName === s.name
                      ? 'bg-[#0F4D32] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            placeholder="Type or select supplier name *"
            value={supplierName}
            onChange={(e) => {
              setSupplierName(e.target.value);
              const match = suppliers.find(
                (s) => s.name.toLowerCase() === e.target.value.trim().toLowerCase()
              );
              setSelectedSupplierId(match ? match.id : undefined);
            }}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
          />
        </div>

        {/* Item Entry */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800">Add Stock to Inventory</h3>

          <input
            type="text"
            placeholder="Item / Product Name *"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
          />

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32] font-semibold"
              >
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="ltr">ltr</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Cost Price (₹)</label>
              <input
                type="number"
                placeholder="Rate"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-2 bg-[#0F4D32] text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Purchase</span>
          </button>
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800">Items ({items.length})</span>
              <span className="text-xs font-bold text-[#0F4D32]">Total: ₹{totalAmount}</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {items.map((it, idx) => (
                <div key={idx} className="py-2 flex justify-between">
                  <span>
                    {it.productName} ({it.quantity} {it.unit} @ ₹{it.purchaseCost})
                  </span>
                  <span className="font-bold">₹{it.quantity * it.purchaseCost}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Allocation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800">Payment Allocation to Supplier</h3>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Cash Paid (₹)</label>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">UPI Paid (₹)</label>
              <input
                type="number"
                value={upiAmount}
                onChange={(e) => setUpiAmount(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Bank Paid (₹)</label>
              <input
                type="number"
                value={bankAmount}
                onChange={(e) => setBankAmount(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Supplier Credit (₹)</label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
          </div>

          <div className="p-2.5 bg-[#F2F8F4] rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600">Total Allocated</span>
            <span className={`font-bold ${isBalanced ? 'text-[#0F4D32]' : 'text-red-600'}`}>
              ₹{totalAllocated} / ₹{totalAmount}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 bg-white border-t border-slate-100 shadow-sm shrink-0">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isBalanced || isSaving}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-sm ${
            isBalanced && !isSaving
              ? 'bg-[#0F4D32] text-white hover:bg-[#0B3B26]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? <span>Saving Purchase...</span> : <span>Save Purchase • ₹{totalAmount}</span>}
        </button>
      </div>
    </div>
  );
};
