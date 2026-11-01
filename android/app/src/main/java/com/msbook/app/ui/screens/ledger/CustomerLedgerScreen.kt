package com.msbook.app.ui.screens.ledger

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.msbook.app.data.local.entity.CustomerEntity
import com.msbook.app.data.repository.AccountingRepository
import com.msbook.app.data.repository.CustomerLedgerSummary
import com.msbook.app.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerLedgerScreen(
    businessId: String,
    initialCustomerId: String? = null,
    accountingRepository: AccountingRepository,
    onNavigateBack: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var customers by remember { mutableStateOf<List<CustomerEntity>>(emptyList()) }
    var selectedCustomer by remember { mutableStateOf<CustomerEntity?>(null) }
    var ledgerSummary by remember { mutableStateOf<CustomerLedgerSummary?>(null) }
    var isLoading by remember { mutableStateOf(false) }

    fun loadLedger(customerId: String) {
        isLoading = true
        scope.launch {
            try {
                val summary = accountingRepository.getCustomerLedger(businessId, customerId)
                ledgerSummary = summary
            } catch (e: Exception) {
                // Handled
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(businessId) {
        val list = accountingRepository.getCustomers(businessId)
        customers = list
        if (list.isNotEmpty()) {
            val initial = list.find { it.id == initialCustomerId } ?: list.first()
            selectedCustomer = initial
            loadLedger(initial.id)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(text = "Customer Ledger", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        Text(text = selectedCustomer?.name ?: "Account Statement", color = PrimaryDarkGreen, style = MaterialTheme.typography.labelSmall)
                    }
                },
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
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Customer Selector Pills
            if (customers.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, CardBorderStroke)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(text = "Select Customer", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            customers.forEach { cust ->
                                val isSelected = selectedCustomer?.id == cust.id
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (isSelected) PrimaryDarkGreen else SoftGreenSurface)
                                        .clickable {
                                            selectedCustomer = cust
                                            loadLedger(cust.id)
                                        }
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = cust.name,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (isSelected) SurfaceWhite else PrimaryDarkGreen
                                    )
                                }
                            }
                        }
                    }
                }
            }

            if (isLoading) {
                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = PrimaryDarkGreen)
                }
            } else if (ledgerSummary != null) {
                val s = ledgerSummary!!

                // Summary Dashboard Card: Total Sales, Cash Received, UPI Received, Total Received, Total Outstanding
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, CardBorderStroke)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "Account Summary", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (s.totalOutstanding > 0) ErrorContainer else SoftGreenSurface)
                                    .padding(horizontal = 8.dp, vertical = 3.dp)
                            ) {
                                Text(
                                    text = "Due: ₹${s.totalOutstanding}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    color = if (s.totalOutstanding > 0) ErrorRed else PrimaryDarkGreen
                                )
                            }
                        }

                        // Grid of metrics
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            MetricBox(modifier = Modifier.weight(1f), label = "Total Sales", value = "₹${s.totalSales}", color = OnSurfaceText)
                            MetricBox(modifier = Modifier.weight(1f), label = "Total Received", value = "₹${s.totalReceived}", color = PrimaryDarkGreen)
                        }

                        // Payment mode breakdown
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            MetricBox(modifier = Modifier.weight(1f), label = "Cash Received", value = "₹${s.cashReceived}", color = OnSurfaceVariantText)
                            MetricBox(modifier = Modifier.weight(1f), label = "UPI Received", value = "₹${s.upiReceived}", color = OnSurfaceVariantText)
                            if (s.bankReceived > 0) {
                                MetricBox(modifier = Modifier.weight(1f), label = "Bank", value = "₹${s.bankReceived}", color = OnSurfaceVariantText)
                            }
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(SoftGreenSurface)
                                .padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "Total Outstanding (Udhar)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = OnSurfaceText)
                            Text(text = "₹${s.totalOutstanding}", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = if (s.totalOutstanding > 0) ErrorRed else PrimaryDarkGreen)
                        }
                    }
                }

                // Transaction History List
                Text(text = "Transaction History (${s.transactions.size})", fontWeight = FontWeight.Bold, fontSize = 14.sp)

                if (s.transactions.isEmpty()) {
                    Text(text = "No invoices or receipts recorded for this customer yet.", fontSize = 12.sp, color = OnSurfaceVariantText)
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        s.transactions.forEach { tx ->
                            val isSale = tx.voucherType == "SALES" || tx.voucherType == "SPLIT_PAYMENT"
                            val dateStr = SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date(tx.date))

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp),
                                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                                border = BorderStroke(1.dp, CardBorderStroke)
                            ) {
                                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Box(
                                                modifier = Modifier
                                                    .size(28.dp)
                                                    .clip(CircleShape)
                                                    .background(if (isSale) SoftGreenSurface else Color(0xFFEFF6FF)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(
                                                    imageVector = if (isSale) Icons.Outlined.Receipt else Icons.Outlined.CallReceived,
                                                    contentDescription = null,
                                                    tint = if (isSale) PrimaryDarkGreen else Color(0xFF1D4ED8),
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Column {
                                                Text(text = tx.voucherNumber, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                                Text(text = dateStr, fontSize = 10.sp, color = OnSurfaceVariantText)
                                            }
                                        }

                                        Column(horizontalAlignment = Alignment.End) {
                                            Text(
                                                text = if (isSale) "₹${tx.totalBill}" else "-₹${tx.totalBill}",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.sp,
                                                color = if (isSale) OnSurfaceText else PrimaryDarkGreen
                                            )
                                            Text(text = "Bal: ₹${tx.runningBalance}", fontSize = 10.sp, color = OnSurfaceVariantText)
                                        }
                                    }

                                    Text(text = tx.productDetails, fontSize = 11.sp, color = OnSurfaceVariantText)

                                    // Payment allocation breakdown pills
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        if (tx.cashPaid > 0) {
                                            Pill(text = "Cash: ₹${tx.cashPaid}")
                                        }
                                        if (tx.upiPaid > 0) {
                                            Pill(text = "UPI: ₹${tx.upiPaid}")
                                        }
                                        if (tx.bankPaid > 0) {
                                            Pill(text = "Bank: ₹${tx.bankPaid}")
                                        }
                                        if (tx.udhar > 0) {
                                            Pill(text = "Udhar: ₹${tx.udhar}", isError = true)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MetricBox(modifier: Modifier = Modifier, label: String, value: String, color: Color) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(SoftGreenSurface)
            .padding(8.dp)
    ) {
        Column {
            Text(text = label, fontSize = 10.sp, color = OnSurfaceVariantText)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = color)
        }
    }
}

@Composable
private fun Pill(text: String, isError: Boolean = false) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(if (isError) ErrorContainer else SoftGreenSurface)
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(text = text, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = if (isError) ErrorRed else PrimaryDarkGreen)
    }
}
