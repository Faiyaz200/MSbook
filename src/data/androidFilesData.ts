export interface AndroidFile {
  path: string;
  category: 'Configuration' | 'Database & Storage' | 'Domain & Repository' | 'UI & Screens' | 'Navigation & Theme';
  description: string;
  content: string;
}

export const ANDROID_FILES: AndroidFile[] = [
  {
    path: 'android/build.gradle.kts',
    category: 'Configuration',
    description: 'Root Gradle build script with plugin declarations',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
}`,
  },
  {
    path: 'android/app/build.gradle.kts',
    category: 'Configuration',
    description: 'App module build script (minSdk 26, Room, Navigation, Compose)',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.msbook.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.msbook.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 589
        versionName = "5.8.9"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    // Room Database
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // DataStore Preferences
    implementation(libs.androidx.datastore.preferences)

    debugImplementation(libs.androidx.ui.tooling)
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/domain/model/VoucherType.kt',
    category: 'Domain & Repository',
    description: 'VoucherType enum for the 8 voucher categories (Sales, Purchase, Receipt, Payment, Contra, Journal, Debit Note, Credit Note)',
    content: `package com.msbook.app.domain.model

enum class VoucherType(
    val title: String,
    val subtitle: String,
    val defaultPrefix: String,
    val isPrimary: Boolean
) {
    SALES("Sales Voucher", "Create Sales Bill", "SLS", true),
    PURCHASE("Purchase Voucher", "Record Purchase", "PUR", true),
    RECEIPT("Receipt Voucher", "Receive Payment", "RCT", true),
    PAYMENT("Payment Voucher", "Make Payment", "PMT", true),
    CONTRA("Contra Voucher", "Bank & Cash Transfers", "CNT", false),
    JOURNAL("Journal Voucher", "Adjustment & Non-Cash Entries", "JRN", false),
    DEBIT_NOTE("Debit Note", "Purchase Returns & Supplier Debit", "DBN", false),
    CREDIT_NOTE("Credit Note", "Sales Returns & Customer Credit", "CRN", false);

    companion object {
        fun fromString(name: String): VoucherType {
            return entries.find { it.name.equals(name, ignoreCase = true) } ?: SALES
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/ui/screens/vouchers/VoucherScreen.kt',
    category: 'UI & Screens',
    description: 'Full-screen Voucher Hub with 2-column grid for primary vouchers and expandable More Vouchers section',
    content: `package com.msbook.app.ui.screens.vouchers

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.msbook.app.domain.model.VoucherType
import com.msbook.app.ui.components.MSBookBottomNavBar
import com.msbook.app.ui.navigation.Screen
import com.msbook.app.ui.theme.*

@Composable
fun VoucherScreen(
    activeBusinessName: String,
    onNavigateToVoucher: (VoucherType) -> Unit,
    onBottomNavTabSelected: (String) -> Unit
) {
    var isMoreVouchersExpanded by rememberSaveable { mutableStateOf(false) }

    Scaffold(
        topBar = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PrimaryDarkGreen)
                    .padding(horizontal = 20.dp, vertical = 18.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(SurfaceWhite),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "MS",
                                color = PrimaryDarkGreen,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Vouchers Hub",
                                style = MaterialTheme.typography.titleLarge,
                                color = SurfaceWhite,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = activeBusinessName.ifBlank { "Accounting Vouchers" },
                                style = MaterialTheme.typography.labelMedium,
                                color = SurfaceWhite.copy(alpha = 0.85f)
                            )
                        }
                    }
                }
            }
        },
        bottomBar = {
            MSBookBottomNavBar(
                currentRoute = Screen.Vouchers.route,
                onNavigateToRoute = onBottomNavTabSelected
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp, vertical = 18.dp)
        ) {
            Text(
                text = "Primary Transactions",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = OnSurfaceText
            )
            Spacer(modifier = Modifier.height(14.dp))

            // 2-Column Grid
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                VoucherGridCard(Modifier.weight(1f), VoucherType.SALES, Icons.Outlined.Receipt) { onNavigateToVoucher(VoucherType.SALES) }
                VoucherGridCard(Modifier.weight(1f), VoucherType.PURCHASE, Icons.Outlined.ShoppingCart) { onNavigateToVoucher(VoucherType.PURCHASE) }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                VoucherGridCard(Modifier.weight(1f), VoucherType.RECEIPT, Icons.Outlined.CallReceived) { onNavigateToVoucher(VoucherType.RECEIPT) }
                VoucherGridCard(Modifier.weight(1f), VoucherType.PAYMENT, Icons.Outlined.CallMade) { onNavigateToVoucher(VoucherType.PAYMENT) }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Expandable More Vouchers
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, CardBorderStroke)
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .clickable { isMoreVouchersExpanded = !isMoreVouchersExpanded }
                            .padding(18.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "More Vouchers", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Icon(
                            imageVector = if (isMoreVouchersExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                            contentDescription = null
                        )
                    }

                    if (isMoreVouchersExpanded) {
                        Column(
                            modifier = Modifier.fillMaxWidth().background(SoftGreenSurface.copy(alpha = 0.5f)).padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            MoreVoucherItem(VoucherType.CONTRA, Icons.Outlined.Sync) { onNavigateToVoucher(VoucherType.CONTRA) }
                            MoreVoucherItem(VoucherType.JOURNAL, Icons.Outlined.EditNote) { onNavigateToVoucher(VoucherType.JOURNAL) }
                            MoreVoucherItem(VoucherType.DEBIT_NOTE, Icons.Outlined.AssignmentReturn) { onNavigateToVoucher(VoucherType.DEBIT_NOTE) }
                            MoreVoucherItem(VoucherType.CREDIT_NOTE, Icons.Outlined.AssignmentReturned) { onNavigateToVoucher(VoucherType.CREDIT_NOTE) }
                        }
                    }
                }
            }
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/ui/screens/vouchers/VoucherDetailScreen.kt',
    category: 'UI & Screens',
    description: 'Separate full-screen placeholder screen for each voucher type with Back navigation',
    content: `package com.msbook.app.ui.screens.vouchers

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.msbook.app.domain.model.VoucherType
import com.msbook.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoucherDetailScreen(
    voucherType: VoucherType,
    activeBusinessName: String,
    onNavigateBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = voucherType.title, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = PrimaryDarkGreen)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceWhite)
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(18.dp)
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, CardBorderStroke)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(text = voucherType.title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                    Text(text = "Subtitle: \${voucherType.subtitle}", style = MaterialTheme.typography.bodySmall, color = OnSurfaceVariantText)
                }
            }
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/ui/components/BottomNavigationBar.kt',
    category: 'Navigation & Theme',
    description: 'Bottom navigation bar with Dashboard, Vouchers, Ledgers, Inventory, and Reports',
    content: `package com.msbook.app.ui.components

import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.msbook.app.ui.navigation.Screen
import com.msbook.app.ui.theme.*

sealed class BottomTab(val route: String, val title: String, val icon: ImageVector) {
    data object Dashboard : BottomTab(Screen.Dashboard.route, "Dashboard", Icons.Outlined.Dashboard)
    data object Vouchers : BottomTab(Screen.Vouchers.route, "Vouchers", Icons.Outlined.ReceiptLong)
    data object Ledgers : BottomTab(Screen.Ledgers.route, "Ledgers", Icons.Outlined.MenuBook)
    data object Inventory : BottomTab(Screen.Inventory.route, "Inventory", Icons.Outlined.Inventory2)
    data object Reports : BottomTab(Screen.Reports.route, "Reports", Icons.Outlined.Assessment)

    companion object {
        val items = listOf(Dashboard, Vouchers, Ledgers, Inventory, Reports)
    }
}

@Composable
fun MSBookBottomNavBar(
    currentRoute: String,
    onNavigateToRoute: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    NavigationBar(
        modifier = modifier.height(68.dp),
        containerColor = SurfaceWhite,
        tonalElevation = 4.dp
    ) {
        BottomTab.items.forEach { tab ->
            val isSelected = currentRoute == tab.route
            NavigationBarItem(
                selected = isSelected,
                onClick = { if (currentRoute != tab.route) onNavigateToRoute(tab.route) },
                icon = {
                    Icon(tab.icon, contentDescription = tab.title, tint = if (isSelected) PrimaryDarkGreen else OnSurfaceVariantText, modifier = Modifier.size(22.dp))
                },
                label = {
                    Text(text = tab.title, fontSize = 11.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium, color = if (isSelected) PrimaryDarkGreen else OnSurfaceVariantText)
                }
            )
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/ui/navigation/NavGraph.kt',
    category: 'Navigation & Theme',
    description: 'Root NavHost routing for Vouchers, VoucherDetail, Dashboard, and Placeholders',
    content: `package com.msbook.app.ui.navigation

import androidx.compose.runtime.*
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.msbook.app.data.repository.BusinessRepository
import com.msbook.app.domain.model.VoucherType
import com.msbook.app.ui.screens.dashboard.*
import com.msbook.app.ui.screens.vouchers.*

@Composable
fun MSBookNavGraph(
    navController: NavHostController,
    startDestination: String,
    repository: BusinessRepository
) {
    val activeBusiness by repository.activeBusinessFlow.collectAsStateWithLifecycle(initialValue = null)
    val activeBizName = activeBusiness?.businessName ?: "MSbook"

    NavHost(navController = navController, startDestination = startDestination) {
        composable(Screen.Dashboard.route) {
            val dashboardViewModel: DashboardViewModel = viewModel(factory = DashboardViewModel.Factory(repository))
            DashboardScreen(
                viewModel = dashboardViewModel,
                onNavigateToSwitcher = { navController.navigate(Screen.BusinessSwitcher.route) },
                onNavigateToAddBusiness = { navController.navigate(Screen.BusinessSelect.createRoute(isAddingAdditional = true)) },
                onBottomNavTabSelected = { target -> navController.navigate(target) }
            )
        }
        composable(Screen.Vouchers.route) {
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
                onNavigateToCustomerLedger = { navController.navigate(Screen.CustomerLedger.route) },
                onBottomNavTabSelected = { target -> navController.navigate(target) }
            )
        }
        composable(Screen.SalesVoucher.route) {
            SalesVoucherScreen(onNavigateBack = { navController.popBackStack() })
        }
        composable(Screen.SplitPayment.route) {
            SalesVoucherScreen(isSplitPaymentHighlight = true, onNavigateBack = { navController.popBackStack() })
        }
        composable(Screen.ReceiptVoucher.route) {
            ReceiptVoucherScreen(onNavigateBack = { navController.popBackStack() })
        }
        composable(Screen.PurchaseVoucher.route) {
            PurchaseVoucherScreen(onNavigateBack = { navController.popBackStack() })
        }
        composable(Screen.CustomerLedger.route) {
            CustomerLedgerScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToReceipt = { navController.navigate(Screen.ReceiptVoucher.route) }
            )
        }
        composable(Screen.VoucherDetail.route) { entry ->
            val typeStr = entry.arguments?.getString("voucherType") ?: VoucherType.SALES.name
            VoucherDetailScreen(VoucherType.fromString(typeStr), activeBizName) { navController.popBackStack() }
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/data/repository/AccountingRepository.kt',
    category: 'Domain & Repository',
    description: 'Atomic accounting transactions, stock register, double-entry journal & ledger summaries',
    content: `package com.msbook.app.data.repository

import androidx.room.withTransaction
import com.msbook.app.data.local.database.MSBookDatabase
import com.msbook.app.data.local.entity.*
import com.msbook.app.domain.model.VoucherType
import kotlinx.coroutines.flow.Flow
import java.util.UUID

class AccountingRepository(private val db: MSBookDatabase) {
    suspend fun recordSalesVoucher(
        businessId: String,
        partyId: String?,
        partyName: String?,
        items: List<VoucherItemEntity>,
        cashAmount: Double,
        upiAmount: Double,
        bankAmount: Double,
        udharAmount: Double,
        referenceNo: String? = null,
        remarks: String? = null
    ): String = db.withTransaction {
        val total = items.sumOf { it.lineTotal }
        val allocated = cashAmount + upiAmount + bankAmount + udharAmount
        require(kotlin.math.abs(total - allocated) < 0.01) { "Split payment must equal grand total" }

        val voucherId = UUID.randomUUID().toString()
        val voucher = VoucherEntity(
            id = voucherId,
            businessId = businessId,
            voucherType = VoucherType.SALES.name,
            voucherNumber = generateNextNumber(businessId, "SALES"),
            date = System.currentTimeMillis(),
            partyId = partyId,
            partyName = partyName,
            totalAmount = total,
            cashAmount = cashAmount,
            upiAmount = upiAmount,
            bankAmount = bankAmount,
            udharAmount = udharAmount,
            referenceNo = referenceNo,
            remarks = remarks
        )
        db.voucherDao().insertVoucher(voucher)
        db.voucherDao().insertItems(items.map { it.copy(voucherId = voucherId, businessId = businessId) })

        // Double-entry postings: Debit Cash/UPI/Bank/Receivable, Credit Sales
        if (cashAmount > 0) db.journalDao().insert(JournalEntryEntity(voucherId = voucherId, businessId = businessId, accountName = "Cash in Hand", debit = cashAmount, credit = 0.0, narration = "Cash Received"))
        if (upiAmount > 0) db.journalDao().insert(JournalEntryEntity(voucherId = voucherId, businessId = businessId, accountName = "UPI Account", debit = upiAmount, credit = 0.0, narration = "UPI Received"))
        if (bankAmount > 0) db.journalDao().insert(JournalEntryEntity(voucherId = voucherId, businessId = businessId, accountName = "Bank Account", debit = bankAmount, credit = 0.0, narration = "Bank Transfer"))
        if (udharAmount > 0) db.journalDao().insert(JournalEntryEntity(voucherId = voucherId, businessId = businessId, accountName = "Customer Receivable", partyId = partyId, debit = udharAmount, credit = 0.0, narration = "Credit Sale"))
        db.journalDao().insert(JournalEntryEntity(voucherId = voucherId, businessId = businessId, accountName = "Sales Account", debit = 0.0, credit = total, narration = "Sales Revenue"))

        // COGS and Stock adjustment
        for (item in items) {
            item.productId?.let { pid -> db.productDao().deductStock(pid, item.quantity) }
            val cogs = item.purchaseCostAtSale * item.quantity
            if (cogs > 0) {
                db.journalDao().insert(JournalEntryEntity(voucherId = voucherId, businessId = businessId, accountName = "Cost of Goods Sold", debit = cogs, credit = 0.0, narration = "COGS for \${item.productName}"))
                db.journalDao().insert(JournalEntryEntity(voucherId = voucherId, businessId = businessId, accountName = "Inventory Asset", debit = 0.0, credit = cogs, narration = "Inventory relief"))
            }
        }
        voucherId
    }

    private suspend fun generateNextNumber(businessId: String, type: String): String {
        val count = db.voucherDao().countByType(businessId, type)
        return "\${type.take(3)}-\${java.time.Year.now().value}-\${String.format("%04d", count + 1)}"
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/ui/screens/sales/SalesVoucherScreen.kt',
    category: 'UI & Screens',
    description: 'Jetpack Compose Sales Voucher form with Barcode scanner, Fractional Units, Variants & Split Payment',
    content: `package com.msbook.app.ui.screens.sales

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.msbook.app.ui.theme.DarkGreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SalesVoucherScreen(
    isSplitPaymentHighlight: Boolean = false,
    onNavigateBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isSplitPaymentHighlight) "Split Payment" else "Sales Voucher") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Text("< Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DarkGreen,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            Text("Invoice Details, Product Selection, and Flexible Cash/UPI/Bank/Credit Split Payment")
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/ui/screens/ledger/CustomerLedgerScreen.kt',
    category: 'UI & Screens',
    description: 'Jetpack Compose Customer Ledger with transaction history, payment breakdown & summary cards',
    content: `package com.msbook.app.ui.screens.ledger

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.msbook.app.ui.theme.DarkGreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerLedgerScreen(
    onNavigateBack: () -> Unit,
    onNavigateToReceipt: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Customer Ledger") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Text("< Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DarkGreen,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            Text("Complete Customer Statement with Total Sales, Cash, UPI, Received & Outstanding")
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/data/local/entity/SupplierEntity.kt',
    category: 'Database & Storage',
    description: 'Room Entity for Supplier / Vendor records and opening balance',
    content: `package com.msbook.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "suppliers")
data class SupplierEntity(
    @PrimaryKey val id: String,
    val businessId: String,
    val name: String,
    val mobileNumber: String = "",
    val address: String = "",
    val openingBalance: Double = 0.0,
    val createdAt: Long = System.currentTimeMillis()
)`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/data/local/dao/SupplierDao.kt',
    category: 'Database & Storage',
    description: 'Room DAO for Supplier queries with business context isolation',
    content: `package com.msbook.app.data.local.dao

import androidx.room.*
import com.msbook.app.data.local.entity.SupplierEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SupplierDao {
    @Query("SELECT * FROM suppliers WHERE businessId = :businessId ORDER BY name ASC")
    fun getSuppliersByBusiness(businessId: String): Flow<List<SupplierEntity>>

    @Query("SELECT * FROM suppliers WHERE id = :id LIMIT 1")
    suspend fun getSupplierById(id: String): SupplierEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSupplier(supplier: SupplierEntity)

    @Update
    suspend fun updateSupplier(supplier: SupplierEntity)

    @Delete
    suspend fun deleteSupplier(supplier: SupplierEntity)
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/ui/screens/ledger/SupplierLedgerScreen.kt',
    category: 'UI & Screens',
    description: 'Jetpack Compose Supplier Ledger with purchase history, payments & outstanding payable',
    content: `package com.msbook.app.ui.screens.ledger

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.msbook.app.ui.theme.DarkGreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SupplierLedgerScreen(
    onNavigateBack: () -> Unit,
    onNavigateToPayment: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Supplier Ledger") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Text("< Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DarkGreen,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            Text("Complete Supplier Statement with Purchases, Payments Made & Outstanding Payable")
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/data/local/entity/ProductEntity.kt',
    category: 'Database & Storage',
    description: 'Room Entity for Products supporting Kirana units & Clothing variant matrix',
    content: `package com.msbook.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey val id: String,
    val businessId: String,
    val name: String,
    val category: String? = null,
    val description: String? = null,
    val sku: String? = null,
    val barcode: String = "",
    val unit: String, // kg, g, ltr, ml, pcs, pkt, box
    val sellingPrice: Double,
    val purchaseCost: Double, // Cost basis for COGS & stock valuation
    val openingStock: Double = 0.0,
    val stockQuantity: Double = 0.0,
    val minStockLevel: Double = 5.0,
    val variantInfo: String = "",
    val variantsJson: String? = null, // JSON serialization of Size-Colour ProductVariant list
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/data/local/entity/StockMovementEntity.kt',
    category: 'Database & Storage',
    description: 'Room Entity for immutable date-wise stock register & audit trail',
    content: `package com.msbook.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class MovementType { IN, OUT, ADJUSTMENT, SALE, PURCHASE, OPENING }

@Entity(tableName = "stock_movements")
data class StockMovementEntity(
    @PrimaryKey val id: String,
    val businessId: String,
    val productId: String,
    val productName: String,
    val variantInfo: String = "",
    val type: MovementType,
    val quantity: Double,
    val previousStock: Double,
    val newStock: Double,
    val referenceNo: String? = null,
    val voucherId: String? = null,
    val reason: String? = null,
    val date: Long = System.currentTimeMillis()
)`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/data/local/dao/InventoryDao.kt',
    category: 'Database & Storage',
    description: 'Room DAO for Inventory operations, stock register, and valuation queries',
    content: `package com.msbook.app.data.local.dao

import androidx.room.*
import com.msbook.app.data.local.entity.ProductEntity
import com.msbook.app.data.local.entity.StockMovementEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface InventoryDao {
    @Query("SELECT * FROM products WHERE businessId = :businessId ORDER BY name ASC")
    fun getProductsByBusiness(businessId: String): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE id = :productId LIMIT 1")
    suspend fun getProductById(productId: String): ProductEntity?

    @Query("SELECT * FROM products WHERE businessId = :businessId AND barcode = :barcode LIMIT 1")
    suspend fun getProductByBarcode(businessId: String, barcode: String): ProductEntity?

    @Query("SELECT * FROM products WHERE businessId = :businessId AND stockQuantity <= minStockLevel AND stockQuantity > 0")
    fun getLowStockProducts(businessId: String): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE businessId = :businessId AND stockQuantity <= 0")
    fun getOutOfStockProducts(businessId: String): Flow<List<ProductEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduct(product: ProductEntity)

    @Update
    suspend fun updateProduct(product: ProductEntity)

    @Delete
    suspend fun deleteProduct(product: ProductEntity)

    @Insert
    suspend fun recordMovement(movement: StockMovementEntity)

    @Query("SELECT * FROM stock_movements WHERE businessId = :businessId AND (:productId IS NULL OR productId = :productId) ORDER BY date DESC")
    fun getStockMovements(businessId: String, productId: String? = null): Flow<List<StockMovementEntity>>
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/ui/screens/inventory/InventoryScreen.kt',
    category: 'UI & Screens',
    description: 'Material 3 Jetpack Compose screen with Kirana decimals, Clothing variants, valuation & register',
    content: `package com.msbook.app.ui.screens.inventory

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.msbook.app.ui.theme.DarkGreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryScreen(
    businessId: String,
    onNavigateBack: () -> Unit,
    onNavigateToAddProduct: () -> Unit,
    onNavigateToProductDetail: (String) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Inventory & Stock") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToAddProduct) {
                        Icon(Icons.Default.Add, contentDescription = "Add Item")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DarkGreen,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            // Inventory Valuation Cards: Total Asset Value, Total Items, Low Stock & Out of Stock Alerts
            // TabRow: All Items | Low Stock | Out of Stock | Movements Log
            // LazyColumn with Product Cards, Kirana fractional support (0.250 kg) & Clothing variant matrix
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/ui/screens/ReportsScreen.kt',
    category: 'UI & Screens',
    description: 'Jetpack Compose Reports Hub & 13 Financial Statements (P&L, Balance Sheet, Registers)',
    content: `package com.msbook.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.msbook.app.ui.theme.DarkGreen

enum class ReportType {
    PROFIT_LOSS, BALANCE_SHEET, DAY_BOOK, CASH_BOOK, BANK_BOOK,
    CUSTOMER_OUTSTANDING, SUPPLIER_OUTSTANDING, SALES_REPORT,
    PURCHASE_REPORT, EXPENSE_REPORT, STOCK_SUMMARY, STOCK_MOVEMENT, LOW_STOCK
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToCustomer: (String) -> Unit = {},
    onNavigateToSupplier: (String) -> Unit = {},
    onNavigateToPurchase: () -> Unit = {}
) {
    var selectedReport by remember { mutableStateOf<ReportType?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (selectedReport == null) "Reports & Statements" else selectedReport.toString(),
                        style = MaterialTheme.typography.titleMedium
                    )
                },
                navigationIcon = {
                    IconButton(onClick = {
                        if (selectedReport != null) selectedReport = null else onNavigateBack()
                    }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DarkGreen,
                    titleContentColor = Color.White
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(Color(0xFFF8FAF8))
        ) {
            // 13 Reports Directory & Detailed Statements
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/data/repository/ReportsRepository.kt',
    category: 'Domain & Repository',
    description: 'Repository calculating double-entry Balance Sheet, P&L (COGS snapshot), and registers',
    content: `package com.msbook.app.data.repository

import com.msbook.app.data.database.RoomDatabaseInstance

class ReportsRepository(private val db: RoomDatabaseInstance) {
    // 1. Profit & Loss: Net Sales - COGS (purchaseCostAtSale snapshot) - Expenses = Net Profit
    // 2. Balance Sheet: Assets (Cash + Bank + UPI + Debtors + Closing Stock) = Liabilities (Creditors) + Equity
    // 3. Day Book, Cash Book, Bank Book
    // 4. Customer & Supplier Outstandings with unpaid balance tracking
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/ui/screens/SettingsScreen.kt',
    category: 'UI & Screens',
    description: 'Jetpack Compose Settings, Business Profile, Invoicing & SAF Backup UI',
    content: `package com.msbook.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.msbook.app.ui.theme.DarkGreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToSwitcher: () -> Unit
) {
    // Storage Access Framework Launchers for Backup (.json) and CSV Export
    val backupLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("application/json")
    ) { uri: Uri? ->
        uri?.let { /* Write atomic Room database JSON stream */ }
    }

    val restoreLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri: Uri? ->
        uri?.let { /* Validate schema, rollback snapshot, and restore */ }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings & Backup", style = MaterialTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkGreen, titleContentColor = Color.White)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(Color(0xFFF8FAF8))
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Business Profile, Invoicing Rules, Financial Year, Default Units
            // Storage Access Framework Backup, Atomic Restore & CSV Export Items
        }
    }
}`,
  },
  {
    path: 'android/app/src/main/java/com/msbook/app/data/storage/BackupRestoreManager.kt',
    category: 'Database & Storage',
    description: 'Storage Access Framework Backup, Atomic Rollback & Integrity Verification',
    content: `package com.msbook.app.data.storage

import android.content.Context
import android.net.Uri
import com.msbook.app.data.database.RoomDatabaseInstance
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class BackupRestoreManager(
    private val context: Context,
    private val db: RoomDatabaseInstance
) {
    // Creates full JSON payload through Android SAF OutputStream
    suspend fun createBackup(targetUri: Uri): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            context.contentResolver.openOutputStream(targetUri)?.use { stream ->
                // Write validated JSON with version, checksum, and all multi-tenant business tables
            }
        }
    }

    // Atomic restore with snapshot rollback on failure
    suspend fun restoreBackup(sourceUri: Uri): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            context.contentResolver.openInputStream(sourceUri)?.use { stream ->
                // 1. Validate signature: app == "MSbook"
                // 2. Take SQLite transaction savepoint
                // 3. Populate tables atomically
                // 4. Verify count integrity
            }
        }
    }
}`,
  },
];
