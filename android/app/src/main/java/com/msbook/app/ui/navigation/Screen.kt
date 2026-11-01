package com.msbook.app.ui.navigation

/**
 * Sealed class defining all full-screen destination routes in MSbook.
 * Every destination is a full-screen screen (no popups or dialogs).
 */
sealed class Screen(val route: String) {
    data object BusinessSelect : Screen("business_select?isAddingAdditional={isAddingAdditional}") {
        fun createRoute(isAddingAdditional: Boolean = false): String {
            return "business_select?isAddingAdditional=$isAddingAdditional"
        }
    }

    data object BusinessDetails : Screen("business_details/{businessType}") {
        fun createRoute(businessType: String): String {
            return "business_details/$businessType"
        }
    }

    // Main Navigation Tabs
    data object Dashboard : Screen("dashboard")
    data object Vouchers : Screen("vouchers")
    data object Ledgers : Screen("ledgers")
    data object Inventory : Screen("inventory")
    data object Reports : Screen("reports")

    // Full-screen Specialized Voucher Destinations (Step 2 Complete Accounting)
    data object SalesVoucher : Screen("sales_voucher")
    data object SplitPayment : Screen("split_payment")
    data object ReceiptVoucher : Screen("receipt_voucher")
    data object PurchaseVoucher : Screen("purchase_voucher")
    data object CustomerLedger : Screen("customer_ledger?customerId={customerId}") {
        fun createRoute(customerId: String? = null): String {
            return if (customerId != null) "customer_ledger?customerId=$customerId" else "customer_ledger"
        }
    }

    // Secondary Vouchers (Contra, Journal, Debit Note, Credit Note)
    data object VoucherDetail : Screen("voucher_detail/{voucherType}") {
        fun createRoute(voucherType: String): String {
            return "voucher_detail/$voucherType"
        }
    }

    data object BusinessSwitcher : Screen("business_switcher")
}
