package com.msbook.app.ui.screens.business_select

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Checkroom
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.msbook.app.domain.model.BusinessType
import com.msbook.app.ui.theme.CardBorderStroke
import com.msbook.app.ui.theme.PrimaryDarkGreen
import com.msbook.app.ui.theme.SoftGreenSurface
import com.msbook.app.ui.theme.SurfaceWhite

/**
 * Full-screen business selection screen.
 * User selects either Kirana / General Store or Clothing / Men's Wear.
 */
@Composable
fun BusinessSelectScreen(
    canNavigateBack: Boolean,
    onNavigateBack: () -> Unit,
    onBusinessSelected: (BusinessType) -> Unit
) {
    var selectedType by rememberSaveable { mutableStateOf<BusinessType?>(null) }

    Scaffold(
        topBar = {
            if (canNavigateBack) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = PrimaryDarkGreen
                        )
                    }
                    Text(
                        text = "Back",
                        style = MaterialTheme.typography.titleMedium,
                        color = PrimaryDarkGreen
                    )
                }
            } else {
                Spacer(modifier = Modifier.height(16.dp))
            }
        },
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceWhite)
                    .padding(horizontal = 24.dp, vertical = 20.dp)
            ) {
                Button(
                    onClick = {
                        selectedType?.let { onBusinessSelected(it) }
                    },
                    enabled = selectedType != null,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = PrimaryDarkGreen,
                        contentColor = SurfaceWhite,
                        disabledContainerColor = PrimaryDarkGreen.copy(alpha = 0.35f),
                        disabledContentColor = SurfaceWhite.copy(alpha = 0.7f)
                    )
                ) {
                    Text(
                        text = "Continue",
                        style = MaterialTheme.typography.labelLarge.copy(fontSize = 16.sp)
                    )
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Branding Sub-header
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(PrimaryDarkGreen),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "MS",
                        color = SurfaceWhite,
                        style = MaterialTheme.typography.titleMedium
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "MSbook",
                    style = MaterialTheme.typography.titleLarge,
                    color = PrimaryDarkGreen
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = "Choose Your Business",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.onBackground
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Select your business category to configure your custom accounting records and books.",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Option 1: Kirana / General Store
            BusinessCategoryCard(
                businessType = BusinessType.KIRANA,
                icon = Icons.Default.ShoppingCart,
                isSelected = selectedType == BusinessType.KIRANA,
                onSelect = { selectedType = BusinessType.KIRANA }
            )

            Spacer(modifier = Modifier.height(18.dp))

            // Option 2: Clothing / Men's Wear
            BusinessCategoryCard(
                businessType = BusinessType.CLOTHING,
                icon = Icons.Default.Checkroom,
                isSelected = selectedType == BusinessType.CLOTHING,
                onSelect = { selectedType = BusinessType.CLOTHING }
            )

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
private fun BusinessCategoryCard(
    businessType: BusinessType,
    icon: ImageVector,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    val borderColor = if (isSelected) PrimaryDarkGreen else CardBorderStroke
    val containerBg = if (isSelected) SoftGreenSurface else SurfaceWhite
    val borderWidth = if (isSelected) 2.dp else 1.dp

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable { onSelect() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = containerBg),
        border = BorderStroke(borderWidth, borderColor),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isSelected) 3.dp else 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.weight(1f),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(54.dp)
                        .clip(CircleShape)
                        .background(if (isSelected) PrimaryDarkGreen else SoftGreenSurface),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = businessType.title,
                        tint = if (isSelected) SurfaceWhite else PrimaryDarkGreen,
                        modifier = Modifier.size(28.dp)
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column {
                    Text(
                        text = businessType.title,
                        style = MaterialTheme.typography.titleMedium.copy(fontSize = 17.sp),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = businessType.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            Icon(
                imageVector = if (isSelected) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                contentDescription = if (isSelected) "Selected" else "Not selected",
                tint = if (isSelected) PrimaryDarkGreen else CardBorderStroke,
                modifier = Modifier.size(26.dp)
            )
        }
    }
}
