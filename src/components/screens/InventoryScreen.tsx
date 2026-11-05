import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  X,
  ShoppingCart,
  Edit2,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Business, Product } from '../../types';
import { db } from '../../services/db';

interface InventoryScreenProps {
  activeBusiness: Business;
  onNavigateBack: () => void;
  onNavigateToSale?: (productId?: string) => void;
  onNavigateToPurchase?: (productId?: string) => void;
  initialProductId?: string;
  initialTab?: any;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  activeBusiness,
  onNavigateToPurchase,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editPurchaseCost, setEditPurchaseCost] = useState('');
  const [editStockQuantity, setEditStockQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('pcs');
  const [editError, setEditError] = useState<string | null>(null);

  const loadData = () => {
    const list = db.getProducts(activeBusiness.id);
    setProducts(list);
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [activeBusiness.id]);

  // Metrics
  const totalItems = products.length;
  const totalStockValuation = products.reduce(
    (acc, p) => acc + (p.stockQuantity || 0) * (p.purchaseCost || 0),
    0
  );

  const outOfStockCount = products.filter((p) => (p.stockQuantity || 0) <= 0).length;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = q === '' || p.name.toLowerCase().includes(q);

      const qty = p.stockQuantity || 0;
      let matchesFilter = true;
      if (filterType === 'IN_STOCK') {
        matchesFilter = qty > 0;
      } else if (filterType === 'OUT_OF_STOCK') {
        matchesFilter = qty <= 0;
      }

      return matchesSearch && matchesFilter;
    });
  }, [products, searchQuery, filterType]);

  // Handle Opening Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditSellingPrice(p.sellingPrice.toString());
    setEditPurchaseCost(p.purchaseCost.toString());
    setEditStockQuantity(p.stockQuantity.toString());
    setEditUnit(p.unit || 'pcs');
    setEditError(null);
  };

  // Handle Saving Edited Product
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError('Product name is required');
      return;
    }

    const numSelling = parseFloat(editSellingPrice);
    if (isNaN(numSelling) || numSelling < 0) {
      setEditError('Please enter a valid selling price');
      return;
    }

    const numCost = parseFloat(editPurchaseCost);
    if (isNaN(numCost) || numCost < 0) {
      setEditError('Please enter a valid cost price');
      return;
    }

    const numStock = parseFloat(editStockQuantity);
    if (isNaN(numStock) || numStock < 0) {
      setEditError('Please enter a valid stock quantity');
      return;
    }

    try {
      db.updateProduct(editingProduct.id, {
        name: trimmedName,
        sellingPrice: numSelling,
        purchaseCost: numCost,
        stockQuantity: numStock,
        unit: editUnit,
      });

      setEditingProduct(null);
      loadData();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update product');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
      {/* Header */}
      <div className="bg-[#0F4D32] text-white px-5 pt-4 pb-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#0F4D32] font-black text-lg flex items-center justify-center shadow-xs">
              MS
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none text-white">
                Inventory & Stock
              </h1>
              <p className="text-[11px] text-emerald-100 font-medium mt-1 truncate max-w-[200px]">
                {activeBusiness.businessName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold border border-white/20">
            <span>Available Inventory</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* KPI Summary Cards: Total Value and Items */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-500 block">Total Stock Value</span>
            <p className="font-mono text-sm font-bold text-[#0F4D32] mt-0.5 truncate">
              ₹{totalStockValuation.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
            <span className="text-[10px] font-semibold text-slate-500 block">Total Items</span>
            <p className="font-mono text-sm font-bold text-slate-800 mt-0.5">
              {totalItems} Items
            </p>
          </div>
        </div>

        {/* Search Bar & Filter Chips */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search item name (e.g. Rice, Sugar, Oil)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0F4D32] shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterType === 'ALL'
                  ? 'bg-[#0F4D32] text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All ({totalItems})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('IN_STOCK')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterType === 'IN_STOCK'
                  ? 'bg-[#0F4D32] text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              In Stock ({totalItems - outOfStockCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('OUT_OF_STOCK')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterType === 'OUT_OF_STOCK'
                  ? 'bg-red-700 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
        </div>

        {/* Stock List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Stock Register ({filteredProducts.length})
            </h3>
            <span className="text-[10px] text-slate-400">Never deleted • Fully preserved</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#F2F8F4] text-[#0F4D32] flex items-center justify-center mx-auto">
                <Package className="w-6 h-6 stroke-[1.8px]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {searchQuery ? 'No matching items found' : 'Inventory is Empty'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto">
                  {searchQuery
                    ? 'Check spelling or clear search filter'
                    : 'Add items via Purchase Voucher. Stock updates automatically here.'}
                </p>
              </div>

              {onNavigateToPurchase && (
                <button
                  type="button"
                  onClick={() => onNavigateToPurchase()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0F4D32] text-white text-xs font-bold hover:bg-[#0B3B26] shadow-sm transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Open Purchase Voucher</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((p) => {
                const qty = p.stockQuantity || 0;
                const unit = p.unit || 'pcs';
                const valuation = qty * (p.purchaseCost || 0);
                const isNil = qty <= 0;

                return (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-2xs overflow-hidden p-3.5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                          {p.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Selling: <span className="text-[#0F4D32] font-black">₹{p.sellingPrice}/{unit}</span>
                          </span>
                          <span>•</span>
                          <span>Cost: ₹{p.purchaseCost.toFixed(2)}/{unit}</span>
                        </div>
                      </div>

                      {/* Stock Badge & Edit Action */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                            isNil
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-[#0F4D32] border border-emerald-200'
                          }`}
                        >
                          {qty} {unit}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-[#F2F8F4] text-slate-600 hover:text-[#0F4D32] border border-slate-200 active:scale-95 transition-all flex items-center space-x-1"
                          title="Edit Item Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold pr-0.5">Edit</span>
                        </button>
                      </div>
                    </div>

                    {/* Stock Value Basis */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Stock Valuation:</span>
                      <span className="font-mono font-bold text-[#0F4D32]">
                        ₹{valuation.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Inventory Item Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#0F4D32] text-white shrink-0">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-emerald-200" />
                <div>
                  <h3 className="font-bold text-sm">Edit Inventory Item</h3>
                  <p className="text-[10px] text-emerald-200">
                    Update item name, rates or stock quantity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-full hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {editError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {editError}
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Product / Item Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-[#0F4D32] focus:bg-white"
                  placeholder="e.g. Rajshree"
                />
              </div>

              {/* Unit Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Unit
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['pcs', 'packet', 'kg', 'ltr'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setEditUnit(u)}
                      className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                        editUnit === u
                          ? 'bg-[#0F4D32] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selling Price & Purchase Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Selling Rate (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={editSellingPrice}
                    onChange={(e) => setEditSellingPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#0F4D32] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Cost Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={editPurchaseCost}
                    onChange={(e) => setEditPurchaseCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#0F4D32] focus:bg-white"
                  />
                </div>
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Current Stock Quantity ({editUnit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={editStockQuantity}
                  onChange={(e) => setEditStockQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#0F4D32] focus:bg-white"
                />
              </div>

              {/* Notice of permanent safety */}
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center space-x-2 text-[10px] text-emerald-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#0F4D32] shrink-0" />
                <span>Inventory items are never deleted and always preserved.</span>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0F4D32] text-white text-xs font-bold hover:bg-[#0B3B26] shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
