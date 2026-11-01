import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Building2,
  Users2,
  Calendar,
  Receipt,
  Scale,
  Database,
  Upload,
  Download,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Save,
  Phone,
  MapPin,
  User,
  ShoppingBag,
  Shirt,
  Printer,
  X,
  FileText,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import {
  Business,
  BusinessType,
  BUSINESS_TYPES,
  BusinessSettings,
  SettingsSubSection,
  ExportDataType,
  MSbookBackupPayload,
} from '../../types';
import { db } from '../../services/db';

interface SettingsScreenProps {
  activeBusiness: Business;
  initialSubSection?: SettingsSubSection;
  onNavigateBack: () => void;
  onNavigateToSwitcher: () => void;
  onNavigateToAddBusiness: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  activeBusiness,
  initialSubSection = 'HUB',
  onNavigateBack,
  onNavigateToSwitcher,
  onNavigateToAddBusiness,
}) => {
  const [subSection, setSubSection] = useState<SettingsSubSection>(initialSubSection);
  const [settings, setSettings] = useState<BusinessSettings>(() =>
    db.getBusinessSettings(activeBusiness.id)
  );

  // Business Profile Form State
  const [profileName, setProfileName] = useState(activeBusiness.businessName);
  const [profileOwner, setProfileOwner] = useState(activeBusiness.ownerName || '');
  const [profileMobile, setProfileMobile] = useState(activeBusiness.mobileNumber || '');
  const [profileAddress, setProfileAddress] = useState(activeBusiness.address || '');
  const [profileType, setProfileType] = useState<BusinessType>(activeBusiness.businessType);

  // Financial Year Form State
  const [fyStart, setFyStart] = useState(settings.financialYear.startDate);
  const [fyEnd, setFyEnd] = useState(settings.financialYear.endDate);
  const [fyLabel, setFyLabel] = useState(settings.financialYear.label);

  // Invoice Settings Form State
  const [invPrefix, setInvPrefix] = useState(settings.invoiceSettings.invoicePrefix);
  const [invAutoNumber, setInvAutoNumber] = useState(settings.invoiceSettings.autoNumbering);
  const [invShowBiz, setInvShowBiz] = useState(settings.invoiceSettings.showBusinessDetails);
  const [invShowCust, setInvShowCust] = useState(settings.invoiceSettings.showCustomerDetails);
  const [invNotes, setInvNotes] = useState(settings.invoiceSettings.defaultInvoiceNotes);

  // Default Unit Form State
  const [defaultUnit, setDefaultUnit] = useState(settings.unitSettings.defaultUnit);

  // Feedback notifications
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restore State
  const [pendingRestorePayload, setPendingRestorePayload] = useState<MSbookBackupPayload | null>(null);
  const [restoreStats, setRestoreStats] = useState<any>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Report Print / Preview Modal State
  const [reportPreviewHtml, setReportPreviewHtml] = useState<{ title: string; content: string } | null>(
    null
  );

  const loadData = () => {
    const s = db.getBusinessSettings(activeBusiness.id);
    setSettings(s);
    setProfileName(activeBusiness.businessName);
    setProfileOwner(activeBusiness.ownerName || '');
    setProfileMobile(activeBusiness.mobileNumber || '');
    setProfileAddress(activeBusiness.address || '');
    setProfileType(activeBusiness.businessType);

    setFyStart(s.financialYear.startDate);
    setFyEnd(s.financialYear.endDate);
    setFyLabel(s.financialYear.label);

    setInvPrefix(s.invoiceSettings.invoicePrefix);
    setInvAutoNumber(s.invoiceSettings.autoNumbering);
    setInvShowBiz(s.invoiceSettings.showBusinessDetails);
    setInvShowCust(s.invoiceSettings.showCustomerDetails);
    setInvNotes(s.invoiceSettings.defaultInvoiceNotes);

    setDefaultUnit(s.unitSettings.defaultUnit);
  };

  useEffect(() => {
    loadData();
  }, [activeBusiness.id]);

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessBanner(null);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  // 1. Save Business Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showError('Business name cannot be empty');
      return;
    }
    try {
      db.updateBusiness(activeBusiness.id, {
        businessName: profileName.trim(),
        ownerName: profileOwner.trim(),
        mobileNumber: profileMobile.trim(),
        address: profileAddress.trim(),
        businessType: profileType,
      });
      showSuccess('Business profile updated successfully!');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update business profile');
    }
  };

  // 2. Save Financial Year
  const handleSaveFinancialYear = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = db.updateBusinessSettings(activeBusiness.id, {
        financialYear: {
          startDate: fyStart,
          endDate: fyEnd,
          label: fyLabel.trim() || `FY ${fyStart.slice(0, 4)}-${fyEnd.slice(2, 4)}`,
        },
      });
      setSettings(updated);
      showSuccess('Financial year settings saved! Historical data remains safe.');
    } catch (err) {
      showError('Failed to save financial year settings');
    }
  };

  // 3. Save Invoice Settings
  const handleSaveInvoiceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = db.updateBusinessSettings(activeBusiness.id, {
        invoiceSettings: {
          invoicePrefix: invPrefix.trim().toUpperCase() || 'INV',
          autoNumbering: invAutoNumber,
          nextInvoiceNumber: settings.invoiceSettings.nextInvoiceNumber || 1,
          showBusinessDetails: invShowBiz,
          showCustomerDetails: invShowCust,
          defaultInvoiceNotes: invNotes.trim(),
        },
      });
      setSettings(updated);
      showSuccess('Invoice settings saved successfully!');
    } catch (err) {
      showError('Failed to save invoice settings');
    }
  };

  // 4. Save Default Units
  const handleSaveDefaultUnits = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = db.updateBusinessSettings(activeBusiness.id, {
        unitSettings: {
          defaultUnit,
          allowedUnits: settings.unitSettings.allowedUnits,
        },
      });
      setSettings(updated);
      showSuccess('Default unit preference saved!');
    } catch (err) {
      showError('Failed to save unit settings');
    }
  };

  // 5. Trigger Backup Download (Storage Access Framework)
  const handleCreateBackup = () => {
    try {
      const payload = db.createFullBackup();
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const now = new Date();
      const datePart = now.toISOString().split('T')[0];
      const timePart = now.toTimeString().split(' ')[0].replace(/:/g, '');
      const fileName = `MSbook_Backup_${datePart}_${timePart}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const sizeKb = (blob.size / 1024).toFixed(1);
      showSuccess(
        `Backup created successfully! File: ${fileName} (${sizeKb} KB) containing ${payload.businesses.length} business(es).`
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create backup');
    }
  };

  // 6. Handle Restore File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Pre-validation
        if (parsed.app !== 'MSbook') {
          showError('Invalid backup file: Application identifier does not match MSbook.');
          return;
        }
        if (!Array.isArray(parsed.businesses) || parsed.businesses.length === 0) {
          showError('Invalid backup file: No businesses found in the selected file.');
          return;
        }

        setPendingRestorePayload(parsed);
        setRestoreStats({
          fileName: file.name,
          fileSizeKb: (file.size / 1024).toFixed(1),
          businessesCount: parsed.businesses.length,
          businessesNames: parsed.businesses.map((b: any) => b.businessName).join(', '),
          customersCount: (parsed.customers || []).length,
          suppliersCount: (parsed.suppliers || []).length,
          productsCount: (parsed.products || []).length,
          vouchersCount: (parsed.vouchers || []).length,
          backupTimestamp: parsed.timestamp ? new Date(parsed.timestamp).toLocaleString('en-IN') : 'Unknown',
        });
        setIsRestoreConfirmOpen(true);
      } catch (err) {
        showError('Corrupted backup file: Unable to parse JSON.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirm and Execute Atomic Restore
  const handleConfirmRestore = () => {
    if (!pendingRestorePayload) return;
    try {
      const result = db.restoreFromBackup(pendingRestorePayload);
      setIsRestoreConfirmOpen(false);
      setPendingRestorePayload(null);
      showSuccess(
        `Database restored successfully! ${result.stats.businesses} businesses, ${result.stats.vouchers} vouchers restored.`
      );
    } catch (err) {
      setIsRestoreConfirmOpen(false);
      showError(err instanceof Error ? err.message : 'Database restoration failed');
    }
  };

  // 7. CSV Export Trigger
  const handleExportCsv = (type: ExportDataType) => {
    try {
      const res = db.exportToCsv(type, activeBusiness.id);
      const blob = new Blob([res.content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(`Exported ${type.toLowerCase()} to ${res.filename}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'CSV export failed');
    }
  };

  // 8. Open Report Preview / Print
  const handlePreviewReport = (reportTitle: string) => {
    const biz = activeBusiness;
    const fin = db.getBusinessFinancialSummary(biz.id);
    const vouchers = db.getVouchers(biz.id).slice(0, 10);

    const html = `
      <div class="p-6 font-sans text-slate-800 space-y-4">
        <div class="border-b-2 border-[#0F4D32] pb-4 flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-black text-[#0F4D32] tracking-tight">${biz.businessName}</h1>
            <p class="text-xs text-slate-500">${biz.address || 'Address on file'} • Phone: ${biz.mobileNumber || 'N/A'}</p>
            <p class="text-[11px] text-slate-400">Owner: ${biz.ownerName || 'Proprietor'}</p>
          </div>
          <div class="text-right">
            <span class="inline-block px-3 py-1 bg-[#F2F8F4] text-[#0F4D32] font-bold text-xs rounded-lg border border-[#0F4D32]/20">
              ${reportTitle}
            </span>
            <p class="text-[10px] text-slate-400 mt-1">Generated: ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 text-center my-4">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-[10px] text-slate-400 font-bold block">Total Sales</span>
            <span class="text-base font-bold text-slate-900">₹${fin.totalSales.toLocaleString('en-IN')}</span>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-[10px] text-slate-400 font-bold block">Net Profit</span>
            <span class="text-base font-bold text-[#0F4D32]">₹${fin.netProfit.toLocaleString('en-IN')}</span>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span class="text-[10px] text-slate-400 font-bold block">Stock Value</span>
            <span class="text-base font-bold text-indigo-700">₹${fin.stockValue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="space-y-2">
          <h3 class="font-bold text-xs uppercase text-slate-600">Recent Transactions Register</h3>
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="bg-slate-100 text-slate-600 border-b border-slate-200">
                <th class="p-2">Voucher #</th>
                <th class="p-2">Type</th>
                <th class="p-2">Party</th>
                <th class="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${
                vouchers.length === 0
                  ? '<tr><td colspan="4" class="p-4 text-center text-slate-400">No transactions recorded yet</td></tr>'
                  : vouchers
                      .map(
                        (v) => `
                <tr class="border-b border-slate-100">
                  <td class="p-2 font-bold">${v.voucherNumber}</td>
                  <td class="p-2">${v.voucherType}</td>
                  <td class="p-2">${v.partyName || 'Cash Counter'}</td>
                  <td class="p-2 text-right font-bold">₹${v.totalAmount.toLocaleString('en-IN')}</td>
                </tr>`
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>

        <div class="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
          Generated via MSbook Native Accounting Suite • Preserved Offline Storage
        </div>
      </div>
    `;

    setReportPreviewHtml({ title: reportTitle, content: html });
  };

  // All businesses count for App Info
  const allBusinesses = db.getAllBusinesses();
  const allVouchers = db.getVouchers(activeBusiness.id);
  const allCustomers = db.getCustomers(activeBusiness.id);
  const allProducts = db.getProducts(activeBusiness.id);

  return (
    <div className="flex flex-col h-full bg-[#F8FAF8] select-none text-slate-800">
      {/* Top Native Header */}
      <div className="bg-[#0F4D32] text-white px-4 pt-3 pb-3 shrink-0 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (subSection !== 'HUB') {
                setSubSection('HUB');
              } else {
                onNavigateBack();
              }
            }}
            className="p-1.5 -ml-1.5 hover:bg-white/10 rounded-lg active:scale-95 transition-all text-white"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 mr-1 inline" />
            <span className="font-semibold text-sm">
              {subSection === 'HUB' ? 'Back' : 'Settings'}
            </span>
          </button>
          <div className="ml-1">
            <h1 className="font-bold text-sm tracking-wide leading-tight">
              {subSection === 'HUB' && 'Settings & Backup'}
              {subSection === 'PROFILE' && 'Business Profile'}
              {subSection === 'MANAGE_BUSINESSES' && 'Manage Businesses'}
              {subSection === 'FINANCIAL_YEAR' && 'Financial Year'}
              {subSection === 'INVOICE_SETTINGS' && 'Invoice Settings'}
              {subSection === 'DEFAULT_UNITS' && 'Default Units'}
              {subSection === 'BACKUP' && 'Data Backup'}
              {subSection === 'RESTORE' && 'Restore Backup'}
              {subSection === 'EXPORT' && 'Export Data'}
              {subSection === 'APP_INFO' && 'App Information'}
            </h1>
            <p className="text-[10px] text-white/70">{activeBusiness.businessName}</p>
          </div>
        </div>

        <div className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-medium tracking-wide">
          Step 5
        </div>
      </div>

      {/* Toast / Notification Banners */}
      {successBanner && (
        <div className="bg-emerald-600 text-white text-xs px-4 py-2 flex items-center space-x-2 shadow-xs animate-fade-in shrink-0">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{successBanner}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-600 text-white text-xs px-4 py-2 flex items-center space-x-2 shadow-xs animate-fade-in shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ============================================================== */}
        {/* 1. SETTINGS HUB DIRECTORY                                      */}
        {/* ============================================================== */}
        {subSection === 'HUB' && (
          <div className="space-y-4">
            {/* Active Business Quick Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-[#F2F8F4] text-[#0F4D32] flex items-center justify-center border border-[#0F4D32]/10">
                  {activeBusiness.businessType === 'CLOTHING' ? (
                    <Shirt className="w-5 h-5 text-black stroke-[1.8px]" />
                  ) : (
                    <ShoppingBag className="w-5 h-5 text-black stroke-[1.8px]" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#0F4D32] tracking-wider">
                    Current Active Store
                  </span>
                  <h2 className="font-black text-slate-900 text-base leading-tight">
                    {activeBusiness.businessName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {activeBusiness.ownerName || 'Proprietor'} • {activeBusiness.mobileNumber || 'No phone'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSubSection('PROFILE')}
                className="px-3 py-1.5 bg-[#F2F8F4] text-[#0F4D32] rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors"
              >
                Edit
              </button>
            </div>

            {/* Category: Business Management */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Business Management
              </span>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
                <button
                  onClick={() => setSubSection('PROFILE')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F2F8F4] text-[#0F4D32] flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-black stroke-[1.8px]" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Business Profile</span>
                      <span className="text-[11px] text-slate-500">
                        Edit store name, owner, phone & address
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={onNavigateToSwitcher}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F2F8F4] text-[#0F4D32] flex items-center justify-center">
                      <Users2 className="w-4 h-4 text-black stroke-[1.8px]" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">
                        Switch / Manage Businesses
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {allBusinesses.length} active business profile(s)
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Category: Preferences & Rules */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Configuration & Invoicing
              </span>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
                <button
                  onClick={() => setSubSection('INVOICE_SETTINGS')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F2F8F4] text-[#0F4D32] flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-black stroke-[1.8px]" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Invoice Settings</span>
                      <span className="text-[11px] text-slate-500">
                        Prefix ({settings.invoiceSettings.invoicePrefix}), auto-numbering & print header
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setSubSection('FINANCIAL_YEAR')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F2F8F4] text-[#0F4D32] flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-black stroke-[1.8px]" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Financial Year</span>
                      <span className="text-[11px] text-slate-500">
                        {settings.financialYear.label} ({settings.financialYear.startDate} to{' '}
                        {settings.financialYear.endDate})
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setSubSection('DEFAULT_UNITS')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F2F8F4] text-[#0F4D32] flex items-center justify-center">
                      <Scale className="w-4 h-4 text-black stroke-[1.8px]" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Default Units</span>
                      <span className="text-[11px] text-slate-500">
                        Primary measurement unit ({settings.unitSettings.defaultUnit})
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Category: Data Safety & Portability */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Data Safety & Portability
              </span>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
                <button
                  onClick={() => setSubSection('BACKUP')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0F4D32] flex items-center justify-center">
                      <Database className="w-4 h-4 text-black stroke-[1.8px]" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Data Backup</span>
                      <span className="text-[11px] text-slate-500">
                        Save all records via Storage Access Framework
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-[#0F4D32] px-2 py-0.5 rounded-md">
                    Local Safe
                  </span>
                </button>

                <button
                  onClick={() => setSubSection('RESTORE')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-black stroke-[1.8px]" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Restore Backup</span>
                      <span className="text-[11px] text-slate-500">
                        Restore from verified MSbook backup file
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setSubSection('EXPORT')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4 text-black stroke-[1.8px]" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">Export Data</span>
                      <span className="text-[11px] text-slate-500">
                        Export customers, products, sales & ledgers to CSV
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Category: System & App Info */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                System
              </span>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <button
                  onClick={() => setSubSection('APP_INFO')}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Info className="w-4 h-4 text-black stroke-[1.8px]" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">App Information</span>
                      <span className="text-[11px] text-slate-500">
                        Version 1.0.0 • Architecture & SQLite Metrics
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. BUSINESS PROFILE EDIT FORM                                  */}
        {/* ============================================================== */}
        {subSection === 'PROFILE' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Business Details
                </h3>
                <p className="text-[11px] text-slate-400">
                  Changes affect strictly {activeBusiness.businessName}.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F4D32] focus:bg-white transition-colors"
                  placeholder="e.g. Shri Ganesh Kirana Stores"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Owner / Proprietor Name
                </label>
                <input
                  type="text"
                  value={profileOwner}
                  onChange={(e) => setProfileOwner(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F4D32] focus:bg-white transition-colors"
                  placeholder="e.g. Ramesh Patel"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={profileMobile}
                  onChange={(e) => setProfileMobile(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F4D32] focus:bg-white transition-colors"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Store Address
                </label>
                <textarea
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F4D32] focus:bg-white transition-colors resize-none"
                  placeholder="e.g. Main Market, Station Road"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Business Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProfileType('KIRANA')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      profileType === 'KIRANA'
                        ? 'border-[#0F4D32] bg-[#F2F8F4] text-[#0F4D32]'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">Kirana / FMCG</div>
                    <div className="text-[10px] text-slate-500">Grocery & Provisions</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileType('CLOTHING')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      profileType === 'CLOTHING'
                        ? 'border-[#0F4D32] bg-[#F2F8F4] text-[#0F4D32]'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">Clothing</div>
                    <div className="text-[10px] text-slate-500">Apparel & Variants</div>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0F4D32] text-white rounded-xl text-xs font-bold hover:bg-[#0B3B26] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Business Profile</span>
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* 3. FINANCIAL YEAR CONFIGURATION                                 */}
        {/* ============================================================== */}
        {subSection === 'FINANCIAL_YEAR' && (
          <form onSubmit={handleSaveFinancialYear} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Financial Year Settings
                </h3>
                <p className="text-[11px] text-slate-400">
                  Configure accounting cycle. Historical transactions remain completely untouched.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  FY Label
                </label>
                <input
                  type="text"
                  value={fyLabel}
                  onChange={(e) => setFyLabel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F4D32]"
                  placeholder="e.g. FY 2026-27"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={fyStart}
                    onChange={(e) => setFyStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F4D32]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={fyEnd}
                    onChange={(e) => setFyEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F4D32]"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-[#0F4D32] flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>
                  Safety Guarantee: Updating financial year dates will never modify or delete historical transactions.
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0F4D32] text-white rounded-xl text-xs font-bold hover:bg-[#0B3B26] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Financial Year</span>
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* 4. INVOICE SETTINGS                                            */}
        {/* ============================================================== */}
        {subSection === 'INVOICE_SETTINGS' && (
          <form onSubmit={handleSaveInvoiceSettings} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Billing & Invoice Configuration
                </h3>
                <p className="text-[11px] text-slate-400">
                  Customize invoice prefixes, auto-numbering, and default terms.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  value={invPrefix}
                  onChange={(e) => setInvPrefix(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono font-bold focus:outline-hidden focus:border-[#0F4D32]"
                  placeholder="e.g. INV, BILL, MS"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Next Invoice Example: {invPrefix || 'INV'}-2026-0001
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between text-xs text-slate-800 cursor-pointer">
                  <span className="font-semibold">Automatic Invoice Numbering</span>
                  <input
                    type="checkbox"
                    checked={invAutoNumber}
                    onChange={(e) => setInvAutoNumber(e.target.checked)}
                    className="w-4 h-4 accent-[#0F4D32] rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-800 cursor-pointer">
                  <span className="font-semibold">Show Business Details on Invoice</span>
                  <input
                    type="checkbox"
                    checked={invShowBiz}
                    onChange={(e) => setInvShowBiz(e.target.checked)}
                    className="w-4 h-4 accent-[#0F4D32] rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-800 cursor-pointer">
                  <span className="font-semibold">Show Customer Contact on Invoice</span>
                  <input
                    type="checkbox"
                    checked={invShowCust}
                    onChange={(e) => setInvShowCust(e.target.checked)}
                    className="w-4 h-4 accent-[#0F4D32] rounded"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Default Invoice Terms & Notes
                </label>
                <textarea
                  value={invNotes}
                  onChange={(e) => setInvNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F4D32] resize-none"
                  placeholder="e.g. Goods once sold will not be returned."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0F4D32] text-white rounded-xl text-xs font-bold hover:bg-[#0B3B26] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Invoice Settings</span>
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* 5. DEFAULT UNITS CONFIGURATION                                 */}
        {/* ============================================================== */}
        {subSection === 'DEFAULT_UNITS' && (
          <form onSubmit={handleSaveDefaultUnits} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3.5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Unit of Measurement Preferences
                </h3>
                <p className="text-[11px] text-slate-400">
                  Primary default unit selected when adding new items.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Default Unit
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {settings.unitSettings.allowedUnits.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setDefaultUnit(u)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        defaultUnit === u
                          ? 'border-[#0F4D32] bg-[#F2F8F4] text-[#0F4D32]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0F4D32] text-white rounded-xl text-xs font-bold hover:bg-[#0B3B26] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Default Unit</span>
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* 6. DATA BACKUP (Storage Access Framework)                     */}
        {/* ============================================================== */}
        {subSection === 'BACKUP' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center space-x-2 text-[#0F4D32]">
                <Database className="w-5 h-5 text-black stroke-[1.8px]" />
                <h3 className="font-bold text-sm text-slate-900">Manual Local Backup</h3>
              </div>
              <p className="text-xs text-slate-600">
                Creates a verified offline JSON backup file including all businesses, vouchers, customers, suppliers, products, and ledger accounts.
              </p>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <span className="font-bold text-[10px] uppercase text-slate-400 block tracking-wider">
                  Backup Scope
                </span>
                <div className="flex justify-between">
                  <span>Registered Businesses</span>
                  <span className="font-bold text-slate-900">{allBusinesses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customers & Suppliers</span>
                  <span className="font-bold text-slate-900">
                    {allCustomers.length} / {db.getSuppliers(activeBusiness.id).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Products & Stock</span>
                  <span className="font-bold text-slate-900">{allProducts.length} items</span>
                </div>
                <div className="flex justify-between">
                  <span>Vouchers & Invoices</span>
                  <span className="font-bold text-slate-900">{allVouchers.length} vouchers</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-[#0F4D32] flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>
                  Storage Access Framework: Save anywhere on your device or SD card. 100% offline and secure.
                </span>
              </div>
            </div>

            <button
              onClick={handleCreateBackup}
              className="w-full py-3.5 bg-[#0F4D32] text-white rounded-xl text-xs font-bold hover:bg-[#0B3B26] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Generate & Download Backup File</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* 7. RESTORE BACKUP                                              */}
        {/* ============================================================== */}
        {subSection === 'RESTORE' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center space-x-2 text-blue-700">
                <Upload className="w-5 h-5 text-black stroke-[1.8px]" />
                <h3 className="font-bold text-sm text-slate-900">Restore from Backup</h3>
              </div>
              <p className="text-xs text-slate-600">
                Select an authentic MSbook backup file (`.json`). The database engine will validate schema, integrity, and relationships before safely restoring.
              </p>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Warning: Restoring will overwrite existing local data. An atomic rollback snapshot protects against partial or corrupted restores.
                </span>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Select MSbook Backup File (.json)</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 8. EXPORT DATA (CSV & Reports)                                 */}
        {/* ============================================================== */}
        {subSection === 'EXPORT' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Export Tabular Data (CSV)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Download spreadsheets for external audit or record-keeping.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleExportCsv('CUSTOMERS')}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#F2F8F4] hover:border-[#0F4D32] transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">Customer List</span>
                    <span className="text-[10px] text-slate-500">Debtors & balances</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleExportCsv('SUPPLIERS')}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#F2F8F4] hover:border-[#0F4D32] transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">Supplier List</span>
                    <span className="text-[10px] text-slate-500">Creditors & dues</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleExportCsv('PRODUCTS')}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#F2F8F4] hover:border-[#0F4D32] transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">Product Inventory</span>
                    <span className="text-[10px] text-slate-500">Stock & valuation</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleExportCsv('SALES')}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#F2F8F4] hover:border-[#0F4D32] transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">Sales Register</span>
                    <span className="text-[10px] text-slate-500">Invoices & split bills</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleExportCsv('PURCHASES')}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#F2F8F4] hover:border-[#0F4D32] transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">Purchase Register</span>
                    <span className="text-[10px] text-slate-500">Inward stock bills</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleExportCsv('LEDGERS')}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#F2F8F4] hover:border-[#0F4D32] transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">General Ledgers</span>
                    <span className="text-[10px] text-slate-500">Chart of accounts</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleExportCsv('STOCK_MOVEMENTS')}
                  className="col-span-2 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#F2F8F4] hover:border-[#0F4D32] transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">Stock Movement Audit Trail</span>
                    <span className="text-[10px] text-slate-500">In, out, adjustments & sale transfers</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
                  Printable Financial Statements
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => handlePreviewReport('Profit & Loss Statement')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center space-x-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print P&L Statement</span>
                  </button>

                  <button
                    onClick={() => handlePreviewReport('Balance Sheet')}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center space-x-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Balance Sheet</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 9. APP INFORMATION                                             */}
        {/* ============================================================== */}
        {subSection === 'APP_INFO' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0F4D32] text-white font-black text-xl flex items-center justify-center">
                  MS
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">MSbook Android</h3>
                  <p className="text-xs text-slate-500">Native Jetpack Compose Accounting</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-100 text-[#0F4D32] font-bold text-[10px]">
                    v1.0.0 (Stage 5 Architecture)
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs text-slate-600 pt-2">
                <div className="py-2 flex justify-between">
                  <span>Architecture</span>
                  <span className="font-semibold text-slate-900">MVVM • Material 3</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span>Persistence</span>
                  <span className="font-semibold text-slate-900">Room SQLite (Local)</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span>Target SDK</span>
                  <span className="font-semibold text-slate-900">Android 8.0+ (API 26+)</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span>Network Mode</span>
                  <span className="font-bold text-emerald-700">100% Offline (Zero Cloud)</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span>Total Businesses</span>
                  <span className="font-semibold text-slate-900">{allBusinesses.length}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span>Active Business ID</span>
                  <span className="font-mono text-[10px] text-slate-500">{activeBusiness.id}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-[#0F4D32] space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Zero Cloud Leakage Guarantee</span>
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                MSbook keeps your accounting, customer data, and profit margins completely confidential on your device. No paid APIs, external tracking, or developer servers.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Restore */}
      {isRestoreConfirmOpen && restoreStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Confirm Database Restore</h3>
                <p className="text-xs text-slate-500">Atomic validation complete</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>File Name:</span>
                <span className="font-bold text-slate-900 truncate max-w-[150px]">{restoreStats.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span>Businesses Found:</span>
                <span className="font-bold text-slate-900">{restoreStats.businessesCount} ({restoreStats.businessesNames})</span>
              </div>
              <div className="flex justify-between">
                <span>Vouchers to Restore:</span>
                <span className="font-bold text-slate-900">{restoreStats.vouchersCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Customers & Products:</span>
                <span className="font-bold text-slate-900">{restoreStats.customersCount} / {restoreStats.productsCount}</span>
              </div>
            </div>

            <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200 text-xs">
              <strong>Notice:</strong> Restoring will replace existing local data. An atomic safety snapshot will rollback automatically if any error occurs.
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsRestoreConfirmOpen(false);
                  setPendingRestorePayload(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="flex-1 py-2.5 bg-red-700 text-white rounded-xl text-xs font-bold hover:bg-red-800 transition-colors shadow-xs"
              >
                Restore Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Printable Preview Modal */}
      {reportPreviewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-[#0F4D32] text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4" />
                <span className="font-bold text-xs">{reportPreviewHtml.title} Preview</span>
              </div>
              <button
                onClick={() => setReportPreviewHtml(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-2"
              dangerouslySetInnerHTML={{ __html: reportPreviewHtml.content }}
            />

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2 shrink-0">
              <button
                onClick={() => setReportPreviewHtml(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-[#0F4D32] text-white rounded-xl text-xs font-bold hover:bg-[#0B3B26] transition-colors flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
