package com.msbook.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Assessment
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.MenuBook
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.msbook.app.data.repository.AccountingRepository
import com.msbook.app.data.repository.BusinessRepository
import com.msbook.app.domain.model.BusinessType
import com.msbook.app.domain.model.VoucherType
import com.msbook.app.ui.screens.business_details.BusinessDetailsScreen
import com.msbook.app.ui.screens.business_details.BusinessDetailsViewModel
import com.msbook.app.ui.screens.business_select.BusinessSelectScreen
import com.msbook.app.ui.screens.business_switcher.BusinessSwitchScreen
import com.msbook.app.ui.screens.business_switcher.BusinessSwitchViewModel
import com.msbook.app.ui.screens.dashboard.DashboardScreen
import com.msbook.app.ui.screens.dashboard.DashboardViewModel
import com.msbook.app.ui.screens.inventory.InventoryScreen
import com.msbook.app.ui.screens.ledger.CustomerLedgerScreen
import com.msbook.app.ui.screens.placeholders.SimplePlaceholderScreen
import com.msbook.app.ui.screens.purchase.PurchaseVoucherScreen
import com.msbook.app.ui.screens.receipt.ReceiptVoucherScreen
import com.msbook.app.ui.screens.reports.ReportsScreen
import com.msbook.app.ui.screens.sales.SalesVoucherScreen
import com.msbook.app.ui.screens.vouchers.VoucherDetailScreen
import com.msbook.app.ui.screens.vouchers.VoucherScreen

/**
 * Root Navigation Graph for MSbook.
 * Strictly implements full-screen destinations with no popups or dialogs.
 * Leverages native backstack handling and bottom tab routing.
 */
@Composable
fun MSBookNavGraph(
    navController: NavHostController,
    startDestination: String,
    repository: BusinessRepository,
    accountingRepository: AccountingRepository
) {
    val activeBusiness by repository.activeBusinessFlow.collectAsStateWithLifecycle(initialValue = null)
    val activeBizName = activeBusiness?.businessName ?: "MSbook"
    val activeBizId = activeBusiness?.id ?: ""
    val activeBizType = activeBusiness?.businessType ?: BusinessType.KIRANA

    fun navigateToTab(targetRoute: String) {
        navController.navigate(targetRoute) {
            popUpTo(Screen.Dashboard.route) {
                saveState = true
            }
            launchSingleTop = true
            restoreState = true
        }
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // 1. Choose Your Business (First launch or Add Additional)
        composable(
            route = Screen.BusinessSelect.route,
            arguments = listOf(
                navArgument("isAddingAdditional") {
                    type = NavType.BoolType
                    defaultValue = false
                }
            )
        ) { backStackEntry ->
            val isAddingAdditional = backStackEntry.arguments?.getBoolean("isAddingAdditional") ?: false

            BusinessSelectScreen(
                canNavigateBack = isAddingAdditional && navController.previousBackStackEntry != null,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onBusinessSelected = { selectedType ->
                    navController.navigate(Screen.BusinessDetails.createRoute(selectedType.name))
                }
            )
        }

        // 2. Business Details (Mandatory name, optional owner/phone/address)
        composable(
            route = Screen.BusinessDetails.route,
            arguments = listOf(
                navArgument("businessType") {
                    type = NavType.StringType
                    defaultValue = BusinessType.KIRANA.name
                }
            )
        ) { backStackEntry ->
            val businessTypeStr = backStackEntry.arguments?.getString("businessType") ?: BusinessType.KIRANA.name
            val businessType = BusinessType.fromString(businessTypeStr)

            val detailsViewModel: BusinessDetailsViewModel = viewModel(
                factory = BusinessDetailsViewModel.Factory(repository, businessType)
            )

            BusinessDetailsScreen(
                viewModel = detailsViewModel,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onBusinessCreated = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        // 3. Main Business Dashboard
        composable(route = Screen.Dashboard.route) {
            val dashboardViewModel: DashboardViewModel = viewModel(
                factory = DashboardViewModel.Factory(repository)
            )

            DashboardScreen(
                viewModel = dashboardViewModel,
                onNavigateToSwitcher = {
                    navController.navigate(Screen.BusinessSwitcher.route)
                },
                onNavigateToAddBusiness = {
                    navController.navigate(Screen.BusinessSelect.createRoute(isAddingAdditional = true))
                },
                onBottomNavTabSelected = { targetRoute ->
                    navigateToTab(targetRoute)
                }
            )
        }

        // 4. Voucher Screen Hub (Step 2)
        composable(route = Screen.Vouchers.route) {
            VoucherScreen(
                activeBusinessName = activeBizName,
                onNavigateToVoucher = { voucherType ->
                    when (voucherType) {
                        VoucherType.SALES -> navController.navigate(Screen.SalesVoucher.route)
                        VoucherType.SPLIT_PAYMENT -> navController.navigate(Screen.SplitPayment.route)
                        VoucherType.RECEIPT -> navController.navigate(Screen.ReceiptVoucher.route)
                        VoucherType.PURCHASE -> navController.navigate(Screen.PurchaseVoucher.route)
                        else -> navController.navigate(Screen.VoucherDetail.createRoute(voucherType.name))
                    }
                },
                onNavigateToCustomerLedger = {
                    navController.navigate(Screen.CustomerLedger.createRoute())
                },
                onBottomNavTabSelected = { targetRoute ->
                    navigateToTab(targetRoute)
                }
            )
        }

        // 5. Full-Screen Sales Voucher (Complete form & split payment)
        composable(route = Screen.SalesVoucher.route) {
            SalesVoucherScreen(
                businessId = activeBizId,
                businessType = activeBizType,
                accountingRepository = accountingRepository,
                onNavigateBack = { navController.popBackStack() },
                onSalesSaved = { navController.popBackStack() }
            )
        }

        // 5b. Dedicated Split Payment option
        composable(route = Screen.SplitPayment.route) {
            SalesVoucherScreen(
                businessId = activeBizId,
                businessType = activeBizType,
                accountingRepository = accountingRepository,
                onNavigateBack = { navController.popBackStack() },
                onSalesSaved = { navController.popBackStack() }
            )
        }

        // 6. Full-Screen Receipt Voucher
        composable(route = Screen.ReceiptVoucher.route) {
            ReceiptVoucherScreen(
                businessId = activeBizId,
                accountingRepository = accountingRepository,
                onNavigateBack = { navController.popBackStack() },
                onReceiptSaved = { navController.popBackStack() }
            )
        }

        // 7. Full-Screen Purchase Voucher
        composable(route = Screen.PurchaseVoucher.route) {
            PurchaseVoucherScreen(
                businessId = activeBizId,
                accountingRepository = accountingRepository,
                onNavigateBack = { navController.popBackStack() },
                onPurchaseSaved = { navController.popBackStack() }
            )
        }

        // 8. Full-Screen Customer Ledger Statement
        composable(
            route = Screen.CustomerLedger.route,
            arguments = listOf(
                navArgument("customerId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val customerId = backStackEntry.arguments?.getString("customerId")

            CustomerLedgerScreen(
                businessId = activeBizId,
                initialCustomerId = customerId,
                accountingRepository = accountingRepository,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        // 9. Secondary Vouchers (Contra, Journal, Debit Note, Credit Note)
        composable(
            route = Screen.VoucherDetail.route,
            arguments = listOf(
                navArgument("voucherType") {
                    type = NavType.StringType
                    defaultValue = VoucherType.CONTRA.name
                }
            )
        ) { backStackEntry ->
            val voucherTypeStr = backStackEntry.arguments?.getString("voucherType") ?: VoucherType.CONTRA.name
            val voucherType = VoucherType.fromString(voucherTypeStr)

            VoucherDetailScreen(
                voucherType = voucherType,
                activeBusinessName = activeBizName,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        // 10. Secondary Bottom Navigation Placeholders
        composable(route = Screen.Ledgers.route) {
            CustomerLedgerScreen(
                businessId = activeBizId,
                accountingRepository = accountingRepository,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(route = Screen.Inventory.route) {
            InventoryScreen(
                businessId = activeBizId,
                activeBusinessName = activeBizName,
                accountingRepository = accountingRepository,
                onNavigateBack = { navController.popBackStack() },
                onBottomNavTabSelected = { navigateToTab(it) }
            )
        }

        composable(route = Screen.Reports.route) {
            ReportsScreen(
                businessId = activeBizId,
                activeBusinessName = activeBizName,
                accountingRepository = accountingRepository,
                onBottomNavTabSelected = { navigateToTab(it) }
            )
        }

        // 11. Multiple Business Switcher (Full-screen)
        composable(route = Screen.BusinessSwitcher.route) {
            val switchViewModel: BusinessSwitchViewModel = viewModel(
                factory = BusinessSwitchViewModel.Factory(repository)
            )

            BusinessSwitchScreen(
                viewModel = switchViewModel,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onBusinessSwitched = {
                    navController.popBackStack()
                },
                onNavigateToAddBusiness = {
                    navController.navigate(Screen.BusinessSelect.createRoute(isAddingAdditional = true))
                }
            )
        }
    }
}
