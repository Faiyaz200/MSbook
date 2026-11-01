package com.msbook.app.ui.screens.vouchers

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.AssignmentReturn
import androidx.compose.material.icons.outlined.AssignmentReturned
import androidx.compose.material.icons.outlined.CallMade
import androidx.compose.material.icons.outlined.CallReceived
import androidx.compose.material.icons.outlined.CallSplit
import androidx.compose.material.icons.outlined.EditNote
import androidx.compose.material.icons.outlined.MenuBook
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material.icons.outlined.Sync
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
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
import com.msbook.app.ui.theme.CardBorderStroke
import com.msbook.app.ui.theme.OnSurfaceText
import com.msbook.app.ui.theme.OnSurfaceVariantText
import com.msbook.app.ui.theme.PrimaryDarkGreen
import com.msbook.app.ui.theme.SoftGreenSurface
import com.msbook.app.ui.theme.SurfaceWhite

/**
 * Full-screen Voucher Hub Screen for MSbook.
 * Displays 5 main vouchers (Sales, Purchase, Receipt, Payment, Split Payment)
 * and an expandable "More Vouchers" section (Contra, Journal, Debit Note, Credit Note),
 * plus Customer Ledger access.
 */
@Composable
fun VoucherScreen(
    activeBusinessName: String,
    onNavigateToVoucher: (VoucherType) -> Unit,
    onNavigateToCustomerLedger: () -> Unit = {},
    onBottomNavTabSelected: (String) -> Unit
) {
    var isMoreVouchersExpanded by rememberSaveable { mutableStateOf(false) }

    Scaffold(
        topBar = {
            // Dark Green Header strictly matching the Dashboard design reference
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
            // Header instruction badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Main Vouchers",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = OnSurfaceText
                )
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(SoftGreenSurface)
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = "5 Core Types",
                        style = MaterialTheme.typography.labelMedium,
                        color = PrimaryDarkGreen,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 1. 2-COLUMN GRID FOR MAIN VOUCHERS
            // Row 1: Sales Voucher & Purchase Voucher
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                VoucherGridCard(
                    modifier = Modifier.weight(1f),
                    voucherType = VoucherType.SALES,
                    icon = Icons.Outlined.Receipt,
                    onClick = { onNavigateToVoucher(VoucherType.SALES) }
                )
                VoucherGridCard(
                    modifier = Modifier.weight(1f),
                    voucherType = VoucherType.PURCHASE,
                    icon = Icons.Outlined.ShoppingCart,
                    onClick = { onNavigateToVoucher(VoucherType.PURCHASE) }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Row 2: Receipt Voucher & Payment Voucher
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                VoucherGridCard(
                    modifier = Modifier.weight(1f),
                    voucherType = VoucherType.RECEIPT,
                    icon = Icons.Outlined.CallReceived,
                    onClick = { onNavigateToVoucher(VoucherType.RECEIPT) }
                )
                VoucherGridCard(
                    modifier = Modifier.weight(1f),
                    voucherType = VoucherType.PAYMENT,
                    icon = Icons.Outlined.CallMade,
                    onClick = { onNavigateToVoucher(VoucherType.PAYMENT) }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Row 3: Split Payment (Option 5)
            VoucherWideCard(
                voucherType = VoucherType.SPLIT_PAYMENT,
                icon = Icons.Outlined.CallSplit,
                onClick = { onNavigateToVoucher(VoucherType.SPLIT_PAYMENT) }
            )

            Spacer(modifier = Modifier.height(20.dp))

            // 2. EXPANDABLE "MORE VOUCHERS" SECTION (Contra, Journal, Debit Note, Credit Note)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, CardBorderStroke),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(SoftGreenSurface),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.Sync,
                                    contentDescription = null,
                                    tint = PrimaryDarkGreen,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "More Vouchers",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = OnSurfaceText
                                )
                                Text(
                                    text = "Contra, Journal, Debit & Credit Notes",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = OnSurfaceVariantText
                                )
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(SoftGreenSurface)
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "4 Types",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = PrimaryDarkGreen,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(
                                imageVector = if (isMoreVouchersExpanded) {
                                    Icons.Default.KeyboardArrowUp
                                } else {
                                    Icons.Default.KeyboardArrowDown
                                },
                                contentDescription = if (isMoreVouchersExpanded) "Collapse" else "Expand",
                                tint = OnSurfaceText,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }

                    AnimatedVisibility(
                        visible = isMoreVouchersExpanded,
                        enter = fadeIn() + expandVertically(),
                        exit = fadeOut() + shrinkVertically()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(SoftGreenSurface.copy(alpha = 0.5f))
                                .padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            MoreVoucherListItem(
                                voucherType = VoucherType.CONTRA,
                                icon = Icons.Outlined.Sync,
                                onClick = { onNavigateToVoucher(VoucherType.CONTRA) }
                            )
                            MoreVoucherListItem(
                                voucherType = VoucherType.JOURNAL,
                                icon = Icons.Outlined.EditNote,
                                onClick = { onNavigateToVoucher(VoucherType.JOURNAL) }
                            )
                            MoreVoucherListItem(
                                voucherType = VoucherType.DEBIT_NOTE,
                                icon = Icons.Outlined.AssignmentReturn,
                                onClick = { onNavigateToVoucher(VoucherType.DEBIT_NOTE) }
                            )
                            MoreVoucherListItem(
                                voucherType = VoucherType.CREDIT_NOTE,
                                icon = Icons.Outlined.AssignmentReturned,
                                onClick = { onNavigateToVoucher(VoucherType.CREDIT_NOTE) }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Quick Customer Ledger Access Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .clickable { onNavigateToCustomerLedger() },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, CardBorderStroke),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(SoftGreenSurface),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.MenuBook,
                                contentDescription = null,
                                tint = PrimaryDarkGreen,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column {
                            Text(
                                text = "Customer Ledgers & Statement",
                                style = MaterialTheme.typography.titleSmall,
                                fontWeight = FontWeight.Bold,
                                color = OnSurfaceText
                            )
                            Text(
                                text = "Complete account history, Udhar balance & receipts",
                                style = MaterialTheme.typography.bodySmall,
                                color = OnSurfaceVariantText,
                                fontSize = 11.sp
                            )
                        }
                    }
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = "Open",
                        tint = OnSurfaceVariantText.copy(alpha = 0.6f),
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
private fun VoucherGridCard(
    modifier: Modifier = Modifier,
    voucherType: VoucherType,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = BorderStroke(1.dp, CardBorderStroke),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(SoftGreenSurface),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = voucherType.title,
                        tint = Color.Black,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                    contentDescription = "Open",
                    tint = OnSurfaceVariantText.copy(alpha = 0.6f),
                    modifier = Modifier.size(16.dp)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = voucherType.title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = OnSurfaceText,
                maxLines = 1
            )

            Spacer(modifier = Modifier.height(3.dp))

            Text(
                text = voucherType.subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = OnSurfaceVariantText,
                fontSize = 11.sp,
                lineHeight = 15.sp,
                maxLines = 2
            )
        }
    }
}

@Composable
private fun VoucherWideCard(
    voucherType: VoucherType,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = BorderStroke(1.dp, CardBorderStroke),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.5.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(SoftGreenSurface),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = voucherType.title,
                        tint = Color.Black,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Spacer(modifier = Modifier.width(14.dp))

                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = voucherType.title,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = OnSurfaceText
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(PrimaryDarkGreen)
                                .padding(horizontal = 5.dp, vertical = 1.5.dp)
                        ) {
                            Text(
                                text = "FLEXIBLE",
                                color = SurfaceWhite,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Cash, UPI, Bank & Udhar flexible allocation",
                        style = MaterialTheme.typography.bodySmall,
                        color = OnSurfaceVariantText,
                        fontSize = 11.sp
                    )
                }
            }

            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = "Open",
                tint = OnSurfaceVariantText.copy(alpha = 0.6f),
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

@Composable
private fun MoreVoucherListItem(
    voucherType: VoucherType,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = BorderStroke(1.dp, CardBorderStroke),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(SoftGreenSurface),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = voucherType.title,
                        tint = Color.Black,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Text(
                        text = voucherType.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = OnSurfaceText
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = voucherType.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = OnSurfaceVariantText,
                        fontSize = 11.sp
                    )
                }
            }

            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = "Open",
                tint = OnSurfaceVariantText.copy(alpha = 0.6f),
                modifier = Modifier.size(16.dp)
            )
        }
    }
}
