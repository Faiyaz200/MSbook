import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Maximize2,
  RotateCcw,
  Trash2,
  Code2,
  ShieldCheck,
  CheckCircle,
  Receipt,
  BookOpen,
  Package,
  BarChart3,
  Settings,
} from 'lucide-react';
import { Business, BusinessType, ScreenState, BottomTabKey, VoucherType } from './types';
import { db } from './services/db';
import { AndroidFrame } from './components/AndroidFrame';
import { BottomNav } from './components/BottomNav';
import { BusinessSelectScreen } from './components/screens/BusinessSelectScreen';
import { BusinessDetailsScreen } from './components/screens/BusinessDetailsScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { VoucherScreen } from './components/screens/VoucherScreen';
import { SalesVoucherScreen } from './components/screens/SalesVoucherScreen';
import { ReceiptVoucherScreen } from './components/screens/ReceiptVoucherScreen';
import { PurchaseVoucherScreen } from './components/screens/PurchaseVoucherScreen';
import { CustomerLedgerScreen } from './components/screens/CustomerLedgerScreen';
import { SupplierLedgerScreen } from './components/screens/SupplierLedgerScreen';
import { AccountLedgerScreen } from './components/screens/AccountLedgerScreen';
import { PaymentVoucherScreen } from './components/screens/PaymentVoucherScreen';
import { LedgersHubScreen } from './components/screens/LedgersHubScreen';
import { InventoryScreen } from './components/screens/InventoryScreen';
import { ReportsScreen } from './components/screens/ReportsScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { VoucherDetailPlaceholderScreen } from './components/screens/VoucherDetailPlaceholderScreen';
import { SimplePlaceholderScreen } from './components/screens/SimplePlaceholderScreen';
import { BusinessSwitchScreen } from './components/screens/BusinessSwitchScreen';
import { TestSuiteModal } from './components/TestSuiteModal';
import { CodeViewerModal } from './components/CodeViewerModal';
import { WelcomeSplashScreen } from './components/WelcomeSplashScreen';

export default function App() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [isFramed, setIsFramed] = useState<boolean>(true);
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showWelcomeSplash, setShowWelcomeSplash] = useState<boolean>(true);

  // Navigation Back-Stack mimicking Android NavHost Controller
  const [screenStack, setScreenStack] = useState<ScreenState[]>(() => {
    const existing = db.getAllBusinesses();
    if (existing.length > 0) {
      db.ensureActiveBusiness();
      return [{ name: 'DASHBOARD' }];
    }
    return [{ name: 'BUSINESS_SELECT', isAddingAdditional: false }];
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const refreshFromDb = () => {
    const all = db.getAllBusinesses();
    setBusinesses(all);
    const activeId = db.getActiveBusinessId();
    setActiveBusinessId(activeId);

    if (all.length === 0) {
      setScreenStack([{ name: 'BUSINESS_SELECT', isAddingAdditional: false }]);
    }
  };

  useEffect(() => {
    refreshFromDb();
    const unsubscribe = db.subscribe(() => {
      refreshFromDb();
    });
    return () => unsubscribe();
  }, []);

  const currentScreen = screenStack[screenStack.length - 1];

  const activeBusiness =
    businesses.find((b) => b.id === activeBusinessId) ||
    (businesses.length > 0 ? businesses[0] : null);

  const navigateTo = (screen: ScreenState) => {
    setScreenStack((prev) => [...prev, screen]);
  };

  const [lastBackPressTime, setLastBackPressTime] = useState<number>(0);

  const handleSystemBack = (): boolean => {
    // 1. If screen stack has sub-screens, navigate back 1 page
    if (screenStack.length > 1) {
      setScreenStack((prev) => {
        const nextStack = [...prev];
        nextStack.pop();
        return nextStack;
      });
      return true;
    }

    // 2. If single item on a non-dashboard tab, navigate back to Dashboard
    if (currentScreen.name !== 'DASHBOARD') {
      setScreenStack([{ name: 'DASHBOARD' }]);
      return true;
    }

    // 3. On Dashboard: 2-step back button to exit
    const now = Date.now();
    if (now - lastBackPressTime < 2000) {
      showToast('Exiting MSbook...');
      return false;
    } else {
      setLastBackPressTime(now);
      showToast('Press back again to exit');
      return true;
    }
  };

  useEffect(() => {
    (window as any).handleAndroidBack = () => {
      return handleSystemBack();
    };

    const onPop = (e: PopStateEvent) => {
      e.preventDefault();
      handleSystemBack();
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPop);

    return () => {
      delete (window as any).handleAndroidBack;
      window.removeEventListener('popstate', onPop);
    };
  }, [screenStack, currentScreen, lastBackPressTime]);

  // Switch between primary bottom tabs (Dashboard, Vouchers, Ledgers, Inventory, Reports)
  const handleSelectBottomTab = (tab: BottomTabKey) => {
    const targetScreen: ScreenState = { name: tab };

    // If currently on one of the main tabs, replace top of stack or reset to target
    setScreenStack((prev) => {
      // Find if we are currently on a sub-screen like VoucherDetail
      const isRootTab = ['DASHBOARD', 'VOUCHERS', 'INVENTORY', 'REPORTS'].includes(
        prev[prev.length - 1].name
      );

      if (isRootTab) {
        // If switching to Dashboard from another tab, pop back to Dashboard root
        if (tab === 'DASHBOARD') {
          return [{ name: 'DASHBOARD' }];
        }
        return [{ name: 'DASHBOARD' }, targetScreen];
      } else {
        // Navigate from deep screen back to main tab
        return [{ name: 'DASHBOARD' }, targetScreen];
      }
    });
  };

  const isMainTab = ['DASHBOARD', 'VOUCHERS', 'INVENTORY', 'REPORTS'].includes(
    currentScreen.name
  );

  const currentBottomTab: BottomTabKey = (
    isMainTab ? currentScreen.name : 'DASHBOARD'
  ) as BottomTabKey;

  const handleColdRestart = () => {
    showToast('Simulating Android Cold Start...');
    const all = db.getAllBusinesses();
    if (all.length > 0) {
      db.ensureActiveBusiness();
      setScreenStack([{ name: 'DASHBOARD' }]);
    } else {
      setScreenStack([{ name: 'BUSINESS_SELECT', isAddingAdditional: false }]);
    }
    refreshFromDb();
  };

  const handleClearData = () => {
    db.clearAllData();
    showToast('Database reset to fresh first-launch state');
  };

  return (
    <div className="w-full h-full min-h-[100dvh] max-h-[100dvh] bg-[#F8FAF8] flex flex-col font-sans overflow-hidden">
      {/* Top AI Studio Developer Control Bar (Hidden on Mobile/App View) */}
      <header className="hidden md:flex h-12 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 items-center justify-between shrink-0 z-30 select-none text-white">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded-lg bg-[#0F4D32] text-white font-black text-xs flex items-center justify-center shadow-xs">
            MS
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-xs tracking-tight">MSbook</span>
              <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Kirana Suite
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Settings Shortcut Button */}
          <button
            onClick={() => navigateTo({ name: 'SETTINGS' })}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700 shadow-xs"
            title="Open Settings, Backup & Restore"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Reset DB */}
          <button
            onClick={handleClearData}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-300 transition-colors border border-slate-700"
            title="Reset DB to Fresh First Launch"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Workspace: Direct full screen without mock phone frames */}
      <main className="flex-1 overflow-hidden bg-[#F8FAF8] flex flex-col relative w-full h-full">
        <AndroidFrame
          isFramed={false}
          onSystemBackPressed={handleSystemBack}
          canGoBack={screenStack.length > 1}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Screen Content Body */}
            <div className="flex-1 overflow-hidden relative">
              {currentScreen.name === 'BUSINESS_SELECT' && (
                <BusinessSelectScreen
                  canNavigateBack={Boolean(currentScreen.isAddingAdditional && screenStack.length > 1)}
                  onNavigateBack={handleSystemBack}
                  onBusinessSelected={(type) => {
                    navigateTo({ name: 'BUSINESS_DETAILS', businessType: type });
                  }}
                />
              )}

              {currentScreen.name === 'BUSINESS_DETAILS' && (
                <BusinessDetailsScreen
                  businessType={currentScreen.businessType}
                  onNavigateBack={handleSystemBack}
                  onBusinessCreated={() => {
                    setScreenStack([{ name: 'DASHBOARD' }]);
                    refreshFromDb();
                  }}
                />
              )}

              {currentScreen.name === 'DASHBOARD' && (
                activeBusiness ? (
                  <DashboardScreen
                    activeBusiness={activeBusiness}
                    onNavigateToSwitcher={() => {
                      navigateTo({ name: 'BUSINESS_SWITCHER' });
                    }}
                    onNavigateToAddBusiness={() => {
                      navigateTo({ name: 'BUSINESS_SELECT', isAddingAdditional: true });
                    }}
                    onNavigateToSales={() => {
                      navigateTo({ name: 'SALES_VOUCHER' });
                    }}
                    onNavigateToPurchase={() => {
                      navigateTo({ name: 'PURCHASE_VOUCHER' });
                    }}
                    onNavigateToReceipt={() => {
                      navigateTo({ name: 'RECEIPT_VOUCHER' });
                    }}
                    onNavigateToPayment={() => {
                      navigateTo({ name: 'PAYMENT_VOUCHER' });
                    }}
                    onNavigateToInventory={() => {
                      handleSelectBottomTab('INVENTORY');
                    }}
                    onNavigateToSettings={() => {
                      navigateTo({ name: 'SETTINGS' });
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <p className="text-sm text-slate-500 mb-4">No active business found.</p>
                    <button
                      onClick={() =>
                        setScreenStack([{ name: 'BUSINESS_SELECT', isAddingAdditional: false }])
                      }
                      className="px-4 py-2 bg-[#0F4D32] text-white rounded-xl text-sm font-semibold"
                    >
                      Create Business
                    </button>
                  </div>
                )
              )}

              {currentScreen.name === 'VOUCHERS' && activeBusiness && (
                <VoucherScreen
                  activeBusiness={activeBusiness}
                  onNavigateToVoucher={(voucherType: VoucherType) => {
                    if (voucherType === 'SALES') {
                      navigateTo({ name: 'SALES_VOUCHER' });
                    } else if (voucherType === 'SPLIT_PAYMENT') {
                      navigateTo({ name: 'SPLIT_PAYMENT' });
                    } else if (voucherType === 'RECEIPT') {
                      navigateTo({ name: 'RECEIPT_VOUCHER' });
                    } else if (voucherType === 'PURCHASE') {
                      navigateTo({ name: 'PURCHASE_VOUCHER' });
                    } else if (voucherType === 'PAYMENT') {
                      navigateTo({ name: 'PAYMENT_VOUCHER' });
                    } else {
                      navigateTo({ name: 'VOUCHER_DETAIL', voucherType });
                    }
                  }}
                  onNavigateToCustomerLedger={() => {
                    navigateTo({ name: 'LEDGERS' });
                  }}
                />
              )}

              {currentScreen.name === 'SALES_VOUCHER' && activeBusiness && (
                <SalesVoucherScreen
                  activeBusiness={activeBusiness}
                  onNavigateBack={handleSystemBack}
                  onSalesSaved={() => {
                    showToast('Sales Voucher & Journal entries recorded successfully!');
                    handleSystemBack();
                  }}
                />
              )}

              {currentScreen.name === 'SPLIT_PAYMENT' && activeBusiness && (
                <SalesVoucherScreen
                  activeBusiness={activeBusiness}
                  isSplitPaymentHighlight={true}
                  onNavigateBack={handleSystemBack}
                  onSalesSaved={() => {
                    showToast('Split Payment Voucher & Journal entries recorded!');
                    handleSystemBack();
                  }}
                />
              )}

              {currentScreen.name === 'RECEIPT_VOUCHER' && activeBusiness && (
                <ReceiptVoucherScreen
                  activeBusiness={activeBusiness}
                  preSelectedCustomerId={currentScreen.preSelectedCustomerId}
                  onNavigateBack={handleSystemBack}
                  onReceiptSaved={() => {
                    showToast('Receipt recorded & Customer ledger updated!');
                    handleSystemBack();
                  }}
                />
              )}

              {currentScreen.name === 'PURCHASE_VOUCHER' && activeBusiness && (
                <PurchaseVoucherScreen
                  activeBusiness={activeBusiness}
                  preSelectedSupplierId={currentScreen.preSelectedSupplierId}
                  onNavigateBack={handleSystemBack}
                  onPurchaseSaved={() => {
                    showToast('Purchase recorded & stock updated!');
                    handleSystemBack();
                  }}
                />
              )}

              {currentScreen.name === 'PAYMENT_VOUCHER' && activeBusiness && (
                <PaymentVoucherScreen
                  activeBusiness={activeBusiness}
                  preSelectedSupplierId={currentScreen.preSelectedSupplierId}
                  onNavigateBack={handleSystemBack}
                  onPaymentSaved={() => {
                    showToast('Payment recorded & Supplier ledger updated!');
                    handleSystemBack();
                  }}
                />
              )}

              {currentScreen.name === 'CUSTOMER_LEDGER' && activeBusiness && (
                <CustomerLedgerScreen
                  activeBusiness={activeBusiness}
                  initialCustomerId={currentScreen.customerId}
                  onNavigateBack={handleSystemBack}
                  onNavigateToReceipt={(cid) => {
                    navigateTo({ name: 'RECEIPT_VOUCHER', preSelectedCustomerId: cid });
                  }}
                />
              )}

              {currentScreen.name === 'SUPPLIER_LEDGER' && activeBusiness && (
                <SupplierLedgerScreen
                  activeBusiness={activeBusiness}
                  initialSupplierId={currentScreen.supplierId}
                  onNavigateBack={handleSystemBack}
                  onNavigateToPayment={(sid) => {
                    navigateTo({ name: 'PAYMENT_VOUCHER', preSelectedSupplierId: sid });
                  }}
                  onNavigateToPurchase={(sid) => {
                    navigateTo({ name: 'PURCHASE_VOUCHER', preSelectedSupplierId: sid });
                  }}
                />
              )}

              {currentScreen.name === 'ACCOUNT_LEDGER' && activeBusiness && (
                <AccountLedgerScreen
                  activeBusiness={activeBusiness}
                  initialAccountName={currentScreen.accountName}
                  onNavigateBack={handleSystemBack}
                />
              )}

              {currentScreen.name === 'VOUCHER_DETAIL' && activeBusiness && (
                <VoucherDetailPlaceholderScreen
                  voucherType={currentScreen.voucherType}
                  activeBusiness={activeBusiness}
                  onNavigateBack={handleSystemBack}
                  onVoucherSaved={() => {
                    showToast(`${currentScreen.voucherType} recorded and ledger updated!`);
                    handleSystemBack();
                  }}
                />
              )}

              {currentScreen.name === 'LEDGERS' && activeBusiness && (
                <LedgersHubScreen
                  activeBusiness={activeBusiness}
                  onNavigateBack={() => handleSelectBottomTab('DASHBOARD')}
                  onNavigateToReceipt={(cid) => {
                    navigateTo({ name: 'RECEIPT_VOUCHER', preSelectedCustomerId: cid });
                  }}
                  onNavigateToPayment={(sid) => {
                    navigateTo({ name: 'PAYMENT_VOUCHER', preSelectedSupplierId: sid });
                  }}
                  onNavigateToPurchase={(sid) => {
                    navigateTo({ name: 'PURCHASE_VOUCHER', preSelectedSupplierId: sid });
                  }}
                />
              )}

              {currentScreen.name === 'INVENTORY' && activeBusiness && (
                <InventoryScreen
                  activeBusiness={activeBusiness}
                  initialProductId={currentScreen.selectedProductId}
                  initialTab={currentScreen.initialTab}
                  onNavigateBack={() => handleSelectBottomTab('DASHBOARD')}
                  onNavigateToSale={() => {
                    navigateTo({ name: 'SALES_VOUCHER' });
                  }}
                  onNavigateToPurchase={() => {
                    navigateTo({ name: 'PURCHASE_VOUCHER' });
                  }}
                />
              )}

              {currentScreen.name === 'REPORTS' && activeBusiness && (
                <ReportsScreen
                  activeBusiness={activeBusiness}
                  initialReportType={currentScreen.selectedReport}
                  onNavigateBack={() => handleSelectBottomTab('DASHBOARD')}
                  onNavigateToCustomerLedger={(cid) => {
                    navigateTo({ name: 'CUSTOMER_LEDGER', customerId: cid });
                  }}
                  onNavigateToSupplierLedger={(sid) => {
                    navigateTo({ name: 'SUPPLIER_LEDGER', supplierId: sid });
                  }}
                  onNavigateToPurchase={() => {
                    navigateTo({ name: 'PURCHASE_VOUCHER' });
                  }}
                  onNavigateToReceipt={(cid) => {
                    navigateTo({ name: 'RECEIPT_VOUCHER', preSelectedCustomerId: cid });
                  }}
                  onNavigateToPayment={(sid) => {
                    navigateTo({ name: 'PAYMENT_VOUCHER', preSelectedSupplierId: sid });
                  }}
                />
              )}

              {currentScreen.name === 'BUSINESS_SWITCHER' && (
                <BusinessSwitchScreen
                  businesses={businesses}
                  activeBusinessId={activeBusinessId}
                  onNavigateBack={handleSystemBack}
                  onBusinessSwitched={() => {
                    handleSystemBack();
                  }}
                  onNavigateToAddBusiness={() => {
                    navigateTo({ name: 'BUSINESS_SELECT', isAddingAdditional: true });
                  }}
                />
              )}

              {currentScreen.name === 'SETTINGS' && activeBusiness && (
                <SettingsScreen
                  activeBusiness={activeBusiness}
                  initialSubSection={currentScreen.initialSubSection}
                  onNavigateBack={handleSystemBack}
                  onNavigateToSwitcher={() => {
                    navigateTo({ name: 'BUSINESS_SWITCHER' });
                  }}
                  onNavigateToAddBusiness={() => {
                    navigateTo({ name: 'BUSINESS_SELECT', isAddingAdditional: true });
                  }}
                />
              )}
            </div>

            {/* Bottom Navigation Bar: visible on the 5 root tabs */}
            {isMainTab && (
              <BottomNav
                currentTab={currentBottomTab}
                onSelectTab={handleSelectBottomTab}
              />
            )}
          </div>
        </AndroidFrame>

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs px-4 py-2.5 rounded-full shadow-lg border border-slate-700 flex items-center space-x-2 animate-fade-in pointer-events-none">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </main>

      {/* Verification Test Suite Modal */}
      <TestSuiteModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onTestComplete={() => {
          refreshFromDb();
        }}
      />

      {/* Android Studio Project Explorer & ZIP Download Modal */}
      <CodeViewerModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* Animated Welcome Splash on App Startup */}
      {showWelcomeSplash && (
        <WelcomeSplashScreen
          durationMs={2500}
          onFinish={() => setShowWelcomeSplash(false)}
        />
      )}
    </div>
  );
}
