import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, AlertCircle, Trash2, Package } from 'lucide-react';
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
  purchaseCost: number; // cost per unit
  sellingPrice: number; // selling price per unit
  totalCost: number;
  packetInfo?: string;
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

  // Item form states
  const [productName, setProductName] = useState('');
  const [unit, setUnit] = useState('pcs');
  
  // Packet calculations
  const [isPacketMode, setIsPacketMode] = useState(true);
  const [packetsCount, setPacketsCount] = useState('2');
  const [pcsPerPacket, setPcsPerPacket] = useState('22');
  const [quantity, setQuantity] = useState('44');
  
  // Cost: user enters packet rate or unit rate (labeled as "Cost")
  const [costInput, setCostInput] = useState('176');
  // Selling rate per pc/unit
  const [sellingRate, setSellingRate] = useState('10');

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

  // Auto-calculate quantity from packetsCount and pcsPerPacket
  useEffect(() => {
    if (unit === 'pcs' && isPacketMode) {
      const p = parseFloat(packetsCount) || 0;
      const pcs = parseFloat(pcsPerPacket) || 0;
      if (p > 0 && pcs > 0) {
        setQuantity((p * pcs).toString());
      }
    }
  }, [packetsCount, pcsPerPacket, isPacketMode, unit]);

  // Total purchase amount of items
  const totalAmount = items.reduce((sum, it) => sum + it.totalCost, 0);
  const numCash = parseFloat(cashAmount) || 0;
  const numUpi = parseFloat(upiAmount) || 0;
  const numBank = parseFloat(bankAmount) || 0;
  const numCredit = parseFloat(creditAmount) || 0;
  const totalAllocated = numCash + numUpi + numBank + numCredit;

  const isBalanced = items.length > 0 && Math.abs(totalAmount - totalAllocated) < 0.05;

  // Handle Add Item with Same Name & Selling Rate validation
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const name = productName.trim();
    if (!name) {
      setErrorMessage('Kripya Product / Item ka naam dalein');
      return;
    }

    const sRate = parseFloat(sellingRate) || 0;
    if (sRate <= 0) {
      setErrorMessage('Kripya Selling Rate (₹) dalein');
      return;
    }

    let finalQty = parseFloat(quantity) || 0;
    let finalTotalCost = 0;
    let unitCost = 0;
    let packetNote = '';

    const costVal = parseFloat(costInput) || 0;
    if (costVal <= 0) {
      setErrorMessage('Kripya Cost dalein');
      return;
    }

    if (unit === 'pcs' && isPacketMode) {
      const pCount = parseFloat(packetsCount) || 0;
      const pcsCount = parseFloat(pcsPerPacket) || 0;
      if (pCount <= 0 || pcsCount <= 0) {
        setErrorMessage('Kripya Packets aur Pcs per Packet ki quantity dalein');
        return;
      }
      finalQty = pCount * pcsCount;
      // costInput is cost per packet (e.g. 176 * 2 = 352)
      finalTotalCost = costVal * pCount;
      unitCost = finalQty > 0 ? finalTotalCost / finalQty : 0;
      packetNote = `${pCount} Pkt × ${pcsCount} Pcs = ${finalQty} pcs (@ ₹${costVal}/pkt)`;
    } else {
      if (finalQty <= 0) {
        setErrorMessage('Kripya valid Quantity dalein');
        return;
      }
      unitCost = costVal;
      finalTotalCost = finalQty * unitCost;
    }

    // --- REQUIREMENT: Duplicate Stock Name (First 5 letters check) ---
    // If first 5 letters match AND selling rate is identical -> BLOCK IT!
    // If selling rate is different (e.g. ₹10 vs ₹5) -> ALLOW IT!
    const cleanName = name.toLowerCase();
    const prefix5 = cleanName.length >= 5 ? cleanName.substring(0, 5) : cleanName;

    const existingProducts = db.getProducts(activeBusiness.id);
    const dupInDb = existingProducts.find((p) => {
      const pClean = p.name.trim().toLowerCase();
      const pPrefix5 = pClean.length >= 5 ? pClean.substring(0, 5) : pClean;
      if (pPrefix5 === prefix5) {
        // If selling rate matches identical rate
        if (Math.abs((p.sellingPrice || 0) - sRate) < 0.01) {
          return true;
        }
      }
      return false;
    });

    const dupInCurrentItems = items.find((it) => {
      const itClean = it.productName.trim().toLowerCase();
      const itPrefix5 = itClean.length >= 5 ? itClean.substring(0, 5) : itClean;
      if (itPrefix5 === prefix5) {
        if (Math.abs((it.sellingPrice || 0) - sRate) < 0.01) {
          return true;
        }
      }
      return false;
    });

    if (dupInDb || dupInCurrentItems) {
      const conflictName = dupInDb ? dupInDb.name : dupInCurrentItems?.productName;
      setErrorMessage(
        `Duplicate stock item! '${conflictName}' pehle se maujood hai jiska selling rate bhi ₹${sRate} hai. Same selling rate ke sath duplicate item add nahi ho sakta. (Agar selling rate alag hai to add ho sakta hai).`
      );
      return;
    }

    const newItem: PurchaseItem = {
      productName: name,
      quantity: finalQty,
      unit,
      purchaseCost: unitCost,
      sellingPrice: sRate,
      totalCost: finalTotalCost,
      packetInfo: packetNote,
    };

    const nextItems = [...items, newItem];
    setItems(nextItems);
    const nextTotal = nextItems.reduce((s, it) => s + it.totalCost, 0);

    // Reset item form
    setProductName('');
    if (items.length === 0) {
      setCashAmount(nextTotal.toString());
      setUpiAmount('0');
      setBankAmount('0');
      setCreditAmount('0');
    }
  };

  const handleRemoveItem = (index: number) => {
    const next = items.filter((_, idx) => idx !== index);
    setItems(next);
    const nextTotal = next.reduce((s, it) => s + it.totalCost, 0);
    setCashAmount(nextTotal.toString());
    setUpiAmount('0');
    setBankAmount('0');
    setCreditAmount('0');
  };

  const handleSave = () => {
    if (!supplierName.trim()) {
      setErrorMessage('Kripya Supplier ka naam dalein');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Kam se kam ek item add karein');
      return;
    }
    if (!isBalanced) {
      setErrorMessage(`Payment allocation (₹${totalAllocated}) purchase total (₹${totalAmount}) ke barabar hona chahiye`);
      return;
    }

    setIsSaving(true);
    try {
      db.savePurchaseVoucher({
        businessId: activeBusiness.id,
        supplierId: selectedSupplierId,
        supplierName: supplierName.trim(),
        items: items.map((it) => ({
          productName: it.productName,
          quantity: it.quantity,
          unit: it.unit,
          purchaseCost: it.purchaseCost,
          sellingPrice: it.sellingPrice,
        })),
        cashAmount: numCash,
        upiAmount: numUpi,
        bankAmount: numBank,
        creditAmount: numCredit,
      });

      onPurchaseSaved();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Purchase save karne me truti aayi');
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
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start text-xs text-red-600 font-medium">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
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

        {/* Item Entry Box with Packet Calculations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">Add Stock to Inventory</h3>
            {unit === 'pcs' && (
              <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={isPacketMode}
                  onChange={(e) => setIsPacketMode(e.target.checked)}
                  className="rounded text-[#0F4D32] focus:ring-0"
                />
                <span>Packet Box Calc</span>
              </label>
            )}
          </div>

          <input
            type="text"
            placeholder="Item / Product Name * (e.g. Parle-G)"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
          />

          {/* Unit Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-500 font-semibold">Unit:</span>
            {(['pcs', 'kg', 'ltr'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  unit === u
                    ? 'bg-[#0F4D32] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Packet / Box Calculations (if unit is pcs and packet mode on) */}
          {unit === 'pcs' && isPacketMode ? (
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">
                    No. of Packets
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2"
                    value={packetsCount}
                    onChange={(e) => setPacketsCount(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:border-[#0F4D32] font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">
                    Pcs in 1 Packet
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 22"
                    value={pcsPerPacket}
                    onChange={(e) => setPcsPerPacket(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:border-[#0F4D32] font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Auto Calculated Total Quantity */}
              <div className="flex items-center justify-between text-xs bg-white/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                <span className="text-slate-600">Total Quantity:</span>
                <span className="font-mono font-bold text-[#0F4D32]">
                  {quantity} Pcs ({packetsCount || 0} pkt × {pcsPerPacket || 0} pcs)
                </span>
              </div>

              {/* Cost & Selling Rate */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">
                    Cost (₹ per Packet)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 176"
                    value={costInput}
                    onChange={(e) => setCostInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:border-[#0F4D32] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-semibold block mb-0.5">
                    Selling Rate (₹ per Pc) *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={sellingRate}
                    onChange={(e) => setSellingRate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:border-[#0F4D32] font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Live Purchase Calculation Summary */}
              {parseFloat(packetsCount) > 0 && parseFloat(costInput) > 0 && (
                <div className="text-[11px] text-slate-600 pt-1 border-t border-emerald-200/60 flex items-center justify-between">
                  <span>
                    Total Cost: ₹{costInput} × {packetsCount} pkt
                  </span>
                  <span className="font-bold text-[#0F4D32]">
                    = ₹{(parseFloat(costInput) * parseFloat(packetsCount)).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Direct Quantity & Cost Mode (for kg, ltr, or direct pcs) */
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Cost (₹)</label>
                <input
                  type="number"
                  placeholder="Rate"
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Selling Rate (₹)</label>
                <input
                  type="number"
                  placeholder="Sell Rate"
                  value={sellingRate}
                  onChange={(e) => setSellingRate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32] font-mono font-bold text-emerald-800"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-2.5 bg-[#0F4D32] hover:bg-[#0B3B26] text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Purchase</span>
          </button>
        </div>

        {/* Added Items List */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800">Items ({items.length})</span>
              <span className="text-xs font-bold text-[#0F4D32]">Purchase Total: ₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {items.map((it, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">{it.productName}</p>
                    <p className="text-[11px] text-slate-500">
                      {it.quantity} {it.unit} • Unit Cost: ₹{it.purchaseCost.toFixed(2)} | Selling Rate: ₹{it.sellingPrice}
                    </p>
                    {it.packetInfo && (
                      <p className="text-[10px] text-emerald-700 font-medium">{it.packetInfo}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900">₹{it.totalCost.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
              ₹{totalAllocated.toFixed(2)} / ₹{totalAmount.toFixed(2)}
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
          {isSaving ? <span>Saving Purchase...</span> : <span>Save Purchase • ₹{totalAmount.toFixed(2)}</span>}
        </button>
      </div>
    </div>
  );
};
