package com.msbook.app.ui.components

import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Assessment
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.MenuBook
import androidx.compose.material.icons.outlined.ReceiptLong
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.msbook.app.ui.navigation.Screen
import com.msbook.app.ui.theme.CardBorderStroke
import com.msbook.app.ui.theme.OnSurfaceVariantText
import com.msbook.app.ui.theme.PrimaryDarkGreen
import com.msbook.app.ui.theme.SoftGreenSurface
import com.msbook.app.ui.theme.SurfaceWhite

sealed class BottomTab(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    data object Dashboard : BottomTab(Screen.Dashboard.route, "Dashboard", Icons.Outlined.Dashboard)
    data object Vouchers : BottomTab(Screen.Vouchers.route, "Vouchers", Icons.Outlined.ReceiptLong)
    data object Ledgers : BottomTab(Screen.Ledgers.route, "Ledgers", Icons.Outlined.MenuBook)
    data object Inventory : BottomTab(Screen.Inventory.route, "Inventory", Icons.Outlined.Inventory2)
    data object Reports : BottomTab(Screen.Reports.route, "Reports", Icons.Outlined.Assessment)

    companion object {
        val items = listOf(Dashboard, Vouchers, Ledgers, Inventory, Reports)
    }
}

/**
 * Standard bottom navigation bar for MSbook.
 * Highlights the active tab (e.g. Vouchers or Dashboard) in approved dark green.
 */
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
                onClick = {
                    if (currentRoute != tab.route) {
                        onNavigateToRoute(tab.route)
                    }
                },
                icon = {
                    Icon(
                        imageVector = tab.icon,
                        contentDescription = tab.title,
                        tint = if (isSelected) PrimaryDarkGreen else OnSurfaceVariantText,
                        modifier = Modifier.size(22.dp)
                    )
                },
                label = {
                    Text(
                        text = tab.title,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        color = if (isSelected) PrimaryDarkGreen else OnSurfaceVariantText
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = SoftGreenSurface,
                    selectedIconColor = PrimaryDarkGreen,
                    unselectedIconColor = OnSurfaceVariantText,
                    selectedTextColor = PrimaryDarkGreen,
                    unselectedTextColor = OnSurfaceVariantText
                )
            )
        }
    }
}
