package com.msbook.app.ui.screens.reports

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.msbook.app.data.local.entity.JournalEntryEntity
import com.msbook.app.data.repository.AccountingRepository
import com.msbook.app.ui.components.MSBookBottomNavBar
import com.msbook.app.ui.navigation.Screen
import com.msbook.app.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportsScreen(
    businessId: String,
    activeBusinessName: String,
    accountingRepository: AccountingRepository,
    onBottomNavTabSelected: (String) -> Unit
) {
    val journalEntries by accountingRepository.getJournalEntriesFlow(businessId).collectAsState(initial = emptyList())
    val products by accountingRepository.getProductsFlow(businessId).collectAsState(initial = emptyList())

    // Financial summaries calculated directly from double-entry journal postings
    val totalSales = remember(journalEntries) {
        journalEntries.filter { it.accountName == "Sales Account" }.sumOf { it.credit }
    }
    val totalReceipts = remember(journalEntries) {
        journalEntries.filter { it.narration.contains("Receipt", ignoreCase = true) }.sumOf { it.debit }
    }
    val inventoryValue = remember(products) {
        products.sumOf { it.stockQuantity * it.purchaseCost }
    }
    val cashBalance = remember(journalEntries) {
        val cashDebits = journalEntries.filter { it.accountName == "Cash Account" }.sumOf { it.debit }
        val cashCredits = journalEntries.filter { it.accountName == "Cash Account" }.sumOf { it.credit }
        cashDebits - cashCredits
    }
    val upiBalance = remember(journalEntries) {
        val upiDebits = journalEntries.filter { it.accountName == "UPI Account" }.sumOf { it.debit }
        val upiCredits = journalEntries.filter { it.accountName == "UPI Account" }.sumOf { it.credit }
        upiDebits - upiCredits
    }
    val totalReceivables = remember(journalEntries) {
        val recvDebits = journalEntries.filter { it.accountName == "Customer Receivable" }.sumOf { it.debit }
        val recvCredits = journalEntries.filter { it.accountName == "Customer Receivable" }.sumOf { it.credit }
        (recvDebits - recvCredits).coerceAtLeast(0.0)
    }

    Scaffold(
        topBar = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PrimaryDarkGreen)
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
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
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "Reports & Day Book",
                            style = MaterialTheme.typography.titleMedium,
                            color = SurfaceWhite,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = activeBusinessName.ifBlank { "MSbook Store" },
                            style = MaterialTheme.typography.labelSmall,
                            color = SurfaceWhite.copy(alpha = 0.85f)
                        )
                    }
                }
            }
        },
        bottomBar = {
            MSBookBottomNavBar(
                currentRoute = Screen.Reports.route,
                onNavigateToRoute = onBottomNavTabSelected
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // KPI Overview Grid
            item {
                Text(
                    text = "Financial Snapshot",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = OnSurfaceText
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        label = "Gross Sales",
                        value = "₹${String.format("%.2f", totalSales)}",
                        color = PrimaryDarkGreen
                    )
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        label = "Cash In Hand",
                        value = "₹${String.format("%.2f", cashBalance)}",
                        color = PrimaryDarkGreen
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        label = "UPI / Online",
                        value = "₹${String.format("%.2f", upiBalance)}",
                        color = Color(0xFF1D4ED8)
                    )
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        label = "Customer Udhar",
                        value = "₹${String.format("%.2f", totalReceivables)}",
                        color = if (totalReceivables > 0) ErrorRed else PrimaryDarkGreen
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        label = "Inventory Asset",
                        value = "₹${String.format("%.2f", inventoryValue)}",
                        color = PrimaryDarkGreen
                    )
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        label = "Total Receipts",
                        value = "₹${String.format("%.2f", totalReceipts)}",
                        color = PrimaryDarkGreen
                    )
                }
            }

            // Day Book / Journal Postings Header
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Day Book Transactions (${journalEntries.size})",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = OnSurfaceText
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
            }

            if (journalEntries.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                        border = BorderStroke(1.dp, CardBorderStroke)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "No transactions recorded yet",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = OnSurfaceText
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Create Sales, Purchases or Receipts in Vouchers tab to view double-entry records.",
                                fontSize = 11.sp,
                                color = OnSurfaceVariantText
                            )
                        }
                    }
                }
            } else {
                items(journalEntries, key = { it.id }) { entry ->
                    JournalItemCard(entry = entry)
                }
            }
        }
    }
}

@Composable
private fun MetricCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    color: Color
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = BorderStroke(1.dp, CardBorderStroke)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(text = label, fontSize = 10.sp, color = OnSurfaceVariantText)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = color
            )
        }
    }
}

@Composable
private fun JournalItemCard(entry: JournalEntryEntity) {
    val dateStr = remember(entry.date) {
        SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault()).format(Date(entry.date))
    }
    val isDebit = entry.debit > 0

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = BorderStroke(1.dp, CardBorderStroke)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(if (isDebit) SoftGreenSurface else Color(0xFFEFF6FF)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isDebit) Icons.Outlined.ArrowDownward else Icons.Outlined.ArrowUpward,
                        contentDescription = null,
                        tint = if (isDebit) PrimaryDarkGreen else Color(0xFF1D4ED8),
                        modifier = Modifier.size(16.dp)
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(text = entry.accountName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Text(text = entry.narration.ifBlank { dateStr }, fontSize = 10.sp, color = OnSurfaceVariantText)
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = if (isDebit) "+₹${entry.debit}" else "-₹${entry.credit}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = if (isDebit) PrimaryDarkGreen else OnSurfaceText
                )
                Text(text = dateStr, fontSize = 9.sp, color = OnSurfaceVariantText)
            }
        }
    }
}
