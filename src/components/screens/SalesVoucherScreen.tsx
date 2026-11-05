import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Trash2,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  PackageCheck,
  ChevronDown,
} from 'lucide-react';
import { Business, Customer, Product } from '../../types';
import { db } from '../../services/db';

interface SalesVoucherScreenProps {
  activeBusiness: Business;
  onNavigateBack: () => void;
  onSalesSaved: () => void;
  isSplitPaymentHighlight?: boolean;
}

interface BillRow {
  rowId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  purchaseCost: number;
  stockAvailable: number;
}

export const SalesVoucherScreen: React.FC<SalesVoucherScreenProps> = ({
  activeBusiness,
  onNavigateBack,
  onSalesSaved,
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [currentDate] = useState(() =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  );

  // Customers
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Available in-stock products from inventory
  const [inStockProducts, setInStockProducts] = useState<Product[]>([]);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [activeRowIndexForPicker, setActiveRowIndexForPicker] = useState<number | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // Rows of items: initially 1 empty row
  const [rows, setRows] = useState<BillRow[]>([
    {
      rowId: 'row_' + Math.random().toString(36).substring(2, 7),
      productId: '',
      productName: '',
      quantity: 1,
      unit: 'pcs',
      sellingPrice: 0,
      purchaseCost: 0,
      stockAvailable: 0,
    },
  ]);

  // Split payment amounts
  const [cashAmount, setCashAmount] = useState('0');
  const [upiAmount, setUpiAmount] = useState('0');
  const [bankAmount, setBankAmount] = useState('0');
  const [udharAmount, setUdharAmount] = useState('0');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load data on mount
  useEffect(() => {
    const invNo = db.generateNextVoucherNumber(activeBusiness.id, 'SALES');
    setInvoiceNumber(invNo);

    const custList = db.getCustomers(activeBusiness.id);
    setCustomers(custList);
    // Walk-in Customer auto-selected by default so user can sell directly without selecting
    setSelectedCustomerId('');

    // Only products that have stock in inventory > 0
    const allProds = db.getProducts(activeBusiness.id);
    const available = allProds.filter((p) => p.stockQuantity > 0);
    setInStockProducts(available);
  }, [activeBusiness.id]);

  // Valid rows (rows where product is selected)
  const validRows = rows.filter((r) => r.productId && r.quantity > 0);
  const grandTotal = validRows.reduce((sum, r) => sum + r.quantity * r.sellingPrice, 0);

  const numCash = parseFloat(cashAmount) || 0;
  const numUpi = parseFloat(upiAmount) || 0;
  const numBank = parseFloat(bankAmount) || 0;
  const numUdhar = parseFloat(udharAmount) || 0;
  const totalAllocated = numCash + numUpi + numBank + numUdhar;

  const isBalanced = validRows.length > 0 && Math.abs(grandTotal - totalAllocated) < 0.05;

  // Auto-fill cash when total changes if only 1 item or default
  useEffect(() => {
    if (grandTotal > 0 && totalAllocated === 0) {
      setCashAmount(grandTotal.toString());
      setUpiAmount('0');
      setBankAmount('0');
      setUdharAmount('0');
    }
  }, [grandTotal]);

  // When a product is selected from the bottom picker
  const handleSelectProduct = (prod: Product) => {
    if (activeRowIndexForPicker === null) return;

    setRows((prev) => {
      const copy = [...prev];
      const targetIndex = activeRowIndexForPicker;

      copy[targetIndex] = {
        ...copy[targetIndex],
        productId: prod.id,
        productName: prod.name,
        unit: prod.unit || 'pcs',
        sellingPrice: prod.sellingPrice || 0,
        purchaseCost: prod.purchaseCost || 0,
        stockAvailable: prod.stockQuantity || 0,
        quantity: 1,
      };

      // Auto-append next empty row if this was the last row
      if (targetIndex === copy.length - 1) {
        copy.push({
          rowId: 'row_' + Math.random().toString(36).substring(2, 7),
          productId: '',
          productName: '',
          quantity: 1,
          unit: 'pcs',
          sellingPrice: 0,
          purchaseCost: 0,
          stockAvailable: 0,
        });
      }

      return copy;
    });

    setIsProductPickerOpen(false);
    setActiveRowIndexForPicker(null);
    setPickerSearch('');
    setErrorMessage(null);
  };

  const handleUpdateQuantity = (index: number, val: string) => {
    const qty = parseFloat(val) || 0;
    setRows((prev) => {
      const copy = [...prev];
      copy[index].quantity = qty;

      // If user filled quantity and it's the last row with product selected, add next empty row
      if (index === copy.length - 1 && copy[index].productId && qty > 0) {
        copy.push({
          rowId: 'row_' + Math.random().toString(36).substring(2, 7),
          productId: '',
          productName: '',
          quantity: 1,
          unit: 'pcs',
          sellingPrice: 0,
          purchaseCost: 0,
          stockAvailable: 0,
        });
      }

      return copy;
    });
  };

  const handleDeleteRow = (index: number) => {
    setRows((prev) => {
      if (prev.length <= 1) {
        // Keep at least one empty row
        return [
          {
            rowId: 'row_' + Math.random().toString(36).substring(2, 7),
            productId: '',
            productName: '',
            quantity: 1,
            unit: 'pcs',
            sellingPrice: 0,
            purchaseCost: 0,
            stockAvailable: 0,
          },
        ];
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Quick 1-tap payment allocation helpers
  const handleSetFullCash = () => {
    setCashAmount(grandTotal.toString());
    setUpiAmount('0');
    setBankAmount('0');
    setUdharAmount('0');
  };

  const handleSetFullUpi = () => {
    setCashAmount('0');
    setUpiAmount(grandTotal.toString());
    setBankAmount('0');
    setUdharAmount('0');
  };

  const handleSetFullUdhar = () => {
    setCashAmount('0');
    setUpiAmount('0');
    setBankAmount('0');
    setUdharAmount(grandTotal.toString());
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    try {
      const created = db.createCustomer({
        businessId: activeBusiness.id,
        name: newCustName.trim(),
        mobileNumber: newCustPhone.trim(),
      });
      setCustomers(db.getCustomers(activeBusiness.id));
      setSelectedCustomerId(created.id);
      setIsNewCustomerOpen(false);
      setNewCustName('');
      setNewCustPhone('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add customer');
    }
  };

  const handleSaveBill = async () => {
    if (validRows.length === 0) {
      setErrorMessage('Please select at least one item from inventory');
      return;
    }

    // Check if any quantity exceeds stock
    for (const r of validRows) {
      if (r.quantity > r.stockAvailable) {
        setErrorMessage(
          `Only ${r.stockAvailable} ${r.unit} available for "${r.productName}". Reduce bill quantity.`
        );
        return;
      }
    }

    if (!isBalanced) {
      setErrorMessage(
        `Total payment (₹${totalAllocated}) must equal Bill Total (₹${grandTotal})`
      );
      return;
    }

    const selectedCust = customers.find((c) => c.id === selectedCustomerId) || null;
    if (numUdhar > 0 && !selectedCust) {
      setErrorMessage('Please select a customer for Credit balance');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      db.saveSalesVoucher({
        businessId: activeBusiness.id,
        customer: selectedCust,
        items: validRows.map((r) => ({
          productId: r.productId,
          productName: r.productName,
          quantity: r.quantity,
          unit: r.unit,
          variantInfo: '',
          sellingPrice: r.sellingPrice,
          purchaseCost: r.purchaseCost,
          discount: 0,
        })),
        cashAmount: numCash,
        upiAmount: numUpi,
        bankAmount: numBank,
        udharAmount: numUdhar,
      });

      onSalesSaved();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save bill');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered products for the bottom picker sheet
  const filteredInStock = inStockProducts.filter(
    (p) =>
      pickerSearch.trim() === '' ||
      p.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      p.unit.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800 relative">
      {/* Top Header */}
      <div className="pt-3 px-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-[#0F4D32] text-white shrink-0 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateBack}
            className="flex items-center text-white/90 hover:text-white p-1.5 rounded-lg -ml-1.5 transition-colors"
            title="Back to Vouchers"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="font-semibold text-sm">Back</span>
          </button>
          <div className="ml-1">
            <h2 className="font-bold text-white text-base leading-tight">Sale Item</h2>
            <span className="text-[11px] font-mono text-emerald-200">{invoiceNumber}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-white/90 font-medium block">{currentDate}</span>
          <span className="text-[10px] font-bold text-emerald-300">{activeBusiness.businessName}</span>
        </div>
      </div>

      {/* Main Form Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-xs text-red-600 font-medium">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Customer Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-[#0F4D32]" />
              <span>Customer Name</span>
            </label>
            <button
              type="button"
              onClick={() => setIsNewCustomerOpen(true)}
              className="text-[11px] font-bold text-[#0F4D32] hover:underline flex items-center"
            >
              <Plus className="w-3 h-3 mr-0.5" />
              <span>+ New Customer</span>
            </button>
          </div>

          {customers.length > 0 ? (
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-[#F8FAF8] border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#0F4D32]"
            >
              <option value="">Walk-in Customer (Cash / Direct)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.mobileNumber ? `(${c.mobileNumber})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-[11px] text-slate-500 py-1">
              No customers saved. Default: Cash customer. Tap "+ New Customer" to record Credit.
            </div>
          )}

          {/* New Customer Inline Modal */}
          {isNewCustomerOpen && (
            <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F4D32]">Add Quick Customer</span>
                <button
                  type="button"
                  onClick={() => setIsNewCustomerOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
                <input
                  type="tel"
                  placeholder="Mobile (Optional)"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomer}
                className="w-full py-1.5 bg-[#0F4D32] text-white text-xs font-bold rounded-lg"
              >
                Save & Select Customer
              </button>
            </div>
          )}
        </div>

        {/* 2. Items Billing Rows (Auto-expanding on fill, No barcode, No variant, No disc, Unit & Price auto) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <PackageCheck className="w-4 h-4 text-[#0F4D32]" />
              <span>Items to Bill</span>
            </h3>
            <span className="text-[10px] text-slate-500">
              {inStockProducts.length} items available in inventory
            </span>
          </div>

          {inStockProducts.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1">
              <p className="text-xs font-bold text-amber-800">Inventory is out of stock!</p>
              <p className="text-[11px] text-amber-700">
                Please add stock via "Purchase Voucher" first to start billing items.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {rows.map((row, idx) => {
                const lineTotal = row.quantity * row.sellingPrice;
                const isItemChosen = !!row.productId;

                return (
                  <div
                    key={row.rowId}
                    className={`p-3 rounded-xl border transition-all ${
                      isItemChosen
                        ? 'bg-white border-slate-200 shadow-2xs'
                        : 'bg-[#F8FAF8] border-dashed border-slate-300'
                    }`}
                  >
                    {/* Row Item Selector Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Item #{idx + 1}
                      </span>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          className="text-slate-400 hover:text-red-500 p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Product Name Trigger (Opens Bottom Sheet) */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRowIndexForPicker(idx);
                        setIsProductPickerOpen(true);
                      }}
                      className="w-full text-left bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between hover:border-[#0F4D32] transition-colors"
                    >
                      <div className="truncate pr-2">
                        {isItemChosen ? (
                          <div>
                            <span className="font-bold text-slate-900 text-xs block truncate">
                              {row.productName}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              Stock available: {row.stockAvailable} {row.unit} • ₹{row.sellingPrice}/{row.unit}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            + Tap to select item from inventory
                          </span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>

                    {/* Quantity & Auto Calculated Fields */}
                    {isItemChosen && (
                      <div className="mt-2.5 grid grid-cols-3 gap-2 items-center bg-[#F2F8F4]/50 p-2 rounded-xl">
                        {/* Qty Input */}
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block">
                            Qty
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            max={row.stockAvailable}
                            value={row.quantity || ''}
                            onChange={(e) => handleUpdateQuantity(idx, e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-center outline-none focus:border-[#0F4D32]"
                          />
                        </div>

                        {/* Unit (Auto) */}
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block">
                            Unit
                          </label>
                          <div className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 text-center">
                            {row.unit}
                          </div>
                        </div>

                        {/* Price (Auto) & Line Total */}
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block">
                            Amount
                          </label>
                          <div className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1 text-xs font-black text-[#0F4D32] text-center">
                            ₹{lineTotal.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Bill Total & Split Payment Breakdown (Cash, UPI, Bank, Udhar) */}
        {validRows.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-600">Total Bill Amount</span>
              <span className="text-lg font-black text-[#0F4D32]">₹{grandTotal.toFixed(2)}</span>
            </div>

            {/* Quick 1-tap fill buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={handleSetFullCash}
                className="py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0F4D32] text-[11px] font-bold border border-emerald-200 transition-colors"
              >
                Full Cash
              </button>
              <button
                type="button"
                onClick={handleSetFullUpi}
                className="py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200 transition-colors"
              >
                Full UPI
              </button>
              <button
                type="button"
                onClick={handleSetFullUdhar}
                className="py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200 transition-colors"
              >
                Full Credit
              </button>
            </div>

            {/* Split Amount Inputs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Cash (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full bg-[#F8FAF8] border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 outline-none focus:border-[#0F4D32]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">UPI / QR (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={upiAmount}
                  onChange={(e) => setUpiAmount(e.target.value)}
                  className="w-full bg-[#F8FAF8] border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 outline-none focus:border-[#0F4D32]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Bank (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                  className="w-full bg-[#F8FAF8] border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 outline-none focus:border-[#0F4D32]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-amber-700">Credit / Due (₹)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={udharAmount}
                  onChange={(e) => setUdharAmount(e.target.value)}
                  className="w-full bg-amber-50/60 border border-amber-200 rounded-lg px-2.5 py-1.5 font-bold text-amber-800 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Split Balance Verification */}
            <div className="flex items-center justify-between pt-1 text-[11px] font-bold">
              <span className="text-slate-500">Allocated: ₹{totalAllocated.toFixed(2)}</span>
              {isBalanced ? (
                <span className="text-[#0F4D32] flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Payment Balanced
                </span>
              ) : (
                <span className="text-red-500">
                  Diff: ₹{(grandTotal - totalAllocated).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Action Button: user says "save invoice me se invoice hata do baki rehne do" -> "Save" */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <button
          type="button"
          onClick={handleSaveBill}
          disabled={!isBalanced || isSaving}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
            isBalanced && !isSaving
              ? 'bg-[#0F4D32] hover:bg-[#0B3B26] active:scale-[0.99] text-white shadow-md cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <span>Saving Bill...</span>
          ) : (
            <span>Save</span>
          )}
        </button>
      </div>

      {/* 4. Bottom Drawer / Sheet for Inventory Items (Lines se 1 by 1 sare item ke name) */}
      {isProductPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex flex-col justify-end animate-fade-in">
          <div
            className="bg-white rounded-t-3xl max-h-[75vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-[#0F4D32] text-white">
              <div>
                <h3 className="font-bold text-sm">Select Inventory Item</h3>
                <p className="text-[10px] text-emerald-200">Only in-stock items available for billing</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsProductPickerOpen(false);
                  setActiveRowIndexForPicker(null);
                }}
                className="p-1 rounded-full hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Box */}
            <div className="p-3 border-b border-slate-100 bg-[#F8FAF8] shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search item name..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0F4D32]"
                  autoFocus
                />
              </div>
            </div>

            {/* List of In-Stock Items 1 by 1 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredInStock.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No matching in-stock items found in inventory.
                </div>
              ) : (
                filteredInStock.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleSelectProduct(prod)}
                    className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-[#0F4D32] hover:bg-[#F2F8F4] active:scale-[0.99] transition-all flex items-center justify-between shadow-2xs group"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-sm block group-hover:text-[#0F4D32]">
                        {prod.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Price: ₹{prod.sellingPrice}/{prod.unit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#0F4D32] font-black text-xs border border-emerald-200">
                        {prod.stockQuantity} {prod.unit} left
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
