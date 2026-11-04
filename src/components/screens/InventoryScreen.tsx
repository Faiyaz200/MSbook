import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  X,
  ShoppingCart,
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
            <span>Piche Bacha Maal</span>
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
              placeholder="Search item name (e.g. Parle, Chawal, Tel)..."
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
            <span className="text-[10px] text-slate-400">Piche bacha hua maal</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-[#F2F8F4] text-[#0F4D32] flex items-center justify-center mx-auto">
                <Package className="w-6 h-6 stroke-[1.8px]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {searchQuery ? 'No matching items found' : 'Inventory Khali Hai'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto">
                  {searchQuery
                    ? 'Check spelling or clear search filter'
                    : 'Purchase Voucher se maal daalein. Yaha automatic stock dikhega.'}
                </p>
              </div>

              {onNavigateToPurchase && (
                <button
                  type="button"
                  onClick={() => onNavigateToPurchase()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0F4D32] text-white text-xs font-bold hover:bg-[#0B3B26] shadow-sm transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Purchase Voucher Kholein</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredProducts.map((p) => {
                const qty = p.stockQuantity || 0;
                const unit = p.unit || 'pcs';
                const valuation = qty * (p.purchaseCost || 0);
                const isNil = qty <= 0;

                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{p.name}</h4>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                          <span>Selling: ₹{p.sellingPrice}/{unit}</span>
                          <span>•</span>
                          <span>Cost: ₹{p.purchaseCost.toFixed(2)}/{unit}</span>
                        </div>
                      </div>

                      {/* Stock Quantity Badge */}
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                          isNil
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-emerald-50 text-[#0F4D32] border border-emerald-200'
                        }`}
                      >
                        {qty} {unit}
                      </span>
                    </div>

                    {/* Stock Value Basis */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
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
    </div>
  );
};
