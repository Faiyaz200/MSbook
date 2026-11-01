package com.msbook.app.ui.screens.dashboard

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Checkroom
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.msbook.app.domain.model.BusinessType
import com.msbook.app.ui.theme.CardBorderStroke
import com.msbook.app.ui.theme.PrimaryDarkGreen
import com.msbook.app.ui.theme.SoftGreenSurface
import com.msbook.app.ui.theme.SurfaceWhite

import com.msbook.app.ui.components.MSBookBottomNavBar
import com.msbook.app.ui.navigation.Screen

/**
 * Clean dashboard placeholder for Stage 1 & 2.
 * Shows active business name, business type, business switcher, and Add New Business option.
 * Strictly avoids fake accounting balances or mock ledgers.
 */
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onNavigateToSwitcher: () -> Unit,
    onNavigateToAddBusiness: () -> Unit,
    onBottomNavTabSelected: (String) -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        bottomBar = {
            MSBookBottomNavBar(
                currentRoute = Screen.Dashboard.route,
                onNavigateToRoute = onBottomNavTabSelected
            )
        },
        topBar = {
            // MSbook App Header
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
                                text = "MSbook",
                                style = MaterialTheme.typography.titleLarge,
                                color = SurfaceWhite,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Accounting & Business Suite",
                                style = MaterialTheme.typography.labelMedium,
                                color = SurfaceWhite.copy(alpha = 0.8f)
                            )
                        }
                    }

                    // Quick Switch Action
                    OutlinedButton(
                        onClick = onNavigateToSwitcher,
                        shape = RoundedCornerShape(20.dp),
                        border = BorderStroke(1.dp, SurfaceWhite.copy(alpha = 0.6f)),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = SurfaceWhite
                        ),
                        modifier = Modifier.height(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.SwapHoriz,
                            contentDescription = "Switch",
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Switch",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = PrimaryDarkGreen)
            }
        } else {
            val business = uiState.activeBusiness

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp)
            ) {
                // Active Business Header Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, CardBorderStroke),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(SoftGreenSurface)
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = "ACTIVE BUSINESS",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = PrimaryDarkGreen,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            // Category Icon
                            val categoryIcon = if (business?.businessType == BusinessType.CLOTHING) {
                                Icons.Default.Checkroom
                            } else {
                                Icons.Default.ShoppingCart
                            }
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(SoftGreenSurface),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = categoryIcon,
                                    contentDescription = null,
                                    tint = PrimaryDarkGreen,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = business?.businessName ?: "No Business Selected",
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onBackground
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = business?.businessType?.title ?: "Unknown Type",
                            style = MaterialTheme.typography.titleMedium,
                            color = PrimaryDarkGreen,
                            fontWeight = FontWeight.Medium
                        )

                        // Business Metadata Details
                        Spacer(modifier = Modifier.height(16.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .background(CardBorderStroke.copy(alpha = 0.6f))
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        if (!business?.ownerName.isNullOrBlank()) {
                            DetailRow(
                                icon = Icons.Default.Person,
                                label = "Owner",
                                value = business!!.ownerName
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                        }

                        if (!business?.mobileNumber.isNullOrBlank()) {
                            DetailRow(
                                icon = Icons.Default.Phone,
                                label = "Mobile",
                                value = business!!.mobileNumber
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                        }

                        if (!business?.address.isNullOrBlank()) {
                            DetailRow(
                                icon = Icons.Default.LocationOn,
                                label = "Address",
                                value = business!!.address
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                        }

                        DetailRow(
                            icon = Icons.Default.Business,
                            label = "Business ID",
                            value = business?.id ?: "N/A"
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Action Buttons: Switch Business & Add New Business
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onNavigateToSwitcher,
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.5.dp, PrimaryDarkGreen),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = PrimaryDarkGreen
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.SwapHoriz,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Switch Business",
                            style = MaterialTheme.typography.labelLarge
                        )
                    }

                    Button(
                        onClick = onNavigateToAddBusiness,
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = PrimaryDarkGreen,
                            contentColor = SurfaceWhite
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Add Business",
                            style = MaterialTheme.typography.labelLarge
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Foundation Stage Info Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SoftGreenSurface),
                    border = BorderStroke(1.dp, PrimaryDarkGreen.copy(alpha = 0.2f))
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Text(
                            text = "Step 1: Multi-Business Foundation Active",
                            style = MaterialTheme.typography.titleMedium,
                            color = PrimaryDarkGreen,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "This installation is fully initialized with isolated local Room database storage. Business context is active and persists across restarts. Subsequent accounting modules (Vouchers, Ledgers, Daybook, P&L) will bind to this active business ID in Step 2.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun DetailRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = PrimaryDarkGreen,
            modifier = Modifier.size(18.dp)
        )
        Spacer(modifier = Modifier.width(10.dp))
        Text(
            text = "$label: ",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onBackground
        )
    }
}
