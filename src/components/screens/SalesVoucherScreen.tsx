import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Barcode,
  Search,
  Plus,
  Trash2,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Business, Customer, Product, BUSINESS_TYPES } from '../../types';
import { db } from '../../services/db';
import { BarcodeScannerModal } from '../BarcodeScannerModal';

interface SalesVoucherScreenProps {
  activeBusiness: Business;
  onNavigateBack: () => void;
  onSalesSaved: () => void;
  isSplitPaymentHighlight?: boolean;
}

interface CartRow {
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  variantInfo: string;
  sellingPrice: number;
  purchaseCost: number;
  discount: number;
  lineTotal: number;
}

export const SalesVoucherScreen: React.FC<SalesVoucherScreenProps> = ({
  activeBusiness,
  onNavigateBack,
  onSalesSaved,
  isSplitPaymentHighlight = false,
}) => {
  const isKirana = activeBusiness.businessType === 'KIRANA';
  const defaultUnit = isKirana ? 'kg' : 'pcs';

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [currentDate] = useState(() =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  );

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Products catalog
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Manual entry fields
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState(defaultUnit);
  const [variantInfo, setVariantInfo] = useState(isKirana ? '1kg Pack' : 'Size 40 / Navy');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [discount, setDiscount] = useState('0');

  // Cart
  const [cartItems, setCartItems] = useState<CartRow[]>([]);

  // Split payment allocations
  const [cashAmount, setCashAmount] = useState('0');
  const [upiAmount, setUpiAmount] = useState('0');
  const [bankAmount, setBankAmount] = useState('0');
  const [udharAmount, setUdharAmount] = useState('0');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const invNo = db.generateNextVoucherNumber(activeBusiness.id, 'SALES');
    setInvoiceNumber(invNo);
    const custList = db.getCustomers(activeBusiness.id);
    setCustomers(custList);
    if (custList.length > 0) {
      setSelectedCustomerId(custList[0].id);
    }
    const prodList = db.getProducts(activeBusiness.id);
    setProducts(prodList);
  }, [activeBusiness.id]);

  const grandTotal = cartItems.reduce((acc, row) => acc + row.lineTotal, 0);

  const numCash = parseFloat(cashAmount) || 0;
  const numUpi = parseFloat(upiAmount) || 0;
  const numBank = parseFloat(bankAmount) || 0;
  const numUdhar = parseFloat(udharAmount) || 0;
  const totalAllocated = numCash + numUpi + numBank + numUdhar;
  const totalReceived = numCash + numUpi + numBank;
  const remainingDue = numUdhar;

  const isBalanced = cartItems.length > 0 && Math.abs(grandTotal - totalAllocated) < 0.05;

  // Add Item to cart
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = productName.trim();
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(sellingPrice) || 0;
    const disc = parseFloat(discount) || 0;
    const cost = parseFloat(purchaseCost) || price * 0.75;

    if (!name) {
      setErrorMessage('Please enter product name');
      return;
    }
    if (qty <= 0) {
      setErrorMessage('Please enter valid quantity (fractional allowed)');
      return;
    }
    if (price <= 0) {
      setErrorMessage('Please enter valid selling price');
      return;
    }

    const lineTotal = Math.max(0, qty * price - disc);

    const newRow: CartRow = {
      productName: name,
      quantity: qty,
      unit,
      variantInfo,
      sellingPrice: price,
      purchaseCost: cost,
      discount: disc,
      lineTotal,
    };

    const nextCart = [...cartItems, newRow];
    setCartItems(nextCart);
    const nextTotal = nextCart.reduce((sum, r) => sum + r.lineTotal, 0);

    // Reset fields
    setProductName('');
    setQuantity('1');
    setSellingPrice('');
    setPurchaseCost('');
    setDiscount('0');
    setErrorMessage(null);

    // If initial cart item, auto-fill cash by default or balance
    if (cartItems.length === 0) {
      setCashAmount(nextTotal.toString());
      setUpiAmount('0');
      setBankAmount('0');
      setUdharAmount('0');
    }
  };

  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  // Barcode scanner trigger
  const handleScanBarcode = () => {
    setIsBarcodeModalOpen(true);
  };

  const handleProductScanned = (prod: Product) => {
    setProductName(prod.name);
    setUnit(prod.unit);
    setSellingPrice(prod.sellingPrice.toString());
    setPurchaseCost(prod.purchaseCost.toString());
    setVariantInfo(prod.variantInfo || '');
    setErrorMessage(null);
  };

  // Pre-fill prompt's example: 1000 total -> Cash 300, UPI 200, Bank 0, Udhar 500
  const handleFillExampleSplit = () => {
    if (cartItems.length === 0) {
      // Add a 1000 item
      const item: CartRow = {
        productName: isKirana ? 'Provisions Bulk Pack' : 'Men\'s Blazer & Trouser',
        quantity: 1,
        unit: 'pack',
        variantInfo: 'Standard',
        sellingPrice: 1000,
        purchaseCost: 700,
        discount: 0,
        lineTotal: 1000,
      };
      setCartItems([item]);
    }
    setCashAmount('300');
    setUpiAmount('200');
    setBankAmount('0');
    setUdharAmount('500');
    setErrorMessage(null);
  };

  // Create new customer in-flow
  const handleSaveCustomer = () => {
    if (!newCustName.trim()) {
      setErrorMessage('Customer name required');
      return;
    }
    const created = db.createCustomer(activeBusiness.id, newCustName, newCustPhone);
    setCustomers(db.getCustomers(activeBusiness.id));
    setSelectedCustomerId(created.id);
    setNewCustName('');
    setNewCustPhone('');
    setIsNewCustomerOpen(false);
    setErrorMessage(null);
  };

  // Save Voucher
  const handleSaveVoucher = () => {
    if (cartItems.length === 0) {
      setErrorMessage('Cart cannot be empty');
      return;
    }
    if (!isBalanced) {
      setErrorMessage(`Payment allocation (₹${totalAllocated}) must equal Invoice Total (₹${grandTotal})`);
      return;
    }
    if (numUdhar > 0 && !selectedCustomerId) {
      setErrorMessage('Customer selection is required when sale has Udhar (credit)');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const selectedCust = customers.find((c) => c.id === selectedCustomerId) || null;
      db.saveSalesVoucher({
        businessId: activeBusiness.id,
        customer: selectedCust,
        items: cartItems.map((c) => ({
          productId: c.productId,
          productName: c.productName,
          quantity: c.quantity,
          unit: c.unit,
          variantInfo: c.variantInfo,
          sellingPrice: c.sellingPrice,
          purchaseCost: c.purchaseCost,
          discount: c.discount,
        })),
        cashAmount: numCash,
        upiAmount: numUpi,
        bankAmount: numBank,
        udharAmount: numUdhar,
        remarks: `Sales Invoice ${invoiceNumber}`,
      });

      onSalesSaved();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save sales voucher');
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
            <h2 className="font-bold text-slate-900 text-sm leading-tight">
              {isSplitPaymentHighlight ? 'Sales • Split Payment' : 'Sales Voucher'}
            </h2>
            <span className="text-[10px] font-mono font-bold text-[#0F4D32]">{invoiceNumber}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">{currentDate}</span>
          <span className="text-[11px] font-bold text-[#0F4D32]">{activeBusiness.businessName}</span>
        </div>
      </div>

      {/* Main Form Scroll Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center text-xs text-red-600 font-medium">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Customer Selection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-[#0F4D32]" />
              <label className="text-xs font-bold text-slate-800">
                Customer <span className="text-slate-400 font-normal">(Required for Udhar)</span>
              </label>
            </div>
            <button
              onClick={() => setIsNewCustomerOpen(!isNewCustomerOpen)}
              className="text-xs font-bold text-[#0F4D32] hover:underline"
            >
              {isNewCustomerOpen ? 'Cancel' : '+ New Customer'}
            </button>
          </div>

          {/* New customer in-flow */}
          {isNewCustomerOpen ? (
            <div className="p-3 bg-[#F2F8F4] rounded-xl space-y-2 mb-2 border border-[#0F4D32]/20">
              <input
                type="text"
                placeholder="Customer Name *"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4D32]"
              />
              <input
                type="tel"
                placeholder="Mobile Number (Optional)"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F4D32]"
              />
              <button
                type="button"
                onClick={handleSaveCustomer}
                className="px-3 py-1.5 bg-[#0F4D32] text-white text-xs font-bold rounded-lg hover:bg-[#0B3B26]"
              >
                Add Customer
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              >
                <option value="">Walk-in Customer (Cash / UPI Only)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.mobileNumber ? `(${c.mobileNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 2. Add Product Entry (Fractional Units & Clothing Variants) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">Add Item to Bill</h3>
            <button
              onClick={handleScanBarcode}
              type="button"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#F2F8F4] text-[#0F4D32] hover:bg-emerald-100 text-xs font-semibold border border-[#0F4D32]/20 transition-colors shadow-2xs"
              title="Open Barcode Scanner (Camera & Lookup)"
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Scan Barcode</span>
            </button>
          </div>

          {/* Product Name */}
          <input
            type="text"
            placeholder="Product Name *"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
          />

          {/* Qty, Unit, Variant */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">
                Qty {isKirana ? '(Fractional e.g. 0.5)' : ''}
              </label>
              <input
                type="number"
                step="any"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Unit</label>
              <input
                type="text"
                placeholder={defaultUnit}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">
                {isKirana ? 'Packaging' : 'Variant / Size'}
              </label>
              <input
                type="text"
                placeholder="e.g. M / Blue"
                value={variantInfo}
                onChange={(e) => setVariantInfo(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
          </div>

          {/* Selling Price, Purchase Cost (for profit calculation), Discount */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Rate / Price (₹) *</label>
              <input
                type="number"
                placeholder="₹ Rate"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Cost Price (COGS)</label>
              <input
                type="number"
                placeholder="Auto (75%)"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">Discount (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-2 bg-[#0F4D32] hover:bg-[#0B3B26] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item to Bill</span>
          </button>
        </div>

        {/* 3. Selected Items (Editable List) */}
        {cartItems.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800">
                Selected Products ({cartItems.length})
              </span>
              <span className="text-xs font-bold text-[#0F4D32]">Invoice Total: ₹{grandTotal}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {cartItems.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{item.productName}</span>
                    <span className="text-[11px] text-slate-500">
                      {item.quantity} {item.unit} @ ₹{item.sellingPrice}
                      {item.variantInfo ? ` • ${item.variantInfo}` : ''}
                      {item.discount > 0 ? ` (Disc: -₹${item.discount})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900">₹{item.lineTotal}</span>
                    <button
                      type="button"
                      onClick={() => setCartItems(cartItems.filter((_, i) => i !== idx))}
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

        {/* 4. Split Payment Allocation Section */}
        <div className="bg-white rounded-2xl border-2 border-[#0F4D32] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-[#0F4D32]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Split Payment Allocation
              </h3>
            </div>
            <button
              onClick={handleFillExampleSplit}
              type="button"
              className="text-[11px] text-[#0F4D32] font-bold flex items-center space-x-1 hover:underline"
            >
              <Sparkles className="w-3 h-3" />
              <span>Fill Prompt Example (₹1,000)</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Enter any combination of Cash, UPI, Bank, and Udhar. Total must equal invoice (₹{grandTotal}).
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] text-slate-600 font-bold mb-0.5 block">Cash (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-bold mb-0.5 block">UPI (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={upiAmount}
                onChange={(e) => setUpiAmount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-bold mb-0.5 block">Bank (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={bankAmount}
                onChange={(e) => setBankAmount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-bold mb-0.5 block">Udhar / Due (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={udharAmount}
                onChange={(e) => setUdharAmount(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F4D32]"
              />
            </div>
          </div>

          {/* Allocation Breakdown Box */}
          <div className="p-3 bg-[#F2F8F4] rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Total Received</span>
              <span className="font-bold text-[#0F4D32]">₹{totalReceived}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Remaining Due (Udhar)</span>
              <span className={`font-bold ${remainingDue > 0 ? 'text-amber-700' : 'text-[#0F4D32]'}`}>
                ₹{remainingDue}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Status</span>
              <span
                className={`font-bold inline-flex items-center ${
                  isBalanced ? 'text-[#0F4D32]' : 'text-red-600'
                }`}
              >
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Balanced</span>
                  </>
                ) : (
                  <span>
                    Diff: ₹{(grandTotal - totalAllocated).toFixed(2)}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 bg-white border-t border-slate-100 shadow-sm shrink-0">
        <button
          type="button"
          onClick={handleSaveVoucher}
          disabled={!isBalanced || isSaving}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-sm ${
            isBalanced && !isSaving
              ? 'bg-[#0F4D32] text-white hover:bg-[#0B3B26] active:scale-[0.99]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <span>Saving Invoice & Ledger Entries...</span>
          ) : (
            <span>Save Sales Voucher • ₹{grandTotal}</span>
          )}
        </button>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        businessId={activeBusiness.id}
        onProductScanned={handleProductScanned}
      />
    </div>
  );
};
