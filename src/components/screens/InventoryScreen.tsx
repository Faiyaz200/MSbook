import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ArrowUpDown,
  History,
  Edit2,
  Trash2,
  ArrowLeft,
  Barcode,
  Layers,
  ChevronRight,
  TrendingUp,
  Tag,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  X,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { Business, Product, ProductVariant, StockMovement } from '../../types';
import { db } from '../../services/db';

interface InventoryScreenProps {
  activeBusiness: Business;
  onNavigateBack: () => void;
  onNavigateToSale?: (productId?: string) => void;
  onNavigateToPurchase?: (productId?: string) => void;
  initialProductId?: string;
  initialTab?: 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MOVEMENTS';
}

type TabType = 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MOVEMENTS';
type SubViewType = 'LIST' | 'ADD_PRODUCT' | 'EDIT_PRODUCT' | 'ADJUST_STOCK' | 'PRODUCT_DETAIL';

// Common categories for quick selection
const KIRANA_CATEGORIES = [
  'Grains & Flour',
  'Pulses & Dals',
  'Edible Oils & Ghee',
  'Spices & Masalas',
  'Sugar & Salt',
  'Snacks & Biscuits',
  'Beverages & Tea',
  'Personal & Hygiene',
  'Dairy & Bakery',
  'Household & Cleaning',
];

const CLOTHING_CATEGORIES = [
  "Men's Shirts",
  "Men's T-Shirts",
  'Jeans & Denims',
  'Formal Trousers',
  'Casual Pants & Chinos',
  'Ethnic & Kurtas',
  'Jackets & Blazers',
  'Innerwear & Loungewear',
  'Winter Wear',
  'Accessories & Belts',
];

const KIRANA_UNITS = ['kg', 'g', 'ltr', 'ml', 'pcs', 'pkt', 'box'];
const CLOTHING_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40'];
const CLOTHING_COLORS = ['Blue', 'Black', 'White', 'Navy', 'Grey', 'Brown', 'Beige', 'Red', 'Green'];

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  activeBusiness,
  onNavigateBack,
  onNavigateToSale,
  onNavigateToPurchase,
  initialProductId,
  initialTab = 'ALL',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [subView, setSubView] = useState<SubViewType>(initialProductId ? 'PRODUCT_DETAIL' : 'LIST');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialProductId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Products and summary from db
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalStockUnits: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  // Reload data
  const loadData = () => {
    const prods = db.getProducts(activeBusiness.id);
    const movs = db.getStockMovements(activeBusiness.id);
    const sum = db.getInventorySummary(activeBusiness.id);
    setProducts(prods);
    setMovements(movs);
    setSummary(sum);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = db.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [activeBusiness.id]);

  // Selected product detail
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Categories list
  const categoryOptions = useMemo(() => {
    const existing = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) existing.add(p.category.trim());
    });
    const defaults = activeBusiness.businessType === 'KIRANA' ? KIRANA_CATEGORIES : CLOTHING_CATEGORIES;
    defaults.forEach((c) => existing.add(c));
    return Array.from(existing);
  }, [products, activeBusiness.businessType]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Category match
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) {
        return false;
      }

      // Tab filter
      const minStock = p.minStockLevel !== undefined ? p.minStockLevel : 5;
      if (activeTab === 'LOW_STOCK') {
        return p.stockQuantity <= minStock && p.stockQuantity > 0;
      }
      if (activeTab === 'OUT_OF_STOCK') {
        return p.stockQuantity <= 0;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, activeTab]);

  // -------------------------------------------------------------
  // Add / Edit Product Form State
  // -------------------------------------------------------------
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formUnit, setFormUnit] = useState(activeBusiness.businessType === 'KIRANA' ? 'kg' : 'pcs');
  const [formPurchaseCost, setFormPurchaseCost] = useState('');
  const [formSellingPrice, setFormSellingPrice] = useState('');
  const [formOpeningStock, setFormOpeningStock] = useState('0');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formDescription, setFormDescription] = useState('');
  const [formVariants, setFormVariants] = useState<ProductVariant[]>([]);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);

  // Clothing Variant Form state
  const [variantSize, setVariantSize] = useState('32');
  const [variantColor, setVariantColor] = useState('Blue');
  const [variantQty, setVariantQty] = useState('1');

  const openAddProduct = () => {
    setFormName('');
    setFormCategory('');
    setFormSku('');
    setFormBarcode('');
    setFormUnit(activeBusiness.businessType === 'KIRANA' ? 'kg' : 'pcs');
    setFormPurchaseCost('');
    setFormSellingPrice('');
    setFormOpeningStock('0');
    setFormMinStock('5');
    setFormDescription('');
    setFormVariants([]);
    setFormErrorMessage(null);
    setSubView('ADD_PRODUCT');
  };

  const openEditProduct = (prod: Product) => {
    setSelectedProductId(prod.id);
    setFormName(prod.name);
    setFormCategory(prod.category || '');
    setFormSku(prod.sku || '');
    setFormBarcode(prod.barcode || '');
    setFormUnit(prod.unit);
    setFormPurchaseCost(prod.purchaseCost ? prod.purchaseCost.toString() : '');
    setFormSellingPrice(prod.sellingPrice ? prod.sellingPrice.toString() : '');
    setFormOpeningStock(prod.openingStock !== undefined ? prod.openingStock.toString() : prod.stockQuantity.toString());
    setFormMinStock(prod.minStockLevel !== undefined ? prod.minStockLevel.toString() : '5');
    setFormDescription(prod.description || '');
    setFormVariants(prod.variants ? JSON.parse(JSON.stringify(prod.variants)) : []);
    setFormErrorMessage(null);
    setSubView('EDIT_PRODUCT');
  };

  const handleAddVariant = () => {
    const size = variantSize.trim();
    const color = variantColor.trim();
    const qty = parseInt(variantQty, 10) || 0;

    if (!size || !color) {
      setFormErrorMessage('Please specify size and colour for the variant');
      return;
    }

    // Check duplicate
    const exists = formVariants.some(
      (v) => v.size.toLowerCase() === size.toLowerCase() && v.color.toLowerCase() === color.toLowerCase()
    );
    if (exists) {
      setFormErrorMessage(`Variant ${size} - ${color} already added`);
      return;
    }

    const newVariant: ProductVariant = {
      id: 'var_' + Math.random().toString(36).substring(2, 9),
      size,
      color,
      stockQuantity: qty,
      sku: `${formSku ? formSku + '-' : ''}${size}-${color}`.toUpperCase(),
    };

    setFormVariants([...formVariants, newVariant]);
    setVariantQty('1');
    setFormErrorMessage(null);
  };

  const handleRemoveVariant = (id: string) => {
    setFormVariants(formVariants.filter((v) => v.id !== id));
  };

  const handleSaveProduct = () => {
    const name = formName.trim();
    const pCost = parseFloat(formPurchaseCost) || 0;
    const sPrice = parseFloat(formSellingPrice) || 0;
    const minStock = parseFloat(formMinStock) || 0;
    const openStock = parseFloat(formOpeningStock) || 0;

    if (!name) {
      setFormErrorMessage('Product name is required');
      return;
    }
    if (pCost < 0 || sPrice < 0) {
      setFormErrorMessage('Price amounts cannot be negative');
      return;
    }

    // Clothing business requires piece-based unit
    const unit = activeBusiness.businessType === 'CLOTHING' ? 'pcs' : formUnit;

    let totalStock = openStock;
    if (activeBusiness.businessType === 'CLOTHING' && formVariants.length > 0) {
      totalStock = formVariants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
    }

    const variantSummary =
      formVariants.length > 0
        ? formVariants.map((v) => `${v.size}/${v.color} (${v.stockQuantity})`).join(', ')
        : '';

    try {
      if (subView === 'ADD_PRODUCT') {
        const created = db.createProduct({
          businessId: activeBusiness.id,
          name,
          category: formCategory.trim() || undefined,
          description: formDescription.trim() || undefined,
          sku: formSku.trim() || undefined,
          barcode: formBarcode.trim() || '',
          unit,
          purchaseCost: pCost,
          sellingPrice: sPrice,
          openingStock: totalStock,
          stockQuantity: totalStock,
          minStockLevel: minStock,
          variantInfo: variantSummary,
          variants: formVariants.length > 0 ? formVariants : undefined,
        });
        setSelectedProductId(created.id);
        setSubView('PRODUCT_DETAIL');
      } else if (subView === 'EDIT_PRODUCT' && selectedProductId) {
        db.updateProduct(selectedProductId, {
          name,
          category: formCategory.trim() || undefined,
          description: formDescription.trim() || undefined,
          sku: formSku.trim() || undefined,
          barcode: formBarcode.trim() || '',
          unit,
          purchaseCost: pCost,
          sellingPrice: sPrice,
          minStockLevel: minStock,
          variantInfo: variantSummary,
          variants: formVariants.length > 0 ? formVariants : undefined,
        });
        setSubView('PRODUCT_DETAIL');
      }
      loadData();
    } catch (err: unknown) {
      setFormErrorMessage(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      db.deleteProduct(id);
      loadData();
      setSelectedProductId(null);
      setSubView('LIST');
    }
  };

  // -------------------------------------------------------------
  // Stock Adjustment Form State
  // -------------------------------------------------------------
  const [adjProductId, setAdjProductId] = useState<string>('');
  const [adjVariantId, setAdjVariantId] = useState<string>('');
  const [adjMode, setAdjMode] = useState<'RECOUNT' | 'ADD' | 'DEDUCT'>('RECOUNT');
  const [adjQuantity, setAdjQuantity] = useState<string>('');
  const [adjReason, setAdjReason] = useState<string>('Physical Recount');
  const [adjDate, setAdjDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [adjErrorMessage, setAdjErrorMessage] = useState<string | null>(null);

  const openStockAdjustment = (prod?: Product) => {
    const targetProd = prod || products[0];
    if (!targetProd) {
      alert('Add a product first before performing stock adjustments');
      return;
    }
    setAdjProductId(targetProd.id);
    if (targetProd.variants && targetProd.variants.length > 0) {
      setAdjVariantId(targetProd.variants[0].id);
      setAdjQuantity(targetProd.variants[0].stockQuantity.toString());
    } else {
      setAdjVariantId('');
      setAdjQuantity(targetProd.stockQuantity.toString());
    }
    setAdjMode('RECOUNT');
    setAdjReason('Physical Recount');
    setAdjDate(new Date().toISOString().split('T')[0]);
    setAdjErrorMessage(null);
    setSubView('ADJUST_STOCK');
  };

  const handleSaveAdjustment = () => {
    if (!adjProductId) {
      setAdjErrorMessage('Select a product to adjust');
      return;
    }

    const prod = products.find((p) => p.id === adjProductId);
    if (!prod) {
      setAdjErrorMessage('Product not found');
      return;
    }

    const inputQty = parseFloat(adjQuantity);
    if (isNaN(inputQty) || inputQty < 0) {
      setAdjErrorMessage('Enter a valid non-negative quantity');
      return;
    }

    let currentStock = prod.stockQuantity;
    if (adjVariantId && prod.variants) {
      const v = prod.variants.find((item) => item.id === adjVariantId);
      if (v) currentStock = v.stockQuantity;
    }

    let newCalculatedStock = inputQty;
    if (adjMode === 'ADD') {
      newCalculatedStock = currentStock + inputQty;
    } else if (adjMode === 'DEDUCT') {
      newCalculatedStock = Math.max(0, currentStock - inputQty);
    }

    try {
      db.adjustStock({
        businessId: activeBusiness.id,
        productId: adjProductId,
        variantId: adjVariantId || undefined,
        newStock: newCalculatedStock,
        reason: `${adjReason}: ${adjMode === 'RECOUNT' ? 'Set balance to' : adjMode === 'ADD' ? 'Added' : 'Deducted'} ${inputQty} ${prod.unit}`,
        date: new Date(adjDate).getTime() || Date.now(),
      });
      loadData();
      setSubView('LIST');
    } catch (err: unknown) {
      setAdjErrorMessage(err instanceof Error ? err.message : 'Adjustment failed');
    }
  };

  // -------------------------------------------------------------
  // Render Sub-Views
  // -------------------------------------------------------------

  // 1. ADD / EDIT PRODUCT VIEW
  if (subView === 'ADD_PRODUCT' || subView === 'EDIT_PRODUCT') {
    const isClothing = activeBusiness.businessType === 'CLOTHING';
    const profitMargin =
      parseFloat(formSellingPrice) > 0 && parseFloat(formPurchaseCost) > 0
        ? Math.round(
            ((parseFloat(formSellingPrice) - parseFloat(formPurchaseCost)) / parseFloat(formSellingPrice)) * 100
          )
        : null;

    return (
      <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
        {/* Header */}
        <div className="pt-3 px-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-[#0F4D32] text-white min-h-[56px] shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSubView(selectedProductId ? 'PRODUCT_DETAIL' : 'LIST')}
              className="p-1 -ml-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/40"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold tracking-tight">
              {subView === 'ADD_PRODUCT' ? 'Add New Product' : 'Edit Product'}
            </h1>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 font-medium">
            {isClothing ? "Clothing / Men's Wear" : 'Kirana Store'}
          </span>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {formErrorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrorMessage}</span>
            </div>
          )}

          {/* Basic Details Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Product Identification</h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={isClothing ? 'e.g. Slim Fit Denim Jeans' : 'e.g. Basmati Rice Premium'}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F4D32] bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Select or type..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F4D32] bg-slate-50 focus:bg-white"
                />
                <datalist id="category-suggestions">
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Unit of Measurement</label>
                {isClothing ? (
                  <input
                    type="text"
                    disabled
                    value="Pieces (pcs)"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed font-medium"
                  />
                ) : (
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F4D32] bg-slate-50 focus:bg-white font-medium"
                  >
                    {KIRANA_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u} ({u === 'kg' ? 'Kilogram - supports 0.250 kg' : u === 'ltr' ? 'Litre' : u})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Product Code / SKU</label>
                <input
                  type="text"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  placeholder="e.g. SKU-1001"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F4D32] bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Barcode</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="Scan or enter..."
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F4D32] bg-slate-50 focus:bg-white"
                  />
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Margin Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pricing & Valuation</h3>
              {profitMargin !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold ${
                    profitMargin >= 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {profitMargin}% Gross Margin
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Purchase Cost (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={formPurchaseCost}
                  onChange={(e) => setFormPurchaseCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F4D32] bg-slate-50 focus:bg-white font-mono font-semibold"
                />
                <span className="text-[10px] text-slate-400">Cost basis for inventory value & COGS</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Selling Price (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={formSellingPrice}
                  onChange={(e) => setFormSellingPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F4D32] bg-slate-50 focus:bg-white font-mono font-semibold text-[#0F4D32]"
                />
                <span className="text-[10px] text-slate-400">Default rate on Sales invoice</span>
              </div>
            </div>
          </div>

          {/* Clothing Size & Color Variants (Only for CLOTHING) */}
          {isClothing && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Clothing Variants (Size & Colour)
                  </h3>
                  <p className="text-[11px] text-slate-400">Track each size-colour combination independently</p>
                </div>
                <span className="text-xs font-bold text-[#0F4D32] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Total: {formVariants.reduce((s, v) => s + (v.stockQuantity || 0), 0)} pcs
                </span>
              </div>

              {/* Add Variant Form */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Size</label>
                    <select
                      value={variantSize}
                      onChange={(e) => setVariantSize(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      {CLOTHING_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Colour</label>
                    <select
                      value={variantColor}
                      onChange={(e) => setVariantColor(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      {CLOTHING_COLORS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={variantQty}
                      onChange={(e) => setVariantQty(e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono text-center font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="w-full py-1.5 text-xs font-bold rounded-lg bg-[#0F4D32] hover:bg-emerald-800 text-white flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Size-Colour Variant</span>
                </button>
              </div>

              {/* Variants Table */}
              {formVariants.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {formVariants.map((v) => (
                    <div key={v.id} className="p-2.5 flex items-center justify-between bg-white text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          Size {v.size}
                        </span>
                        <span className="font-medium text-slate-600">{v.color}</span>
                        {v.sku && <span className="text-[10px] text-slate-400 font-mono">({v.sku})</span>}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold font-mono text-slate-900">{v.stockQuantity} pcs</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-2">
                  No variants added yet. E.g. Add Size 30 Blue = 3 pcs, Size 32 Blue = 5 pcs.
                </p>
              )}
            </div>
          )}

          {/* Stock & Thresholds Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Stock & Alerts</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Opening Stock ({formUnit})
                </label>
                <input
                  type="number"
                  step={activeBusiness.businessType === 'KIRANA' ? '0.001' : '1'}
                  disabled={isClothing && formVariants.length > 0}
                  value={
                    isClothing && formVariants.length > 0
                      ? formVariants.reduce((s, v) => s + (v.stockQuantity || 0), 0)
                      : formOpeningStock
                  }
                  onChange={(e) => setFormOpeningStock(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F4D32] bg-slate-50 focus:bg-white font-mono font-semibold"
                />
                <span className="text-[10px] text-slate-400">
                  {isClothing && formVariants.length > 0
                    ? 'Sum of all clothing variant quantities'
                    : 'Initial stock available in store'}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Min Stock Alert Level</label>
                <input
                  type="number"
                  step="any"
                  value={formMinStock}
                  onChange={(e) => setFormMinStock(e.target.value)}
                  placeholder="5"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F4D32] bg-slate-50 focus:bg-white font-mono font-semibold"
                />
                <span className="text-[10px] text-slate-400">Triggers Low-Stock warning</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={() => setSubView(selectedProductId ? 'PRODUCT_DETAIL' : 'LIST')}
            className="flex-1 py-3 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveProduct}
            className="flex-2 py-3 text-xs font-bold rounded-xl bg-[#0F4D32] hover:bg-emerald-800 text-white shadow-xs flex items-center justify-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{subView === 'ADD_PRODUCT' ? 'Save New Product' : 'Update Product'}</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. STOCK ADJUSTMENT VIEW
  if (subView === 'ADJUST_STOCK') {
    const targetProduct = products.find((p) => p.id === adjProductId);
    const hasVariants = targetProduct?.variants && targetProduct.variants.length > 0;
    const selectedVariant = hasVariants ? targetProduct?.variants?.find((v) => v.id === adjVariantId) : null;
    const currentStock = selectedVariant ? selectedVariant.stockQuantity : targetProduct ? targetProduct.stockQuantity : 0;
    const qtyInput = parseFloat(adjQuantity) || 0;

    let computedNewStock = qtyInput;
    if (adjMode === 'ADD') computedNewStock = currentStock + qtyInput;
    if (adjMode === 'DEDUCT') computedNewStock = Math.max(0, currentStock - qtyInput);
    const stockDelta = computedNewStock - currentStock;

    return (
      <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
        {/* Header */}
        <div className="pt-3 px-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-[#0F4D32] text-white min-h-[56px] shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSubView('LIST')}
              className="p-1 -ml-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/40"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold tracking-tight">Stock Adjustment</h1>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-800 text-emerald-200 font-medium">
            Audit Reconciliation
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {adjErrorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{adjErrorMessage}</span>
            </div>
          )}

          {/* Product Selection Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Select Product</label>
            <select
              value={adjProductId}
              onChange={(e) => {
                setAdjProductId(e.target.value);
                const p = products.find((prod) => prod.id === e.target.value);
                if (p?.variants && p.variants.length > 0) {
                  setAdjVariantId(p.variants[0].id);
                  setAdjQuantity(p.variants[0].stockQuantity.toString());
                } else if (p) {
                  setAdjVariantId('');
                  setAdjQuantity(p.stockQuantity.toString());
                }
              }}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 font-semibold focus:outline-none focus:border-[#0F4D32]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current: {p.stockQuantity} {p.unit})
                </option>
              ))}
            </select>

            {hasVariants && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Size-Colour Variant</label>
                <select
                  value={adjVariantId}
                  onChange={(e) => {
                    setAdjVariantId(e.target.value);
                    const v = targetProduct?.variants?.find((item) => item.id === e.target.value);
                    if (v) setAdjQuantity(v.stockQuantity.toString());
                  }}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  {targetProduct?.variants?.map((v) => (
                    <option key={v.id} value={v.id}>
                      Size {v.size} - {v.color} (Current: {v.stockQuantity} pcs)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Adjustment Mode Selection */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Adjustment Action</label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjMode('RECOUNT')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                  adjMode === 'RECOUNT'
                    ? 'bg-[#0F4D32] text-white border-[#0F4D32]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Set Balance
              </button>
              <button
                type="button"
                onClick={() => setAdjMode('ADD')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                  adjMode === 'ADD'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                + Stock In
              </button>
              <button
                type="button"
                onClick={() => setAdjMode('DEDUCT')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                  adjMode === 'DEDUCT'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                - Stock Out
              </button>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {adjMode === 'RECOUNT'
                  ? 'New Verified Stock Balance'
                  : adjMode === 'ADD'
                  ? 'Quantity to Add (+)'
                  : 'Quantity to Deduct (-)'}
              </label>
              <input
                type="number"
                step="any"
                value={adjQuantity}
                onChange={(e) => setAdjQuantity(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 text-base font-bold font-mono rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F4D32] bg-slate-50"
              />
            </div>

            {/* Reconciliation Preview Box */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Current Stock</span>
                <span className="font-bold font-mono text-slate-800">
                  {currentStock} {targetProduct?.unit}
                </span>
              </div>
              <ArrowUpDown className="w-4 h-4 text-emerald-700" />
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Resulting Balance</span>
                <span className="font-bold font-mono text-[#0F4D32] text-sm">
                  {computedNewStock} {targetProduct?.unit}
                </span>
                <span
                  className={`block text-[10px] font-bold ${
                    stockDelta > 0 ? 'text-emerald-700' : stockDelta < 0 ? 'text-red-600' : 'text-slate-400'
                  }`}
                >
                  {stockDelta > 0 ? `+${stockDelta}` : stockDelta} {targetProduct?.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Reason & Date Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Narration & Reason</h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Reason / Purpose</label>
              <select
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 font-medium"
              >
                <option value="Physical Recount">Physical Recount / Stock Count Audit</option>
                <option value="Damaged Goods">Damaged / Broken Goods</option>
                <option value="Expired Stock">Expired Stock Discarded</option>
                <option value="Theft or Loss">Theft / Unaccounted Loss</option>
                <option value="Sample or Promotion">Free Sample / Promotion</option>
                <option value="Customer Return">Customer Return (Not in invoice)</option>
                <option value="Supplier Return">Supplier Return (Not in invoice)</option>
                <option value="Correction">Data Entry Correction</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Adjustment Date</label>
              <input
                type="date"
                value={adjDate}
                onChange={(e) => setAdjDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={() => setSubView('LIST')}
            className="flex-1 py-3 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAdjustment}
            className="flex-2 py-3 text-xs font-bold rounded-xl bg-[#0F4D32] hover:bg-emerald-800 text-white shadow-xs flex items-center justify-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Stock Adjustment</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. PRODUCT DETAIL & STOCK REGISTER VIEW
  if (subView === 'PRODUCT_DETAIL' && selectedProduct) {
    const productMovements = movements.filter((m) => m.productId === selectedProduct.id);
    const isClothing = activeBusiness.businessType === 'CLOTHING';
    const isLow = selectedProduct.stockQuantity <= (selectedProduct.minStockLevel ?? 5) && selectedProduct.stockQuantity > 0;
    const isOut = selectedProduct.stockQuantity <= 0;

    return (
      <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
        {/* Header */}
        <div className="pt-3 px-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-[#0F4D32] text-white min-h-[56px] shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setSelectedProductId(null);
                setSubView('LIST');
              }}
              className="p-1 -ml-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/40"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight truncate max-w-[200px] sm:max-w-xs">
                {selectedProduct.name}
              </h1>
              <p className="text-[10px] text-emerald-200">Stock Register & Item Details</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => openEditProduct(selectedProduct)}
              className="p-2 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/40"
              title="Edit Product"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteProduct(selectedProduct.id)}
              className="p-2 rounded-lg text-red-300 hover:text-red-100 hover:bg-red-900/40"
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main Info Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedProduct.category || 'General Items'}
                </span>
                <h2 className="text-lg font-bold text-slate-900">{selectedProduct.name}</h2>
                <div className="flex items-center space-x-2 mt-1 text-xs text-slate-500">
                  {selectedProduct.sku && <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">SKU: {selectedProduct.sku}</span>}
                  {selectedProduct.barcode && (
                    <span className="font-mono flex items-center space-x-1">
                      <Barcode className="w-3.5 h-3.5" />
                      <span>{selectedProduct.barcode}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              {isOut ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                  Out of Stock
                </span>
              ) : isLow ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Low Stock Alert
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  In Stock
                </span>
              )}
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Stock</span>
                <span className="text-base font-bold font-mono text-[#0F4D32]">
                  {selectedProduct.stockQuantity} <span className="text-xs font-normal">{selectedProduct.unit}</span>
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Purchase Cost</span>
                <span className="text-base font-bold font-mono text-slate-800">
                  ₹{selectedProduct.purchaseCost || 0}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Selling Price</span>
                <span className="text-base font-bold font-mono text-emerald-700">
                  ₹{selectedProduct.sellingPrice || 0}
                </span>
              </div>
            </div>

            {/* Valuation */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900">Total Stock Value (Asset):</span>
              <span className="font-mono font-bold text-base text-[#0F4D32]">
                ₹{(selectedProduct.stockQuantity * (selectedProduct.purchaseCost || 0)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Clothing Variants Breakdown (if applicable) */}
          {isClothing && selectedProduct.variants && selectedProduct.variants.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Size & Colour Breakdown
                </h3>
                <span className="text-xs font-bold text-slate-600">
                  {selectedProduct.variants.length} Combinations
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                {selectedProduct.variants.map((v) => (
                  <div key={v.id} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        Size {v.size}
                      </span>
                      <span className="font-medium text-slate-700">{v.color}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`font-mono font-bold ${
                          v.stockQuantity <= 0 ? 'text-red-600' : 'text-slate-900'
                        }`}
                      >
                        {v.stockQuantity} pcs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock Movement Register Table */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <History className="w-4 h-4 text-emerald-800" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Product Stock Register
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                {productMovements.length} Movements Logged
              </span>
            </div>

            {productMovements.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {productMovements.map((m) => {
                  const isPositive = m.type === 'IN' || m.type === 'PURCHASE' || m.type === 'OPENING' || (m.type === 'ADJUSTMENT' && m.newStock > m.previousStock);
                  return (
                    <div key={m.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                              m.type === 'SALE'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : m.type === 'PURCHASE'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : m.type === 'OPENING'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {m.type}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {m.referenceNo || m.reason || 'Stock Update'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(m.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          • Prev: {m.previousStock} → New: {m.newStock}
                          {m.variantInfo && ` (${m.variantInfo})`}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono font-bold ${
                            isPositive ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          {isPositive ? `+${m.quantity}` : `-${m.quantity}`} {selectedProduct.unit}
                        </span>
                        <span className="block text-[10px] font-mono text-slate-400">
                          Bal: {m.newStock}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No movements recorded yet for this product.
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3 shrink-0">
          <button
            onClick={() => openStockAdjustment(selectedProduct)}
            className="flex-1 py-3 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center justify-center space-x-1.5"
          >
            <ArrowUpDown className="w-4 h-4 text-emerald-800" />
            <span>Adjust Stock</span>
          </button>
          {onNavigateToSale && (
            <button
              onClick={() => onNavigateToSale(selectedProduct.id)}
              className="flex-1 py-3 text-xs font-bold rounded-xl bg-[#0F4D32] hover:bg-emerald-800 text-white shadow-xs flex items-center justify-center space-x-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Create Sale</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. MAIN INVENTORY LIST VIEW
  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
      {/* Top MSbook Header */}
      <div className="pt-3 px-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-[#0F4D32] text-white min-h-[56px] shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateBack}
            className="p-1 -ml-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-800/40"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold tracking-tight">Inventory & Stock</h1>
            <p className="text-[10px] text-emerald-200">{activeBusiness.businessName}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => openStockAdjustment()}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-semibold flex items-center space-x-1 transition-colors border border-emerald-700 shadow-xs"
            title="Audit / Stock Adjustment"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Adjust</span>
          </button>
          <button
            onClick={openAddProduct}
            className="px-3 py-1.5 rounded-xl bg-white text-[#0F4D32] hover:bg-emerald-50 text-xs font-bold flex items-center space-x-1 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Summary Valuation Strip */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Value</span>
            <span className="text-xs font-black font-mono text-[#0F4D32] truncate block">
              ₹{summary.totalStockValue.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Items</span>
            <span className="text-xs font-black font-mono text-slate-800 block">{summary.totalProducts}</span>
          </div>
          <div
            onClick={() => setActiveTab('LOW_STOCK')}
            className={`p-2 rounded-xl border cursor-pointer transition-colors ${
              activeTab === 'LOW_STOCK'
                ? 'bg-amber-100 border-amber-300'
                : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/50'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Low Stock</span>
            <span className="text-xs font-black font-mono text-amber-800 block">{summary.lowStockCount}</span>
          </div>
          <div
            onClick={() => setActiveTab('OUT_OF_STOCK')}
            className={`p-2 rounded-xl border cursor-pointer transition-colors ${
              activeTab === 'OUT_OF_STOCK'
                ? 'bg-red-100 border-red-300'
                : 'bg-red-50/70 border-red-200 hover:bg-red-100/50'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">Out of Stock</span>
            <span className="text-xs font-black font-mono text-red-800 block">{summary.outOfStockCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 flex items-center space-x-6 text-xs font-bold overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'ALL' ? 'border-[#0F4D32] text-[#0F4D32]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Items ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('LOW_STOCK')}
          className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'LOW_STOCK' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Low Stock ({summary.lowStockCount})
        </button>
        <button
          onClick={() => setActiveTab('OUT_OF_STOCK')}
          className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'OUT_OF_STOCK' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Out of Stock ({summary.outOfStockCount})
        </button>
        <button
          onClick={() => setActiveTab('MOVEMENTS')}
          className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'MOVEMENTS' ? 'border-[#0F4D32] text-[#0F4D32]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Movements Log ({movements.length})
        </button>
      </div>

      {/* Search & Category Filter (Visible in Product Tabs) */}
      {activeTab !== 'MOVEMENTS' && (
        <div className="p-3 bg-white border-b border-slate-200 space-y-2 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU, or barcode..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#0F4D32] bg-slate-50"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 max-w-[130px]"
            >
              <option value="ALL">All Categories</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Movements Tab Content */}
        {activeTab === 'MOVEMENTS' ? (
          movements.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-xs">
              {movements.map((m) => {
                const isPositive =
                  m.type === 'IN' ||
                  m.type === 'PURCHASE' ||
                  m.type === 'OPENING' ||
                  (m.type === 'ADJUSTMENT' && m.newStock > m.previousStock);
                return (
                  <div key={m.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            m.type === 'SALE'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : m.type === 'PURCHASE'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : m.type === 'OPENING'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {m.type}
                        </span>
                        <span className="font-bold text-slate-900">{m.productName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(m.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        • {m.referenceNo || m.reason || 'Manual Update'}
                        {m.variantInfo && ` • ${m.variantInfo}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold ${
                          isPositive ? 'text-emerald-700' : 'text-red-600'
                        }`}
                      >
                        {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-400">
                        New: {m.newStock}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
              <History className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No stock movements recorded</p>
              <p className="text-[11px] text-slate-400">
                Movements are automatically created when you record Sales, Purchases, or Adjustments.
              </p>
            </div>
          )
        ) : filteredProducts.length > 0 ? (
          /* Products List */
          filteredProducts.map((p) => {
            const isLow = p.stockQuantity <= (p.minStockLevel ?? 5) && p.stockQuantity > 0;
            const isOut = p.stockQuantity <= 0;
            const isClothing = activeBusiness.businessType === 'CLOTHING';

            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProductId(p.id);
                  setSubView('PRODUCT_DETAIL');
                }}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-emerald-300 transition-colors shadow-xs cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                      {p.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {p.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
                      {p.sku && <span className="font-mono">SKU: {p.sku}</span>}
                      {p.barcode && (
                        <span className="font-mono flex items-center space-x-1">
                          <Barcode className="w-3 h-3" />
                          <span>{p.barcode}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Quantity Badge */}
                  <div className="text-right">
                    <span
                      className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg border ${
                        isOut
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : isLow
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {p.stockQuantity} {p.unit}
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">
                      {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Available'}
                    </span>
                  </div>
                </div>

                {/* Clothing Variants Chip preview */}
                {isClothing && p.variants && p.variants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.variants.slice(0, 4).map((v) => (
                      <span
                        key={v.id}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-600 font-mono"
                      >
                        {v.size}/{v.color}: <strong className="text-slate-800">{v.stockQuantity}</strong>
                      </span>
                    ))}
                    {p.variants.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-400">
                        +{p.variants.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Price and Stock Value Row */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3 text-slate-600">
                    <span>
                      Cost: <strong className="font-mono text-slate-800">₹{p.purchaseCost || 0}</strong>
                    </span>
                    <span>
                      Sell: <strong className="font-mono text-emerald-700">₹{p.sellingPrice || 0}</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-slate-400 hover:text-[#0F4D32]">
                    <span className="text-[11px] font-semibold">Stock Register</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Clean Zero Starting Empty State */
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 my-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0F4D32] flex items-center justify-center mx-auto border border-emerald-100">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {activeTab === 'LOW_STOCK'
                  ? 'No low stock alerts'
                  : activeTab === 'OUT_OF_STOCK'
                  ? 'No out of stock items'
                  : 'No products in inventory'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                {activeTab === 'ALL'
                  ? 'Add your first product to start tracking stock levels, barcodes, purchase costs, and sales bills.'
                  : 'All your inventory items currently have sufficient stock levels.'}
              </p>
            </div>
            {activeTab === 'ALL' && (
              <button
                onClick={openAddProduct}
                className="px-5 py-2.5 rounded-xl bg-[#0F4D32] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Product</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {subView === 'LIST' && activeTab !== 'MOVEMENTS' && (
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-800">{filteredProducts.length}</strong> items
          </div>
          <button
            onClick={openAddProduct}
            className="px-4 py-2 rounded-xl bg-[#0F4D32] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      )}
    </div>
  );
};
