import {
  Business,
  BusinessType,
  Customer,
  Supplier,
  LedgerAccount,
  Product,
  ProductVariant,
  StockMovement,
  StockMovementType,
  InventorySummary,
  Voucher,
  VoucherItem,
  JournalEntry,
  CustomerLedgerSummary,
  CustomerTransactionRow,
  SupplierLedgerSummary,
  SupplierTransactionRow,
  GeneralLedgerSummary,
  AccountTransactionRow,
  BusinessFinancialSummary,
  VoucherType,
  BusinessSettings,
  MSbookBackupPayload,
  ExportDataType,
} from '../types';

const STORAGE_KEY_BUSINESSES = 'msbook_room_db_businesses';
const STORAGE_KEY_ACTIVE_ID = 'msbook_datastore_active_business_id';
const STORAGE_KEY_CUSTOMERS = 'msbook_room_db_customers';
const STORAGE_KEY_SUPPLIERS = 'msbook_room_db_suppliers';
const STORAGE_KEY_ACCOUNTS = 'msbook_room_db_ledger_accounts';
const STORAGE_KEY_PRODUCTS = 'msbook_room_db_products';
const STORAGE_KEY_STOCK_MOVEMENTS = 'msbook_room_db_stock_movements';
const STORAGE_KEY_VOUCHERS = 'msbook_room_db_vouchers';
const STORAGE_KEY_VOUCHER_ITEMS = 'msbook_room_db_voucher_items';
const STORAGE_KEY_JOURNALS = 'msbook_room_db_journal_entries';
const STORAGE_KEY_BUSINESS_SETTINGS = 'msbook_room_db_business_settings';
const STORAGE_KEY_DEMO_PURGED = 'msbook_clean_data_purged_step3_v2';

class RoomDatabaseSimulator {
  private listeners: Array<() => void> = [];

  constructor() {
    this.purgeDemoDataMigration();
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Listener notification error', err);
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // --- Step 3 Requirement: Purge all Demo / Hardcoded Data ---
  private purgeDemoDataMigration(): void {
    try {
      const alreadyPurged = localStorage.getItem(STORAGE_KEY_DEMO_PURGED);
      if (alreadyPurged === 'true') {
        return;
      }

      // 1. Purge Demo Customers (Rahul, Suresh Patel, Ramesh, or demo prefixes)
      const rawCustomers = this.getAllCustomersRaw();
      const demoNames = ['rahul', 'rahul sharma', 'suresh', 'suresh patel', 'ramesh', 'ramesh verma'];
      const realCustomers = rawCustomers.filter((c) => {
        const lower = (c.name || '').trim().toLowerCase();
        return !demoNames.includes(lower) && !c.id.startsWith('demo_');
      });
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(realCustomers));

      // 2. Purge Demo Suppliers
      const rawSuppliers = this.getAllSuppliersRaw();
      const realSuppliers = rawSuppliers.filter((s) => !s.id.startsWith('demo_'));
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(realSuppliers));

      // 3. Purge Demo Products (Basmati Rice Premium, Sunflower Oil, Sugar, Atta, Shirt, Jeans, Polo T-Shirt if created during initial mock seeder)
      const rawProducts = this.getAllProductsRaw();
      const demoProductNames = [
        'basmati rice premium',
        'sunflower cooking oil',
        'refined white sugar',
        'wheat atta premium',
        'formal cotton shirt',
        'slim fit denim jeans',
        'casual polo t-shirt',
      ];
      const realProducts = rawProducts.filter((p) => {
        const lower = (p.name || '').trim().toLowerCase();
        return !demoProductNames.includes(lower);
      });
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(realProducts));

      // 4. Purge Demo Vouchers (Invoice 001, Invoice 002, Invoice 003, Invoice 004, etc.)
      const rawVouchers = this.getAllVouchersRaw();
      const demoRemarks = ['invoice 001', 'invoice 002', 'invoice 003', 'invoice 004'];
      const realVouchers = rawVouchers.filter((v) => {
        const rem = (v.remarks || '').trim().toLowerCase();
        return !demoRemarks.includes(rem) && !v.id.startsWith('demo_');
      });
      localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(realVouchers));

      const validVoucherIds = new Set(realVouchers.map((v) => v.id));

      // 5. Purge Demo Voucher Items
      const rawItems = this.getAllVoucherItemsRaw();
      const realItems = rawItems.filter((i) => validVoucherIds.has(i.voucherId));
      localStorage.setItem(STORAGE_KEY_VOUCHER_ITEMS, JSON.stringify(realItems));

      // 6. Purge Demo Journals
      const rawJournals = this.getAllJournalsRaw();
      const realJournals = rawJournals.filter((j) => validVoucherIds.has(j.voucherId));
      localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(realJournals));

      localStorage.setItem(STORAGE_KEY_DEMO_PURGED, 'true');
    } catch (e) {
      console.warn('Demo data migration error:', e);
    }
  }

  // --- Businesses ---
  getAllBusinesses(): Business[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_BUSINESSES);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  getBusinessById(id: string): Business | null {
    const all = this.getAllBusinesses();
    return all.find((b) => b.id === id) || null;
  }

  getActiveBusinessId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    } catch {
      return null;
    }
  }

  getActiveBusiness(): Business | null {
    const activeId = this.getActiveBusinessId();
    if (!activeId) return null;
    return this.getBusinessById(activeId);
  }

  setActiveBusinessId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
      this.initDefaultAccountsForBusiness(id);
      this.notify();
    } catch (e) {
      console.error('Failed to set active business ID', e);
    }
  }

  insertBusiness(params: {
    businessName: string;
    businessType: BusinessType;
    ownerName?: string;
    mobileNumber?: string;
    address?: string;
  }): Business {
    const trimmedName = params.businessName.trim();
    if (!trimmedName) {
      throw new Error('Business name cannot be empty');
    }

    const all = this.getAllBusinesses();
    const id = 'biz_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    const now = Date.now();

    const newBusiness: Business = {
      id,
      businessName: trimmedName,
      businessType: params.businessType,
      ownerName: (params.ownerName || '').trim(),
      mobileNumber: (params.mobileNumber || '').trim(),
      address: (params.address || '').trim(),
      createdAt: now,
      updatedAt: now,
    };

    all.push(newBusiness);
    localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(all));
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);

    // Initialize clean system accounts with ₹0 balance. NO demo customers, products or invoices!
    this.initDefaultAccountsForBusiness(id);
    this.notify();
    return newBusiness;
  }

  ensureActiveBusiness(): string | null {
    const currentActiveId = this.getActiveBusinessId();
    const all = this.getAllBusinesses();

    if (currentActiveId && all.some((b) => b.id === currentActiveId)) {
      this.initDefaultAccountsForBusiness(currentActiveId);
      return currentActiveId;
    }

    if (all.length > 0) {
      const firstId = all[0].id;
      this.setActiveBusinessId(firstId);
      return firstId;
    }

    localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    this.notify();
    return null;
  }

  updateBusiness(id: string, updates: Partial<Business>): Business {
    const all = this.getAllBusinesses();
    const index = all.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Business with ID ${id} not found`);
    }

    const current = all[index];
    const updated: Business = {
      ...current,
      ...updates,
      id: current.id,
      businessName: updates.businessName !== undefined ? updates.businessName.trim() : current.businessName,
      ownerName: updates.ownerName !== undefined ? updates.ownerName.trim() : current.ownerName,
      mobileNumber: updates.mobileNumber !== undefined ? updates.mobileNumber.trim() : current.mobileNumber,
      address: updates.address !== undefined ? updates.address.trim() : current.address,
      businessType: updates.businessType || current.businessType,
      updatedAt: Date.now(),
    };

    all[index] = updated;
    localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(all));
    this.notify();
    return updated;
  }

  deleteBusiness(id: string): boolean {
    const all = this.getAllBusinesses();
    if (all.length <= 1) {
      throw new Error('Cannot delete the only business. At least one business is required.');
    }

    const remaining = all.filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(remaining));

    // Remove isolated records for this business
    try {
      const customers = this.getAllCustomersRaw().filter((c) => c.businessId !== id);
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));

      const suppliers = this.getAllSuppliersRaw().filter((s) => s.businessId !== id);
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(suppliers));

      const accounts = this.getAllAccountsRaw().filter((a) => a.businessId !== id);
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));

      const products = this.getAllProductsRaw().filter((p) => p.businessId !== id);
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));

      const movements = this.getAllStockMovementsRaw().filter((m) => m.businessId !== id);
      localStorage.setItem(STORAGE_KEY_STOCK_MOVEMENTS, JSON.stringify(movements));

      const vouchers = this.getAllVouchersRaw().filter((v) => v.businessId !== id);
      localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(vouchers));

      const items = this.getAllVoucherItemsRaw().filter((i) => i.businessId !== id);
      localStorage.setItem(STORAGE_KEY_VOUCHER_ITEMS, JSON.stringify(items));

      const journals = this.getAllJournalsRaw().filter((j) => j.businessId !== id);
      localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(journals));

      const settingsMap = this.getAllBusinessSettingsRaw();
      delete settingsMap[id];
      localStorage.setItem(STORAGE_KEY_BUSINESS_SETTINGS, JSON.stringify(settingsMap));
    } catch (e) {
      console.warn('Error purging business data on delete', e);
    }

    if (this.getActiveBusinessId() === id) {
      this.setActiveBusinessId(remaining[0].id);
    } else {
      this.notify();
    }
    return true;
  }

  // --- Business Settings (Invoice, Financial Year, Default Units) ---
  getAllBusinessSettingsRaw(): Record<string, BusinessSettings> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_BUSINESS_SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  getBusinessSettings(businessId: string): BusinessSettings {
    const rawMap = this.getAllBusinessSettingsRaw();
    if (rawMap[businessId]) {
      return rawMap[businessId];
    }

    const biz = this.getBusinessById(businessId);
    const isClothing = biz?.businessType === 'CLOTHING';

    const defaultSettings: BusinessSettings = {
      businessId,
      invoiceSettings: {
        invoicePrefix: 'INV',
        autoNumbering: true,
        nextInvoiceNumber: 1,
        showBusinessDetails: true,
        showCustomerDetails: true,
        defaultInvoiceNotes: 'Thank you for your business! Goods once sold will not be returned.',
      },
      financialYear: {
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        label: 'FY 2026-27',
      },
      unitSettings: {
        defaultUnit: isClothing ? 'pcs' : 'kg',
        allowedUnits: ['kg', 'g', 'ltr', 'ml', 'pcs', 'pkt', 'box'],
      },
      updatedAt: Date.now(),
    };

    rawMap[businessId] = defaultSettings;
    try {
      localStorage.setItem(STORAGE_KEY_BUSINESS_SETTINGS, JSON.stringify(rawMap));
    } catch {}
    return defaultSettings;
  }

  updateBusinessSettings(businessId: string, updates: Partial<BusinessSettings>): BusinessSettings {
    const rawMap = this.getAllBusinessSettingsRaw();
    const current = this.getBusinessSettings(businessId);

    const merged: BusinessSettings = {
      ...current,
      ...updates,
      businessId,
      invoiceSettings: updates.invoiceSettings
        ? { ...current.invoiceSettings, ...updates.invoiceSettings }
        : current.invoiceSettings,
      financialYear: updates.financialYear
        ? { ...current.financialYear, ...updates.financialYear }
        : current.financialYear,
      unitSettings: updates.unitSettings
        ? { ...current.unitSettings, ...updates.unitSettings }
        : current.unitSettings,
      updatedAt: Date.now(),
    };

    rawMap[businessId] = merged;
    localStorage.setItem(STORAGE_KEY_BUSINESS_SETTINGS, JSON.stringify(rawMap));
    this.notify();
    return merged;
  }

  // --- System Ledger Accounts Setup (Zero Balances) ---
  private initDefaultAccountsForBusiness(businessId: string): void {
    const existingAccounts = this.getLedgerAccounts(businessId);
    if (existingAccounts.length > 0) return;

    const defaultAccounts: Array<{
      name: string;
      group: LedgerAccount['group'];
      subGroup: string;
    }> = [
      { name: 'Cash Account', group: 'ASSET', subGroup: 'Cash-in-hand' },
      { name: 'Bank Account', group: 'ASSET', subGroup: 'Bank Accounts' },
      { name: 'UPI Account', group: 'ASSET', subGroup: 'Digital Payments' },
      { name: 'Sales Account', group: 'INCOME', subGroup: 'Direct Income' },
      { name: 'Purchase Account', group: 'EXPENSE', subGroup: 'Direct Expenses' },
      { name: 'Customer Receivable', group: 'ASSET', subGroup: 'Sundry Debtors' },
      { name: 'Supplier Payable', group: 'LIABILITY', subGroup: 'Sundry Creditors' },
      { name: 'Inventory Asset', group: 'ASSET', subGroup: 'Stock-in-hand' },
      { name: 'Cost of Goods Sold', group: 'EXPENSE', subGroup: 'Cost of Sales' },
      { name: 'General Expenses', group: 'EXPENSE', subGroup: 'Indirect Expenses' },
      { name: 'Shop Rent', group: 'EXPENSE', subGroup: 'Operating Expenses' },
      { name: 'Staff Salary', group: 'EXPENSE', subGroup: 'Operating Expenses' },
      { name: 'Electricity Bill', group: 'EXPENSE', subGroup: 'Utilities' },
      { name: 'Other Income', group: 'INCOME', subGroup: 'Indirect Income' },
    ];

    const allAccounts = this.getAllAccountsRaw();
    const now = Date.now();

    defaultAccounts.forEach((acc) => {
      allAccounts.push({
        id: 'acc_' + Math.random().toString(36).substring(2, 9),
        businessId,
        name: acc.name,
        group: acc.group,
        subGroup: acc.subGroup,
        openingBalance: 0, // Starts at clean ₹0
        isSystem: true,
        createdAt: now,
      });
    });

    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(allAccounts));
  }

  // --- Customers Management ---
  getCustomers(businessId: string): Customer[] {
    try {
      const all = this.getAllCustomersRaw();
      return all
        .filter((c) => c.businessId === businessId)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  getCustomerById(id: string): Customer | null {
    const all = this.getAllCustomersRaw();
    return all.find((c) => c.id === id) || null;
  }

  createCustomer(
    paramOrBusinessId:
      | string
      | {
          businessId: string;
          name: string;
          mobileNumber?: string;
          address?: string;
          openingBalance?: number;
        },
    nameArg?: string,
    mobileNumberArg?: string,
    addressArg?: string,
    openingBalanceArg?: number
  ): Customer {
    const params =
      typeof paramOrBusinessId === 'string'
        ? {
            businessId: paramOrBusinessId,
            name: nameArg || '',
            mobileNumber: mobileNumberArg || '',
            address: addressArg || '',
            openingBalance: openingBalanceArg || 0,
          }
        : paramOrBusinessId;

    const trimmed = params.name.trim();
    if (!trimmed) {
      throw new Error('Customer name cannot be empty');
    }

    const all = this.getAllCustomersRaw();
    const customer: Customer = {
      id: 'cust_' + Math.random().toString(36).substring(2, 9),
      businessId: params.businessId,
      name: trimmed,
      mobileNumber: (params.mobileNumber || '').trim(),
      address: (params.address || '').trim(),
      openingBalance: Number(params.openingBalance) || 0,
      createdAt: Date.now(),
    };

    all.push(customer);
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(all));
    this.notify();
    return customer;
  }

  updateCustomer(
    id: string,
    params: {
      name?: string;
      mobileNumber?: string;
      address?: string;
      openingBalance?: number;
    }
  ): Customer {
    const all = this.getAllCustomersRaw();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new Error('Customer not found');
    }

    const existing = all[idx];
    const updated: Customer = {
      ...existing,
      name: params.name !== undefined ? params.name.trim() : existing.name,
      mobileNumber: params.mobileNumber !== undefined ? params.mobileNumber.trim() : existing.mobileNumber,
      address: params.address !== undefined ? params.address.trim() : existing.address,
      openingBalance:
        params.openingBalance !== undefined ? Number(params.openingBalance) || 0 : existing.openingBalance || 0,
    };

    all[idx] = updated;
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(all));
    this.notify();
    return updated;
  }

  deleteCustomer(id: string): void {
    const all = this.getAllCustomersRaw().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(all));
    this.notify();
  }

  private getAllCustomersRaw(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- Suppliers Management ---
  getSuppliers(businessId: string): Supplier[] {
    try {
      const all = this.getAllSuppliersRaw();
      return all
        .filter((s) => s.businessId === businessId)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  getSupplierById(id: string): Supplier | null {
    const all = this.getAllSuppliersRaw();
    return all.find((s) => s.id === id) || null;
  }

  createSupplier(
    paramOrBusinessId:
      | string
      | {
          businessId: string;
          name: string;
          mobileNumber?: string;
          address?: string;
          openingBalance?: number;
        },
    nameArg?: string,
    mobileNumberArg?: string,
    addressArg?: string,
    openingBalanceArg?: number
  ): Supplier {
    const params =
      typeof paramOrBusinessId === 'string'
        ? {
            businessId: paramOrBusinessId,
            name: nameArg || '',
            mobileNumber: mobileNumberArg || '',
            address: addressArg || '',
            openingBalance: openingBalanceArg || 0,
          }
        : paramOrBusinessId;

    const trimmed = params.name.trim();
    if (!trimmed) {
      throw new Error('Supplier name cannot be empty');
    }

    const all = this.getAllSuppliersRaw();
    const supplier: Supplier = {
      id: 'supp_' + Math.random().toString(36).substring(2, 9),
      businessId: params.businessId,
      name: trimmed,
      mobileNumber: (params.mobileNumber || '').trim(),
      address: (params.address || '').trim(),
      openingBalance: Number(params.openingBalance) || 0,
      createdAt: Date.now(),
    };

    all.push(supplier);
    localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(all));
    this.notify();
    return supplier;
  }

  updateSupplier(
    id: string,
    params: {
      name?: string;
      mobileNumber?: string;
      address?: string;
      openingBalance?: number;
    }
  ): Supplier {
    const all = this.getAllSuppliersRaw();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new Error('Supplier not found');
    }

    const existing = all[idx];
    const updated: Supplier = {
      ...existing,
      name: params.name !== undefined ? params.name.trim() : existing.name,
      mobileNumber: params.mobileNumber !== undefined ? params.mobileNumber.trim() : existing.mobileNumber,
      address: params.address !== undefined ? params.address.trim() : existing.address,
      openingBalance:
        params.openingBalance !== undefined ? Number(params.openingBalance) || 0 : existing.openingBalance || 0,
    };

    all[idx] = updated;
    localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(all));
    this.notify();
    return updated;
  }

  deleteSupplier(id: string): void {
    const all = this.getAllSuppliersRaw().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(all));
    this.notify();
  }

  private getAllSuppliersRaw(): Supplier[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- Ledger Accounts ---
  getLedgerAccounts(businessId: string): LedgerAccount[] {
    try {
      const all = this.getAllAccountsRaw();
      return all
        .filter((a) => a.businessId === businessId)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  createCustomLedger(params: {
    businessId: string;
    name: string;
    group: LedgerAccount['group'];
    subGroup?: string;
    openingBalance?: number;
  }): LedgerAccount {
    const trimmed = params.name.trim();
    if (!trimmed) {
      throw new Error('Ledger account name cannot be empty');
    }

    const all = this.getAllAccountsRaw();
    const newAccount: LedgerAccount = {
      id: 'acc_' + Math.random().toString(36).substring(2, 9),
      businessId: params.businessId,
      name: trimmed,
      group: params.group,
      subGroup: (params.subGroup || '').trim(),
      openingBalance: Number(params.openingBalance) || 0,
      isSystem: false,
      createdAt: Date.now(),
    };

    all.push(newAccount);
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(all));
    this.notify();
    return newAccount;
  }

  private getAllAccountsRaw(): LedgerAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- Products & Inventory ---
  getProducts(businessId: string): Product[] {
    try {
      const all = this.getAllProductsRaw();
      return all
        .filter((p) => p.businessId === businessId)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }

  getProductById(id: string): Product | null {
    const all = this.getAllProductsRaw();
    return all.find((p) => p.id === id) || null;
  }

  getProductByBarcode(businessId: string, barcode: string): Product | null {
    if (!barcode || !barcode.trim()) return null;
    const products = this.getProducts(businessId);
    return products.find((p) => p.barcode && p.barcode.trim() === barcode.trim()) || null;
  }

  createProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
    const all = this.getAllProductsRaw();
    const now = Date.now();
    const id = 'prod_' + Math.random().toString(36).substring(2, 9);

    // If clothing variants are present, calculate total stock as sum of variants
    let effectiveStock = Number(product.stockQuantity) || 0;
    if (product.variants && product.variants.length > 0) {
      effectiveStock = product.variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);
    }

    const newProd: Product = {
      ...product,
      id,
      stockQuantity: effectiveStock,
      openingStock: product.openingStock !== undefined ? Number(product.openingStock) : effectiveStock,
      minStockLevel: product.minStockLevel !== undefined ? Number(product.minStockLevel) : 5,
      createdAt: now,
      updatedAt: now,
    };

    all.push(newProd);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(all));

    // If opening stock > 0, log an OPENING stock movement & double-entry journal
    if (effectiveStock > 0) {
      this.recordStockMovement({
        businessId: newProd.businessId,
        productId: newProd.id,
        productName: newProd.name,
        variantInfo: newProd.variantInfo || (newProd.variants?.length ? `${newProd.variants.length} Variants` : ''),
        type: 'OPENING',
        quantity: effectiveStock,
        previousStock: 0,
        newStock: effectiveStock,
        reason: 'Opening stock balance',
        date: now,
      });

      // Synchronize double-entry opening inventory value
      const openingValue = effectiveStock * (newProd.purchaseCost || 0);
      if (openingValue > 0) {
        const allJournals = this.getAllJournalsRaw();
        allJournals.push(
          {
            id: 'je_' + Math.random().toString(36).substring(2, 9),
            businessId: newProd.businessId,
            voucherId: 'open_inv_' + newProd.id,
            accountName: 'Inventory Asset',
            debit: openingValue,
            credit: 0,
            date: now,
            narration: `Opening inventory stock for ${newProd.name}`,
          },
          {
            id: 'je_' + Math.random().toString(36).substring(2, 9),
            businessId: newProd.businessId,
            voucherId: 'open_inv_' + newProd.id,
            accountName: 'Capital Account',
            debit: 0,
            credit: openingValue,
            date: now,
            narration: `Opening equity offset for ${newProd.name}`,
          }
        );
        localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(allJournals));
      }
    }

    this.notify();
    return newProd;
  }

  updateProduct(id: string, updates: Partial<Product>): Product {
    const all = this.getAllProductsRaw();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error('Product not found');
    }

    const existing = all[idx];
    let newStock = updates.stockQuantity !== undefined ? Number(updates.stockQuantity) : existing.stockQuantity;
    if (updates.variants && updates.variants.length > 0) {
      newStock = updates.variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);
    }

    const updated: Product = {
      ...existing,
      ...updates,
      stockQuantity: newStock,
      updatedAt: Date.now(),
    };

    all[idx] = updated;
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(all));
    this.notify();
    return updated;
  }

  deleteProduct(id: string): void {
    const all = this.getAllProductsRaw().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(all));
    this.notify();
  }

  // --- Stock Adjustment ---
  adjustStock(params: {
    businessId: string;
    productId: string;
    variantId?: string;
    newStock: number;
    reason: string;
    date?: number;
  }): StockMovement {
    const { businessId, productId, variantId, newStock, reason } = params;
    const now = params.date || Date.now();

    const allProducts = this.getAllProductsRaw();
    const prod = allProducts.find((p) => p.id === productId && p.businessId === businessId);
    if (!prod) {
      throw new Error('Product not found for adjustment');
    }

    let previousStock = prod.stockQuantity;
    let variantDesc = prod.variantInfo || '';

    if (variantId && prod.variants) {
      const v = prod.variants.find((item) => item.id === variantId);
      if (v) {
        previousStock = v.stockQuantity;
        v.stockQuantity = newStock;
        variantDesc = `${v.size} / ${v.color}`;
        // Recompute parent product total stock
        prod.stockQuantity = prod.variants.reduce((sum, item) => sum + (Number(item.stockQuantity) || 0), 0);
      } else {
        prod.stockQuantity = newStock;
      }
    } else {
      prod.stockQuantity = newStock;
    }

    const diff = newStock - previousStock;
    const type: StockMovementType = 'ADJUSTMENT';

    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(allProducts));

    // Record Stock Movement log
    const movement = this.recordStockMovement({
      businessId,
      productId: prod.id,
      productName: prod.name,
      variantId,
      variantInfo: variantDesc,
      type,
      quantity: Math.abs(diff),
      previousStock,
      newStock,
      reason: reason || 'Manual stock adjustment',
      date: now,
    });

    // Accounting Entry for stock adjustment
    const costPerUnit = prod.purchaseCost || 0;
    const valueDelta = Math.abs(diff) * costPerUnit;

    if (valueDelta > 0) {
      const allJournals = this.getAllJournalsRaw();
      const voucherId = 'adj_' + movement.id;
      if (diff > 0) {
        // Stock Gain (Debit Inventory Asset, Credit Gain / Adjustment)
        allJournals.push({
          id: 'je_' + Math.random().toString(36).substring(2, 9),
          businessId,
          voucherId,
          accountName: 'Inventory Asset',
          debit: valueDelta,
          credit: 0,
          date: now,
          narration: `Stock count surplus adjustment for ${prod.name} (+${diff})`,
        });
      } else {
        // Stock Loss (Debit Cost of Goods Sold / Loss, Credit Inventory Asset)
        allJournals.push(
          {
            id: 'je_' + Math.random().toString(36).substring(2, 9),
            businessId,
            voucherId,
            accountName: 'Cost of Goods Sold',
            debit: valueDelta,
            credit: 0,
            date: now,
            narration: `Stock loss/shrinkage for ${prod.name} (${diff} units)`,
          },
          {
            id: 'je_' + Math.random().toString(36).substring(2, 9),
            businessId,
            voucherId,
            accountName: 'Inventory Asset',
            debit: 0,
            credit: valueDelta,
            date: now,
            narration: `Inventory asset reduction on adjustment for ${prod.name}`,
          }
        );
      }
      localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(allJournals));
    }

    this.notify();
    return movement;
  }

  // --- Stock Movements Log ---
  recordStockMovement(movement: Omit<StockMovement, 'id'>): StockMovement {
    const all = this.getAllStockMovementsRaw();
    const newMovement: StockMovement = {
      ...movement,
      id: 'stk_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
    };
    all.push(newMovement);
    localStorage.setItem(STORAGE_KEY_STOCK_MOVEMENTS, JSON.stringify(all));
    return newMovement;
  }

  getStockMovements(businessId: string, productId?: string): StockMovement[] {
    try {
      const all = this.getAllStockMovementsRaw();
      return all
        .filter((m) => m.businessId === businessId && (!productId || m.productId === productId))
        .sort((a, b) => b.date - a.date);
    } catch {
      return [];
    }
  }

  private getAllStockMovementsRaw(): StockMovement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STOCK_MOVEMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getInventorySummary(businessId: string): InventorySummary {
    const products = this.getProducts(businessId);
    let totalStockUnits = 0;
    let totalStockValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const qty = Number(p.stockQuantity) || 0;
      const cost = Number(p.purchaseCost) || 0;
      const minLevel = p.minStockLevel !== undefined ? Number(p.minStockLevel) : 5;

      totalStockUnits += qty;
      totalStockValue += Math.max(0, qty) * cost;

      if (qty <= 0) {
        outOfStockCount++;
      } else if (qty <= minLevel) {
        lowStockCount++;
      }
    });

    return {
      totalProducts: products.length,
      totalStockUnits,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
    };
  }

  private getAllProductsRaw(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- Vouchers & Items ---
  getVouchers(businessId: string): Voucher[] {
    try {
      const all = this.getAllVouchersRaw();
      return all
        .filter((v) => v.businessId === businessId)
        .sort((a, b) => b.date - a.date || b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }

  getVoucherItems(voucherId: string): VoucherItem[] {
    try {
      const all = this.getAllVoucherItemsRaw();
      return all.filter((item) => item.voucherId === voucherId);
    } catch {
      return [];
    }
  }

  generateNextVoucherNumber(businessId: string, type: VoucherType): string {
    const vouchers = this.getVouchers(businessId).filter((v) => v.voucherType === type);
    const settings = this.getBusinessSettings(businessId);
    let prefix = 'VCH';
    if (type === 'SALES' || type === 'SPLIT_PAYMENT') {
      prefix = settings.invoiceSettings.invoicePrefix.trim() || 'INV';
    } else if (type === 'PURCHASE') {
      prefix = 'PUR';
    } else if (type === 'RECEIPT') {
      prefix = 'RCT';
    } else if (type === 'PAYMENT') {
      prefix = 'PMT';
    } else {
      prefix = type.substring(0, 3);
    }

    const year = new Date().getFullYear();
    const existingNumbers = new Set(vouchers.map((v) => v.voucherNumber));
    let count = vouchers.length + 1;
    let candidate = `${prefix}-${year}-${count.toString().padStart(4, '0')}`;
    while (existingNumbers.has(candidate)) {
      count++;
      candidate = `${prefix}-${year}-${count.toString().padStart(4, '0')}`;
    }
    return candidate;
  }

  // --- Save Sales Voucher with Split Payment & Automatic Accounting Entries ---
  saveSalesVoucher(params: {
    businessId: string;
    customer?: Customer | null;
    items: Array<{
      productId?: string;
      productName: string;
      quantity: number;
      unit: string;
      variantInfo: string;
      sellingPrice: number;
      purchaseCost: number;
      discount: number;
    }>;
    cashAmount: number;
    upiAmount: number;
    bankAmount: number;
    udharAmount: number;
    date?: number;
    remarks?: string;
  }): Voucher {
    const { businessId, customer, items, cashAmount, upiAmount, bankAmount, udharAmount } = params;

    if (items.length === 0) {
      throw new Error('At least one item must be added to the invoice');
    }

    const totalBill = items.reduce(
      (sum, item) => sum + (item.quantity * item.sellingPrice - item.discount),
      0
    );
    const totalAllocated = cashAmount + upiAmount + bankAmount + udharAmount;

    if (Math.abs(totalBill - totalAllocated) > 0.05) {
      throw new Error(
        `Total payment allocation (₹${totalAllocated}) must equal Invoice Total (₹${totalBill})`
      );
    }

    if (udharAmount > 0 && !customer) {
      throw new Error('Customer selection is required when sale has Udhar (credit balance)');
    }

    const voucherId = 'vch_' + Math.random().toString(36).substring(2, 9);
    const voucherNumber = this.generateNextVoucherNumber(businessId, 'SALES');
    const now = params.date || Date.now();

    const voucher: Voucher = {
      id: voucherId,
      businessId,
      voucherType: 'SALES',
      voucherNumber,
      date: now,
      partyId: customer?.id,
      partyName: customer?.name,
      totalAmount: totalBill,
      cashAmount,
      upiAmount,
      bankAmount,
      udharAmount,
      remarks: params.remarks || `Sales bill ${voucherNumber}`,
      createdAt: now,
    };

    // Save Voucher Items (freezing cost basis at sale time)
    const allItems: VoucherItem[] = this.getAllVoucherItemsRaw();
    const newItems: VoucherItem[] = items.map((item) => ({
      id: 'vi_' + Math.random().toString(36).substring(2, 9),
      voucherId,
      businessId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      variantInfo: item.variantInfo,
      sellingPrice: item.sellingPrice,
      purchaseCostAtSale: item.purchaseCost,
      discount: item.discount,
      lineTotal: item.quantity * item.sellingPrice - item.discount,
    }));
    allItems.push(...newItems);
    localStorage.setItem(STORAGE_KEY_VOUCHER_ITEMS, JSON.stringify(allItems));

    // Deduct stock for products and log StockMovements
    const allProducts = this.getAllProductsRaw();
    items.forEach((item) => {
      let prod = item.productId
        ? allProducts.find((p) => p.id === item.productId)
        : allProducts.find((p) => p.businessId === businessId && p.name.toLowerCase() === item.productName.toLowerCase());

      if (prod) {
        const prevStock = prod.stockQuantity;
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);

        // If product has variants, also update variant stock if matched
        if (prod.variants && prod.variants.length > 0 && item.variantInfo) {
          const v = prod.variants.find(
            (va) =>
              `${va.size} ${va.color}`.trim().toLowerCase() === item.variantInfo.trim().toLowerCase() ||
              `${va.color} ${va.size}`.trim().toLowerCase() === item.variantInfo.trim().toLowerCase() ||
              va.size.toLowerCase() === item.variantInfo.trim().toLowerCase()
          );
          if (v) {
            v.stockQuantity = Math.max(0, v.stockQuantity - item.quantity);
          }
        }

        this.recordStockMovement({
          businessId,
          productId: prod.id,
          productName: prod.name,
          variantInfo: item.variantInfo,
          type: 'SALE',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: prod.stockQuantity,
          referenceNo: voucherNumber,
          voucherId,
          date: now,
        });
      }
    });
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(allProducts));

    // Create Double-Entry Journals:
    // Debit Cash Account (if cashAmount > 0)
    // Debit UPI Account (if upiAmount > 0)
    // Debit Bank Account (if bankAmount > 0)
    // Debit Customer Receivable (if udharAmount > 0)
    // Credit Sales Account (totalBill)
    // Debit Cost of Goods Sold & Credit Inventory Asset
    const allJournals: JournalEntry[] = this.getAllJournalsRaw();
    const entries: JournalEntry[] = [];

    if (cashAmount > 0) {
      entries.push({
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Cash Account',
        partyId: customer?.id,
        debit: cashAmount,
        credit: 0,
        date: now,
        narration: `Cash received on ${voucherNumber}`,
      });
    }

    if (upiAmount > 0) {
      entries.push({
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'UPI Account',
        partyId: customer?.id,
        debit: upiAmount,
        credit: 0,
        date: now,
        narration: `UPI payment on ${voucherNumber}`,
      });
    }

    if (bankAmount > 0) {
      entries.push({
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Bank Account',
        partyId: customer?.id,
        debit: bankAmount,
        credit: 0,
        date: now,
        narration: `Bank deposit on ${voucherNumber}`,
      });
    }

    if (udharAmount > 0 && customer) {
      entries.push({
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Customer Receivable',
        partyId: customer.id,
        debit: udharAmount,
        credit: 0,
        date: now,
        narration: `Udhar sale on ${voucherNumber} to ${customer.name}`,
      });
    }

    entries.push({
      id: 'je_' + Math.random().toString(36).substring(2, 9),
      businessId,
      voucherId,
      accountName: 'Sales Account',
      partyId: customer?.id,
      debit: 0,
      credit: totalBill,
      date: now,
      narration: `Sales Revenue on ${voucherNumber}`,
    });

    const totalCogs = items.reduce((sum, it) => sum + it.quantity * it.purchaseCost, 0);
    if (totalCogs > 0) {
      entries.push({
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Cost of Goods Sold',
        debit: totalCogs,
        credit: 0,
        date: now,
        narration: `COGS for ${voucherNumber}`,
      });
      entries.push({
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Inventory Asset',
        debit: 0,
        credit: totalCogs,
        date: now,
        narration: `Inventory asset reduction for ${voucherNumber}`,
      });
    }

    allJournals.push(...entries);
    localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(allJournals));

    // Save Voucher Header
    const allVouchers: Voucher[] = this.getAllVouchersRaw();
    allVouchers.push(voucher);
    localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(allVouchers));

    this.notify();
    return voucher;
  }

  // --- Save Receipt Voucher (Reduces Customer Due & Increases Cash/Bank/UPI) ---
  saveReceiptVoucher(params: {
    businessId: string;
    customer: Customer;
    amount: number;
    paymentMode: 'Cash' | 'UPI' | 'Bank';
    referenceNo?: string;
    remarks?: string;
  }): Voucher {
    const { businessId, customer, amount, paymentMode } = params;

    if (amount <= 0) {
      throw new Error('Receipt amount must be positive');
    }

    const voucherId = 'vch_' + Math.random().toString(36).substring(2, 9);
    const voucherNumber = this.generateNextVoucherNumber(businessId, 'RECEIPT');
    const now = Date.now();

    const voucher: Voucher = {
      id: voucherId,
      businessId,
      voucherType: 'RECEIPT',
      voucherNumber,
      date: now,
      partyId: customer.id,
      partyName: customer.name,
      totalAmount: amount,
      cashAmount: paymentMode === 'Cash' ? amount : 0,
      upiAmount: paymentMode === 'UPI' ? amount : 0,
      bankAmount: paymentMode === 'Bank' ? amount : 0,
      udharAmount: 0,
      referenceNo: params.referenceNo,
      remarks: params.remarks || `Payment received from ${customer.name}`,
      createdAt: now,
    };

    // Double Entry:
    // Debit: Cash Account / UPI Account / Bank Account
    // Credit: Customer Receivable
    const allJournals = this.getAllJournalsRaw();
    allJournals.push(
      {
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: `${paymentMode} Account`,
        partyId: customer.id,
        debit: amount,
        credit: 0,
        date: now,
        narration: `Payment received from ${customer.name} on ${voucherNumber}`,
      },
      {
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Customer Receivable',
        partyId: customer.id,
        debit: 0,
        credit: amount, // Credit decreases receivable!
        date: now,
        narration: `Receivable reduction on ${voucherNumber} from ${customer.name}`,
      }
    );
    localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(allJournals));

    const allVouchers = this.getAllVouchersRaw();
    allVouchers.push(voucher);
    localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(allVouchers));

    this.notify();
    return voucher;
  }

  // --- Save Purchase Voucher (Increases Inventory & Supplier Credit) ---
  savePurchaseVoucher(params: {
    businessId: string;
    supplierId?: string;
    supplierName: string;
    items: Array<{
      productName: string;
      quantity: number;
      unit: string;
      purchaseCost: number;
    }>;
    cashAmount: number;
    upiAmount: number;
    bankAmount: number;
    creditAmount: number;
    date?: number;
    remarks?: string;
  }): Voucher {
    const { businessId, supplierId, supplierName, items, cashAmount, upiAmount, bankAmount, creditAmount } = params;
    const totalAmount = items.reduce((sum, it) => sum + it.quantity * it.purchaseCost, 0);

    const voucherId = 'vch_' + Math.random().toString(36).substring(2, 9);
    const voucherNumber = this.generateNextVoucherNumber(businessId, 'PURCHASE');
    const now = params.date || Date.now();

    // If supplierId not provided, look up or create supplier
    let effectiveSupplierId = supplierId;
    if (!effectiveSupplierId && supplierName.trim()) {
      const existing = this.getSuppliers(businessId).find(
        (s) => s.name.toLowerCase() === supplierName.trim().toLowerCase()
      );
      if (existing) {
        effectiveSupplierId = existing.id;
      } else {
        const created = this.createSupplier({
          businessId,
          name: supplierName.trim(),
        });
        effectiveSupplierId = created.id;
      }
    }

    const voucher: Voucher = {
      id: voucherId,
      businessId,
      voucherType: 'PURCHASE',
      voucherNumber,
      date: now,
      partyId: effectiveSupplierId,
      partyName: supplierName.trim(),
      totalAmount,
      cashAmount,
      upiAmount,
      bankAmount,
      udharAmount: creditAmount,
      remarks: params.remarks || `Purchase from ${supplierName}`,
      createdAt: now,
    };

    // Increment or create products in local stock & log StockMovements
    const allProducts = this.getAllProductsRaw();
    items.forEach((it) => {
      let prod = allProducts.find(
        (p) => p.businessId === businessId && p.name.toLowerCase() === it.productName.toLowerCase()
      );
      if (prod) {
        const prevStock = prod.stockQuantity;
        prod.stockQuantity += it.quantity;
        prod.purchaseCost = it.purchaseCost;
        this.recordStockMovement({
          businessId,
          productId: prod.id,
          productName: prod.name,
          type: 'PURCHASE',
          quantity: it.quantity,
          previousStock: prevStock,
          newStock: prod.stockQuantity,
          referenceNo: voucherNumber,
          voucherId,
          date: now,
        });
      } else {
        const newP: Product = {
          id: 'prod_' + Math.random().toString(36).substring(2, 9),
          businessId,
          name: it.productName,
          barcode: '',
          unit: it.unit,
          sellingPrice: it.purchaseCost * 1.3,
          purchaseCost: it.purchaseCost,
          openingStock: 0,
          stockQuantity: it.quantity,
          minStockLevel: 5,
          variantInfo: '',
          createdAt: now,
        };
        allProducts.push(newP);
        this.recordStockMovement({
          businessId,
          productId: newP.id,
          productName: newP.name,
          type: 'PURCHASE',
          quantity: it.quantity,
          previousStock: 0,
          newStock: it.quantity,
          referenceNo: voucherNumber,
          voucherId,
          date: now,
        });
      }
    });
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(allProducts));

    // Double Entry:
    // Debit Inventory Asset
    // Credit Cash / UPI / Bank / Supplier Payable
    const allJournals = this.getAllJournalsRaw();
    allJournals.push({
      id: 'je_' + Math.random().toString(36).substring(2, 9),
      businessId,
      voucherId,
      accountName: 'Inventory Asset',
      debit: totalAmount,
      credit: 0,
      date: now,
      narration: `Stock purchased on ${voucherNumber} from ${supplierName}`,
    });

    if (cashAmount > 0) {
      allJournals.push({
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Cash Account',
        partyId: effectiveSupplierId,
        debit: 0,
        credit: cashAmount,
        date: now,
        narration: `Cash paid on purchase ${voucherNumber}`,
      });
    }

    if (upiAmount > 0) {
      allJournals.push({
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'UPI Account',
        partyId: effectiveSupplierId,
        debit: 0,
        credit: upiAmount,
        date: now,
        narration: `UPI paid on purchase ${voucherNumber}`,
      });
    }

    if (bankAmount > 0) {
      allJournals.push({
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Bank Account',
        partyId: effectiveSupplierId,
        debit: 0,
        credit: bankAmount,
        date: now,
        narration: `Bank paid on purchase ${voucherNumber}`,
      });
    }

    if (creditAmount > 0) {
      allJournals.push({
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Supplier Payable',
        partyId: effectiveSupplierId,
        debit: 0,
        credit: creditAmount,
        date: now,
        narration: `Credit payable to ${supplierName} on ${voucherNumber}`,
      });
    }

    localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(allJournals));

    const allVouchers = this.getAllVouchersRaw();
    allVouchers.push(voucher);
    localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(allVouchers));

    this.notify();
    return voucher;
  }

  // --- Save Payment Voucher (Reduces Supplier Payable & Decreases Cash/Bank/UPI) ---
  savePaymentVoucher(params: {
    businessId: string;
    supplier: Supplier;
    amount: number;
    paymentMode: 'Cash' | 'UPI' | 'Bank';
    referenceNo?: string;
    remarks?: string;
  }): Voucher {
    const { businessId, supplier, amount, paymentMode } = params;

    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    const voucherId = 'vch_' + Math.random().toString(36).substring(2, 9);
    const voucherNumber = this.generateNextVoucherNumber(businessId, 'PAYMENT');
    const now = Date.now();

    const voucher: Voucher = {
      id: voucherId,
      businessId,
      voucherType: 'PAYMENT',
      voucherNumber,
      date: now,
      partyId: supplier.id,
      partyName: supplier.name,
      totalAmount: amount,
      cashAmount: paymentMode === 'Cash' ? amount : 0,
      upiAmount: paymentMode === 'UPI' ? amount : 0,
      bankAmount: paymentMode === 'Bank' ? amount : 0,
      udharAmount: 0,
      referenceNo: params.referenceNo,
      remarks: params.remarks || `Payment to ${supplier.name}`,
      createdAt: now,
    };

    // Double Entry:
    // Debit: Supplier Payable (decreases debt)
    // Credit: Cash Account / UPI Account / Bank Account (decreases asset)
    const allJournals = this.getAllJournalsRaw();
    allJournals.push(
      {
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Supplier Payable',
        partyId: supplier.id,
        debit: amount, // Debit reduces liability
        credit: 0,
        date: now,
        narration: `Payment made to ${supplier.name} on ${voucherNumber}`,
      },
      {
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: `${paymentMode} Account`,
        partyId: supplier.id,
        debit: 0,
        credit: amount, // Credit decreases asset
        date: now,
        narration: `Payment disbursed from ${paymentMode} on ${voucherNumber}`,
      }
    );
    localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(allJournals));

    const allVouchers = this.getAllVouchersRaw();
    allVouchers.push(voucher);
    localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(allVouchers));

    this.notify();
    return voucher;
  }

  // --- Save Contra Voucher (Transfers between Cash, Bank, and UPI) ---
  saveContraVoucher(params: {
    businessId: string;
    fromAccount: 'Cash' | 'Bank' | 'UPI';
    toAccount: 'Cash' | 'Bank' | 'UPI';
    amount: number;
    remarks?: string;
    date?: number;
  }): Voucher {
    const { businessId, fromAccount, toAccount, amount } = params;
    if (fromAccount === toAccount) {
      throw new Error('Source and destination accounts must be different');
    }
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const voucherId = 'vch_' + Math.random().toString(36).substring(2, 9);
    const voucherNumber = this.generateNextVoucherNumber(businessId, 'CONTRA');
    const now = params.date || Date.now();

    const voucher: Voucher = {
      id: voucherId,
      businessId,
      voucherType: 'CONTRA',
      voucherNumber,
      date: now,
      partyName: `Transfer: ${fromAccount} to ${toAccount}`,
      totalAmount: amount,
      cashAmount: fromAccount === 'Cash' || toAccount === 'Cash' ? amount : 0,
      upiAmount: fromAccount === 'UPI' || toAccount === 'UPI' ? amount : 0,
      bankAmount: fromAccount === 'Bank' || toAccount === 'Bank' ? amount : 0,
      udharAmount: 0,
      remarks: params.remarks || `Contra transfer from ${fromAccount} to ${toAccount}`,
      createdAt: now,
    };

    const allJournals = this.getAllJournalsRaw();
    allJournals.push(
      {
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: `${toAccount} Account`,
        debit: amount,
        credit: 0,
        date: now,
        narration: `Contra receipt from ${fromAccount} into ${toAccount} on ${voucherNumber}`,
      },
      {
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: `${fromAccount} Account`,
        debit: 0,
        credit: amount,
        date: now,
        narration: `Contra disbursement from ${fromAccount} to ${toAccount} on ${voucherNumber}`,
      }
    );
    localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(allJournals));

    const allVouchers = this.getAllVouchersRaw();
    allVouchers.push(voucher);
    localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(allVouchers));

    this.notify();
    return voucher;
  }

  // --- Save Journal Voucher (Adjustments & Non-Cash Entries) ---
  saveJournalVoucher(params: {
    businessId: string;
    debitAccountName: string;
    creditAccountName: string;
    amount: number;
    narration?: string;
    date?: number;
  }): Voucher {
    const { businessId, debitAccountName, creditAccountName, amount } = params;
    if (debitAccountName.toLowerCase() === creditAccountName.toLowerCase()) {
      throw new Error('Debit and Credit accounts must be different');
    }
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const voucherId = 'vch_' + Math.random().toString(36).substring(2, 9);
    const voucherNumber = this.generateNextVoucherNumber(businessId, 'JOURNAL');
    const now = params.date || Date.now();

    const voucher: Voucher = {
      id: voucherId,
      businessId,
      voucherType: 'JOURNAL',
      voucherNumber,
      date: now,
      partyName: `Dr: ${debitAccountName} / Cr: ${creditAccountName}`,
      totalAmount: amount,
      cashAmount: 0,
      upiAmount: 0,
      bankAmount: 0,
      udharAmount: 0,
      remarks: params.narration || `Journal adjustment: ${debitAccountName} to ${creditAccountName}`,
      createdAt: now,
    };

    const allJournals = this.getAllJournalsRaw();
    allJournals.push(
      {
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: debitAccountName,
        debit: amount,
        credit: 0,
        date: now,
        narration: params.narration || `Journal entry ${voucherNumber}: Debit ${debitAccountName}`,
      },
      {
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: creditAccountName,
        debit: 0,
        credit: amount,
        date: now,
        narration: params.narration || `Journal entry ${voucherNumber}: Credit ${creditAccountName}`,
      }
    );
    localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(allJournals));

    const allVouchers = this.getAllVouchersRaw();
    allVouchers.push(voucher);
    localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(allVouchers));

    this.notify();
    return voucher;
  }

  // --- Save Debit Note (Purchase Return to Supplier) ---
  saveDebitNote(params: {
    businessId: string;
    supplierId?: string;
    supplierName: string;
    amount: number;
    items?: Array<{
      productName: string;
      quantity: number;
      unit: string;
      rate: number;
    }>;
    reason?: string;
    date?: number;
  }): Voucher {
    const { businessId, supplierId, supplierName, amount, items, reason } = params;
    if (amount <= 0) {
      throw new Error('Debit Note amount must be greater than zero');
    }

    const voucherId = 'vch_' + Math.random().toString(36).substring(2, 9);
    const voucherNumber = this.generateNextVoucherNumber(businessId, 'DEBIT_NOTE');
    const now = params.date || Date.now();

    let effectiveSupplierId = supplierId;
    if (!effectiveSupplierId) {
      const sup = this.getSuppliers(businessId).find(
        (s) => s.name.toLowerCase() === supplierName.trim().toLowerCase()
      );
      effectiveSupplierId = sup?.id;
    }

    const voucher: Voucher = {
      id: voucherId,
      businessId,
      voucherType: 'DEBIT_NOTE',
      voucherNumber,
      date: now,
      partyId: effectiveSupplierId,
      partyName: supplierName.trim(),
      totalAmount: amount,
      cashAmount: 0,
      upiAmount: 0,
      bankAmount: 0,
      udharAmount: amount,
      remarks: reason || `Purchase Return / Debit Note to ${supplierName}`,
      createdAt: now,
    };

    if (items && items.length > 0) {
      const allProducts = this.getAllProductsRaw();
      items.forEach((it) => {
        const prod = allProducts.find(
          (p) => p.businessId === businessId && p.name.toLowerCase() === it.productName.toLowerCase()
        );
        if (prod) {
          const prevStock = prod.stockQuantity;
          prod.stockQuantity = Math.max(0, prod.stockQuantity - it.quantity);
          this.recordStockMovement({
            businessId,
            productId: prod.id,
            productName: prod.name,
            type: 'OUT',
            quantity: it.quantity,
            previousStock: prevStock,
            newStock: prod.stockQuantity,
            referenceNo: voucherNumber,
            voucherId,
            reason: reason || 'Purchase return to supplier',
            date: now,
          });
        }
      });
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(allProducts));
    }

    const allJournals = this.getAllJournalsRaw();
    allJournals.push(
      {
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Supplier Payable',
        partyId: effectiveSupplierId,
        debit: amount,
        credit: 0,
        date: now,
        narration: `Debit Note ${voucherNumber} against ${supplierName}: ${reason || 'Return'}`,
      },
      {
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Purchase Account',
        partyId: effectiveSupplierId,
        debit: 0,
        credit: amount,
        date: now,
        narration: `Purchase reversal on Debit Note ${voucherNumber}`,
      }
    );
    localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(allJournals));

    const allVouchers = this.getAllVouchersRaw();
    allVouchers.push(voucher);
    localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(allVouchers));

    this.notify();
    return voucher;
  }

  // --- Save Credit Note (Sales Return from Customer) ---
  saveCreditNote(params: {
    businessId: string;
    customerId?: string;
    customerName: string;
    amount: number;
    refundMode: 'UDHAR_REDUCTION' | 'CASH' | 'BANK';
    items?: Array<{
      productName: string;
      quantity: number;
      unit: string;
      rate: number;
    }>;
    reason?: string;
    date?: number;
  }): Voucher {
    const { businessId, customerId, customerName, amount, refundMode, items, reason } = params;
    if (amount <= 0) {
      throw new Error('Credit Note amount must be greater than zero');
    }

    const voucherId = 'vch_' + Math.random().toString(36).substring(2, 9);
    const voucherNumber = this.generateNextVoucherNumber(businessId, 'CREDIT_NOTE');
    const now = params.date || Date.now();

    let effectiveCustomerId = customerId;
    if (!effectiveCustomerId) {
      const cust = this.getCustomers(businessId).find(
        (c) => c.name.toLowerCase() === customerName.trim().toLowerCase()
      );
      effectiveCustomerId = cust?.id;
    }

    const isCash = refundMode === 'CASH';
    const isBank = refundMode === 'BANK';
    const isUdhar = refundMode === 'UDHAR_REDUCTION';

    const voucher: Voucher = {
      id: voucherId,
      businessId,
      voucherType: 'CREDIT_NOTE',
      voucherNumber,
      date: now,
      partyId: effectiveCustomerId,
      partyName: customerName.trim(),
      totalAmount: amount,
      cashAmount: isCash ? amount : 0,
      upiAmount: 0,
      bankAmount: isBank ? amount : 0,
      udharAmount: isUdhar ? amount : 0,
      remarks: reason || `Sales Return / Credit Note for ${customerName}`,
      createdAt: now,
    };

    if (items && items.length > 0) {
      const allProducts = this.getAllProductsRaw();
      items.forEach((it) => {
        const prod = allProducts.find(
          (p) => p.businessId === businessId && p.name.toLowerCase() === it.productName.toLowerCase()
        );
        if (prod) {
          const prevStock = prod.stockQuantity;
          prod.stockQuantity += it.quantity;
          this.recordStockMovement({
            businessId,
            productId: prod.id,
            productName: prod.name,
            type: 'IN',
            quantity: it.quantity,
            previousStock: prevStock,
            newStock: prod.stockQuantity,
            referenceNo: voucherNumber,
            voucherId,
            reason: reason || 'Sales return from customer',
            date: now,
          });
        }
      });
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(allProducts));
    }

    const allJournals = this.getAllJournalsRaw();
    const creditAccountName = isUdhar
      ? 'Customer Receivable'
      : isCash
      ? 'Cash Account'
      : 'Bank Account';

    allJournals.push(
      {
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: 'Sales Account',
        partyId: effectiveCustomerId,
        debit: amount,
        credit: 0,
        date: now,
        narration: `Sales reversal on Credit Note ${voucherNumber} for ${customerName}`,
      },
      {
        id: 'je_' + Math.random().toString(36).substring(2, 9),
        businessId,
        voucherId,
        accountName: creditAccountName,
        partyId: effectiveCustomerId,
        debit: 0,
        credit: amount,
        date: now,
        narration: `Credit Note ${voucherNumber} refund via ${creditAccountName}`,
      }
    );
    localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(allJournals));

    const allVouchers = this.getAllVouchersRaw();
    allVouchers.push(voucher);
    localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(allVouchers));

    this.notify();
    return voucher;
  }

  // --- Complete Customer Ledger Calculation ---
  getCustomerLedger(businessId: string, customerId: string): CustomerLedgerSummary {
    const customer = this.getCustomers(businessId).find((c) => c.id === customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const openingBalance = customer.openingBalance || 0;
    const vouchers = this.getVouchers(businessId)
      .filter((v) => v.partyId === customerId)
      .sort((a, b) => a.date - b.date || a.createdAt - b.createdAt);

    let totalSales = 0;
    let cashReceived = 0;
    let upiReceived = 0;
    let bankReceived = 0;
    let totalDebit = openingBalance > 0 ? openingBalance : 0;
    let totalCredit = 0;
    let runningBalance = openingBalance;

    const transactions: CustomerTransactionRow[] = [];

    vouchers.forEach((v) => {
      const items = this.getVoucherItems(v.id);
      const productDetails =
        items.length > 0
          ? items.map((it) => `${it.productName} (${it.quantity} ${it.unit})`).join(', ')
          : v.voucherType === 'RECEIPT'
          ? `Payment Received (${v.cashAmount > 0 ? 'Cash' : v.upiAmount > 0 ? 'UPI' : 'Bank'})`
          : v.remarks || 'Accounting Entry';

      if (v.voucherType === 'SALES' || v.voucherType === 'SPLIT_PAYMENT') {
        totalSales += v.totalAmount;
        cashReceived += v.cashAmount;
        upiReceived += v.upiAmount;
        bankReceived += v.bankAmount;

        // In Customer Ledger:
        // Debit: Total bill amount (or Udhar)
        // Credit: Cash/UPI/Bank paid on the spot
        const lineDebit = v.totalAmount;
        const lineCredit = v.cashAmount + v.upiAmount + v.bankAmount;
        totalDebit += lineDebit;
        totalCredit += lineCredit;
        runningBalance += v.udharAmount;

        transactions.push({
          voucherId: v.id,
          voucherNumber: v.voucherNumber,
          date: v.date,
          voucherType: v.voucherType,
          productDetails,
          debit: lineDebit,
          credit: lineCredit,
          totalBill: v.totalAmount,
          cashPaid: v.cashAmount,
          upiPaid: v.upiAmount,
          bankPaid: v.bankAmount,
          udhar: v.udharAmount,
          runningBalance,
        });
      } else if (v.voucherType === 'RECEIPT') {
        cashReceived += v.cashAmount;
        upiReceived += v.upiAmount;
        bankReceived += v.bankAmount;
        totalCredit += v.totalAmount;
        runningBalance -= v.totalAmount;

        transactions.push({
          voucherId: v.id,
          voucherNumber: v.voucherNumber,
          date: v.date,
          voucherType: v.voucherType,
          productDetails,
          debit: 0,
          credit: v.totalAmount,
          totalBill: v.totalAmount,
          cashPaid: v.cashAmount,
          upiPaid: v.upiAmount,
          bankPaid: v.bankAmount,
          udhar: 0,
          runningBalance,
        });
      }
    });

    const totalReceived = cashReceived + upiReceived + bankReceived;
    const totalOutstanding = Math.max(0, runningBalance);

    return {
      customer,
      openingBalance,
      totalDebit,
      totalCredit,
      totalSales,
      cashReceived,
      upiReceived,
      bankReceived,
      totalReceived,
      totalOutstanding,
      transactions,
    };
  }

  // --- Complete Supplier Ledger Calculation ---
  getSupplierLedger(businessId: string, supplierId: string): SupplierLedgerSummary {
    const supplier = this.getSuppliers(businessId).find((s) => s.id === supplierId);
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const openingBalance = supplier.openingBalance || 0;
    const vouchers = this.getVouchers(businessId)
      .filter((v) => v.partyId === supplierId)
      .sort((a, b) => a.date - b.date || a.createdAt - b.createdAt);

    let totalPurchases = 0;
    let totalPaid = 0;
    let totalDebit = 0; // Payments made
    let totalCredit = openingBalance > 0 ? openingBalance : 0; // Purchases (bills payable)
    let runningBalance = openingBalance;

    const transactions: SupplierTransactionRow[] = [];

    vouchers.forEach((v) => {
      if (v.voucherType === 'PURCHASE') {
        totalPurchases += v.totalAmount;
        const paidAtPurchase = v.cashAmount + v.upiAmount + v.bankAmount;
        totalPaid += paidAtPurchase;

        // Credit increases supplier debt
        const lineCredit = v.totalAmount;
        const lineDebit = paidAtPurchase;
        totalCredit += lineCredit;
        totalDebit += lineDebit;
        runningBalance += v.udharAmount;

        transactions.push({
          voucherId: v.id,
          voucherNumber: v.voucherNumber,
          date: v.date,
          voucherType: v.voucherType,
          description: v.remarks || `Purchase Bill ${v.voucherNumber}`,
          debit: lineDebit,
          credit: lineCredit,
          runningBalance,
        });
      } else if (v.voucherType === 'PAYMENT') {
        totalPaid += v.totalAmount;
        totalDebit += v.totalAmount;
        runningBalance -= v.totalAmount;

        transactions.push({
          voucherId: v.id,
          voucherNumber: v.voucherNumber,
          date: v.date,
          voucherType: v.voucherType,
          description: v.remarks || `Payment Made (${v.cashAmount > 0 ? 'Cash' : v.upiAmount > 0 ? 'UPI' : 'Bank'})`,
          debit: v.totalAmount,
          credit: 0,
          runningBalance,
        });
      }
    });

    const totalPayable = Math.max(0, runningBalance);

    return {
      supplier,
      openingBalance,
      totalDebit,
      totalCredit,
      totalPurchases,
      totalPaid,
      totalPayable,
      transactions,
    };
  }

  // --- Complete General Account Ledger Statement ---
  getAccountLedger(businessId: string, accountName: string): GeneralLedgerSummary {
    const accounts = this.getLedgerAccounts(businessId);
    let account = accounts.find((a) => a.name.toLowerCase() === accountName.toLowerCase());

    if (!account) {
      // Find or fallback to virtual representation
      account = {
        id: 'acc_' + accountName.replace(/\s+/g, '_').toLowerCase(),
        businessId,
        name: accountName,
        group: 'EXPENSE',
        openingBalance: 0,
        isSystem: true,
        createdAt: Date.now(),
      };
    }

    const openingBalance = account.openingBalance || 0;
    const isAssetOrExpense = account.group === 'ASSET' || account.group === 'EXPENSE';

    const allJournals = this.getJournalEntries(businessId).filter(
      (j) => j.accountName.toLowerCase() === accountName.toLowerCase()
    );
    allJournals.sort((a, b) => a.date - b.date);

    const allVouchers = this.getVouchers(businessId);
    const voucherMap = new Map<string, Voucher>();
    allVouchers.forEach((v) => voucherMap.set(v.id, v));

    let totalDebit = 0;
    let totalCredit = 0;
    let runningBalance = openingBalance;

    const transactions: AccountTransactionRow[] = [];

    allJournals.forEach((j) => {
      totalDebit += j.debit;
      totalCredit += j.credit;

      if (isAssetOrExpense) {
        runningBalance += j.debit - j.credit;
      } else {
        runningBalance += j.credit - j.debit;
      }

      const v = voucherMap.get(j.voucherId);

      transactions.push({
        id: j.id,
        voucherId: j.voucherId,
        voucherNumber: v?.voucherNumber,
        voucherType: v?.voucherType,
        date: j.date,
        narration: j.narration,
        debit: j.debit,
        credit: j.credit,
        runningBalance,
      });
    });

    return {
      account,
      openingBalance,
      totalDebit,
      totalCredit,
      closingBalance: runningBalance,
      transactions,
    };
  }

  // --- Real-Time Business Financial Metrics (Step 3: ₹0 Baseline Guarantee) ---
  getBusinessFinancialSummary(businessId: string): BusinessFinancialSummary {
    const journals = this.getJournalEntries(businessId);
    const accounts = this.getLedgerAccounts(businessId);
    const vouchers = this.getVouchers(businessId);
    const customers = this.getCustomers(businessId);
    const suppliers = this.getSuppliers(businessId);
    const products = this.getProducts(businessId);

    const getOpening = (name: string) => {
      const acc = accounts.find((a) => a.name.toLowerCase() === name.toLowerCase());
      return acc?.openingBalance || 0;
    };

    // Cash = opening + debits - credits
    const cashJournals = journals.filter((j) => j.accountName.toLowerCase() === 'cash account');
    const cashBalance =
      getOpening('Cash Account') +
      cashJournals.reduce((s, j) => s + j.debit - j.credit, 0);

    // Bank = opening + debits - credits
    const bankJournals = journals.filter((j) => j.accountName.toLowerCase() === 'bank account');
    const bankBalance =
      getOpening('Bank Account') +
      bankJournals.reduce((s, j) => s + j.debit - j.credit, 0);

    // UPI = opening + debits - credits
    const upiJournals = journals.filter((j) => j.accountName.toLowerCase() === 'upi account');
    const upiBalance =
      getOpening('UPI Account') +
      upiJournals.reduce((s, j) => s + j.debit - j.credit, 0);

    // Customer Outstanding
    let customerOutstanding = 0;
    customers.forEach((c) => {
      try {
        const sum = this.getCustomerLedger(businessId, c.id);
        customerOutstanding += sum.totalOutstanding;
      } catch {
        // ignore
      }
    });

    // Supplier Outstanding
    let supplierOutstanding = 0;
    suppliers.forEach((s) => {
      try {
        const sum = this.getSupplierLedger(businessId, s.id);
        supplierOutstanding += sum.totalPayable;
      } catch {
        // ignore
      }
    });

    // Total Sales
    const totalSales = vouchers
      .filter((v) => v.voucherType === 'SALES' || v.voucherType === 'SPLIT_PAYMENT')
      .reduce((sum, v) => sum + v.totalAmount, 0);

    // Total Purchases
    const totalPurchases = vouchers
      .filter((v) => v.voucherType === 'PURCHASE')
      .reduce((sum, v) => sum + v.totalAmount, 0);

    // Expenses (from journal entries on expense accounts)
    const expenseAccountNames = new Set(
      accounts.filter((a) => a.group === 'EXPENSE').map((a) => a.name.toLowerCase())
    );
    const totalExpenses = journals
      .filter((j) => expenseAccountNames.has(j.accountName.toLowerCase()) && j.accountName.toLowerCase() !== 'cost of goods sold')
      .reduce((s, j) => s + (j.debit - j.credit), 0);

    // COGS
    const totalCogs = journals
      .filter((j) => j.accountName.toLowerCase() === 'cost of goods sold')
      .reduce((s, j) => s + j.debit, 0);

    // Net Profit = Sales - COGS - Expenses
    const netProfit = totalSales - totalCogs - totalExpenses;

    // Stock Value
    const stockValue = products.reduce(
      (sum, p) => sum + Math.max(0, p.stockQuantity) * (p.purchaseCost || 0),
      0
    );

    return {
      cashBalance: Math.max(0, cashBalance),
      bankBalance: Math.max(0, bankBalance),
      upiBalance: Math.max(0, upiBalance),
      customerOutstanding,
      supplierOutstanding,
      totalSales,
      totalPurchases,
      totalExpenses: Math.max(0, totalExpenses),
      netProfit,
      stockValue,
    };
  }

  // --- Raw helpers ---
  private getAllVouchersRaw(): Voucher[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_VOUCHERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private getAllVoucherItemsRaw(): VoucherItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_VOUCHER_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private getAllJournalsRaw(): JournalEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_JOURNALS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getJournalEntries(businessId: string): JournalEntry[] {
    return this.getAllJournalsRaw().filter((j) => j.businessId === businessId);
  }

  // --- Step 5: Backup & Restore Engine ---
  createFullBackup(): MSbookBackupPayload {
    const businesses = this.getAllBusinesses();
    const customers = this.getAllCustomersRaw();
    const suppliers = this.getAllSuppliersRaw();
    const ledgerAccounts = this.getAllAccountsRaw();
    const products = this.getAllProductsRaw();
    const stockMovements = this.getAllStockMovementsRaw();
    const vouchers = this.getAllVouchersRaw();
    const voucherItems = this.getAllVoucherItemsRaw();
    const journalEntries = this.getAllJournalsRaw();
    const businessSettings = this.getAllBusinessSettingsRaw();

    const payload: MSbookBackupPayload = {
      app: 'MSbook',
      version: '1.0.0',
      timestamp: Date.now(),
      checksum: '',
      businesses,
      businessSettings,
      customers,
      suppliers,
      ledgerAccounts,
      products,
      stockMovements,
      vouchers,
      voucherItems,
      journalEntries,
    };

    const serialized = JSON.stringify({
      b: businesses.length,
      c: customers.length,
      s: suppliers.length,
      p: products.length,
      v: vouchers.length,
      j: journalEntries.length,
    });
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      hash = (hash << 5) - hash + serialized.charCodeAt(i);
      hash |= 0;
    }
    payload.checksum = 'MSB_' + Math.abs(hash).toString(16);

    return payload;
  }

  restoreFromBackup(payload: any): {
    success: boolean;
    message: string;
    stats: {
      businesses: number;
      customers: number;
      suppliers: number;
      products: number;
      vouchers: number;
      journals: number;
    };
  } {
    // 1. Strict Validation
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid backup file: Payload is not a valid JSON object.');
    }
    if (payload.app !== 'MSbook') {
      throw new Error('Invalid backup file: Application signature mismatch. Expected "MSbook" backup format.');
    }
    if (!Array.isArray(payload.businesses) || payload.businesses.length === 0) {
      throw new Error('Invalid backup file: No business records found in backup.');
    }
    if (
      !Array.isArray(payload.customers) ||
      !Array.isArray(payload.suppliers) ||
      !Array.isArray(payload.products) ||
      !Array.isArray(payload.vouchers)
    ) {
      throw new Error('Invalid backup file: Missing required data collections.');
    }

    // 2. Atomic Rollback Snapshot
    const backupSnapshot: Record<string, string | null> = {
      [STORAGE_KEY_BUSINESSES]: localStorage.getItem(STORAGE_KEY_BUSINESSES),
      [STORAGE_KEY_ACTIVE_ID]: localStorage.getItem(STORAGE_KEY_ACTIVE_ID),
      [STORAGE_KEY_CUSTOMERS]: localStorage.getItem(STORAGE_KEY_CUSTOMERS),
      [STORAGE_KEY_SUPPLIERS]: localStorage.getItem(STORAGE_KEY_SUPPLIERS),
      [STORAGE_KEY_ACCOUNTS]: localStorage.getItem(STORAGE_KEY_ACCOUNTS),
      [STORAGE_KEY_PRODUCTS]: localStorage.getItem(STORAGE_KEY_PRODUCTS),
      [STORAGE_KEY_STOCK_MOVEMENTS]: localStorage.getItem(STORAGE_KEY_STOCK_MOVEMENTS),
      [STORAGE_KEY_VOUCHERS]: localStorage.getItem(STORAGE_KEY_VOUCHERS),
      [STORAGE_KEY_VOUCHER_ITEMS]: localStorage.getItem(STORAGE_KEY_VOUCHER_ITEMS),
      [STORAGE_KEY_JOURNALS]: localStorage.getItem(STORAGE_KEY_JOURNALS),
      [STORAGE_KEY_BUSINESS_SETTINGS]: localStorage.getItem(STORAGE_KEY_BUSINESS_SETTINGS),
    };

    try {
      // 3. Atomically overwrite tables
      localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(payload.businesses));
      localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(payload.customers || []));
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(payload.suppliers || []));
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(payload.ledgerAccounts || []));
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(payload.products || []));
      localStorage.setItem(STORAGE_KEY_STOCK_MOVEMENTS, JSON.stringify(payload.stockMovements || []));
      localStorage.setItem(STORAGE_KEY_VOUCHERS, JSON.stringify(payload.vouchers || []));
      localStorage.setItem(STORAGE_KEY_VOUCHER_ITEMS, JSON.stringify(payload.voucherItems || []));
      localStorage.setItem(STORAGE_KEY_JOURNALS, JSON.stringify(payload.journalEntries || []));

      if (payload.businessSettings) {
        localStorage.setItem(STORAGE_KEY_BUSINESS_SETTINGS, JSON.stringify(payload.businessSettings));
      }

      // Activate first restored business
      const activeId = payload.businesses[0].id;
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeId);

      // Verify integrity
      const restoredBiz = this.getAllBusinesses();
      if (restoredBiz.length !== payload.businesses.length) {
        throw new Error('Integrity check failed: Restored business count mismatch.');
      }

      this.notify();

      return {
        success: true,
        message: 'Database restored successfully without mixing data!',
        stats: {
          businesses: payload.businesses.length,
          customers: (payload.customers || []).length,
          suppliers: (payload.suppliers || []).length,
          products: (payload.products || []).length,
          vouchers: (payload.vouchers || []).length,
          journals: (payload.journalEntries || []).length,
        },
      };
    } catch (err) {
      // Rollback to prior snapshot immediately
      Object.entries(backupSnapshot).forEach(([key, val]) => {
        if (val !== null) {
          localStorage.setItem(key, val);
        } else {
          localStorage.removeItem(key);
        }
      });
      this.notify();
      throw new Error(`Restore failed: ${err instanceof Error ? err.message : String(err)}. Database was preserved.`);
    }
  }

  // --- Step 5: CSV Data Export ---
  exportToCsv(type: ExportDataType, businessId: string): { filename: string; content: string } {
    const biz = this.getBusinessById(businessId);
    const bizNameSafe = (biz?.businessName || 'MSbook').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    const escapeCsv = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    switch (type) {
      case 'CUSTOMERS': {
        const customers = this.getCustomers(businessId);
        const headers = ['Customer ID', 'Name', 'Mobile', 'Address', 'Opening Balance', 'Total Invoiced', 'Total Received', 'Outstanding Due'];
        const rows = customers.map((c) => {
          const ledger = this.getCustomerLedger(businessId, c.id);
          return [
            escapeCsv(c.id),
            escapeCsv(c.name),
            escapeCsv(c.mobileNumber),
            escapeCsv(c.address),
            escapeCsv(c.openingBalance),
            escapeCsv(ledger.totalSales),
            escapeCsv(ledger.totalReceived),
            escapeCsv(ledger.totalOutstanding),
          ].join(',');
        });
        return {
          filename: `${bizNameSafe}_Customers_${dateStr}.csv`,
          content: [headers.join(','), ...rows].join('\n'),
        };
      }
      case 'SUPPLIERS': {
        const suppliers = this.getSuppliers(businessId);
        const headers = ['Supplier ID', 'Name', 'Mobile', 'Address', 'Opening Balance', 'Total Purchased', 'Total Paid', 'Payable Due'];
        const rows = suppliers.map((s) => {
          const ledger = this.getSupplierLedger(businessId, s.id);
          return [
            escapeCsv(s.id),
            escapeCsv(s.name),
            escapeCsv(s.mobileNumber),
            escapeCsv(s.address),
            escapeCsv(s.openingBalance),
            escapeCsv(ledger.totalPurchases),
            escapeCsv(ledger.totalPaid),
            escapeCsv(ledger.totalPayable),
          ].join(',');
        });
        return {
          filename: `${bizNameSafe}_Suppliers_${dateStr}.csv`,
          content: [headers.join(','), ...rows].join('\n'),
        };
      }
      case 'PRODUCTS': {
        const products = this.getProducts(businessId);
        const headers = ['Product ID', 'SKU', 'Barcode', 'Name', 'Category', 'Unit', 'Purchase Cost', 'Selling Price', 'Stock Qty', 'Stock Value', 'Min Alert'];
        const rows = products.map((p) => [
          escapeCsv(p.id),
          escapeCsv(p.sku || ''),
          escapeCsv(p.barcode || ''),
          escapeCsv(p.name),
          escapeCsv(p.category || ''),
          escapeCsv(p.unit),
          escapeCsv(p.purchaseCost),
          escapeCsv(p.sellingPrice),
          escapeCsv(p.stockQuantity),
          escapeCsv(Math.max(0, p.stockQuantity) * (p.purchaseCost || 0)),
          escapeCsv(p.minStockLevel || 5),
        ].join(','));
        return {
          filename: `${bizNameSafe}_Products_Inventory_${dateStr}.csv`,
          content: [headers.join(','), ...rows].join('\n'),
        };
      }
      case 'SALES': {
        const vouchers = this.getVouchers(businessId).filter(
          (v) => v.voucherType === 'SALES' || v.voucherType === 'SPLIT_PAYMENT'
        );
        const headers = ['Invoice #', 'Date', 'Customer', 'Total Bill', 'Cash', 'UPI', 'Bank', 'Udhar', 'Remarks'];
        const rows = vouchers.map((v) => [
          escapeCsv(v.voucherNumber),
          escapeCsv(new Date(v.date).toISOString().split('T')[0]),
          escapeCsv(v.partyName || 'Cash Customer'),
          escapeCsv(v.totalAmount),
          escapeCsv(v.cashAmount || 0),
          escapeCsv(v.upiAmount || 0),
          escapeCsv(v.bankAmount || 0),
          escapeCsv(v.udharAmount || 0),
          escapeCsv(v.remarks || ''),
        ].join(','));
        return {
          filename: `${bizNameSafe}_Sales_Register_${dateStr}.csv`,
          content: [headers.join(','), ...rows].join('\n'),
        };
      }
      case 'PURCHASES': {
        const vouchers = this.getVouchers(businessId).filter((v) => v.voucherType === 'PURCHASE');
        const headers = ['Bill #', 'Date', 'Supplier', 'Total Bill', 'Cash Paid', 'Bank Paid', 'Credit Due', 'Remarks'];
        const rows = vouchers.map((v) => [
          escapeCsv(v.voucherNumber),
          escapeCsv(new Date(v.date).toISOString().split('T')[0]),
          escapeCsv(v.partyName || 'General Supplier'),
          escapeCsv(v.totalAmount),
          escapeCsv(v.cashAmount || 0),
          escapeCsv(v.bankAmount || 0),
          escapeCsv(v.udharAmount || 0),
          escapeCsv(v.remarks || ''),
        ].join(','));
        return {
          filename: `${bizNameSafe}_Purchase_Register_${dateStr}.csv`,
          content: [headers.join(','), ...rows].join('\n'),
        };
      }
      case 'LEDGERS': {
        const accounts = this.getLedgerAccounts(businessId);
        const headers = ['Account ID', 'Account Name', 'Group', 'Sub-Group', 'Opening Balance', 'Total Debit', 'Total Credit', 'Closing Balance'];
        const rows = accounts.map((a) => {
          const ledger = this.getAccountLedger(businessId, a.name);
          return [
            escapeCsv(a.id),
            escapeCsv(a.name),
            escapeCsv(a.group),
            escapeCsv(a.subGroup || ''),
            escapeCsv(a.openingBalance),
            escapeCsv(ledger.totalDebit),
            escapeCsv(ledger.totalCredit),
            escapeCsv(ledger.closingBalance),
          ].join(',');
        });
        return {
          filename: `${bizNameSafe}_General_Ledgers_${dateStr}.csv`,
          content: [headers.join(','), ...rows].join('\n'),
        };
      }
      case 'STOCK_MOVEMENTS': {
        const movements = this.getStockMovements(businessId);
        const headers = ['Movement ID', 'Date', 'Product', 'Type', 'Quantity', 'Previous Stock', 'New Stock', 'Reference', 'Reason'];
        const rows = movements.map((m) => [
          escapeCsv(m.id),
          escapeCsv(new Date(m.date).toISOString()),
          escapeCsv(m.productName),
          escapeCsv(m.type),
          escapeCsv(m.quantity),
          escapeCsv(m.previousStock),
          escapeCsv(m.newStock),
          escapeCsv(m.referenceNo || ''),
          escapeCsv(m.reason || ''),
        ].join(','));
        return {
          filename: `${bizNameSafe}_Stock_Movements_${dateStr}.csv`,
          content: [headers.join(','), ...rows].join('\n'),
        };
      }
      default:
        throw new Error(`Unsupported export type: ${type}`);
    }
  }

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY_BUSINESSES);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
    localStorage.removeItem(STORAGE_KEY_CUSTOMERS);
    localStorage.removeItem(STORAGE_KEY_SUPPLIERS);
    localStorage.removeItem(STORAGE_KEY_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_STOCK_MOVEMENTS);
    localStorage.removeItem(STORAGE_KEY_VOUCHERS);
    localStorage.removeItem(STORAGE_KEY_VOUCHER_ITEMS);
    localStorage.removeItem(STORAGE_KEY_JOURNALS);
    localStorage.removeItem(STORAGE_KEY_BUSINESS_SETTINGS);
    localStorage.setItem(STORAGE_KEY_DEMO_PURGED, 'true');
    this.notify();
  }
}

export const db = new RoomDatabaseSimulator();
