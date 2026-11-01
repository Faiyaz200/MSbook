package com.msbook.app.ui.screens.inventory

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.msbook.app.data.local.entity.ProductEntity
import com.msbook.app.data.repository.AccountingRepository
import com.msbook.app.ui.components.MSBookBottomNavBar
import com.msbook.app.ui.navigation.Screen
import com.msbook.app.ui.theme.*
import kotlinx.coroutines.launch
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryScreen(
    businessId: String,
    activeBusinessName: String,
    accountingRepository: AccountingRepository,
    onNavigateBack: () -> Unit,
    onBottomNavTabSelected: (String) -> Unit
) {
    val scope = rememberCoroutineScope()
    val products by accountingRepository.getProductsFlow(businessId).collectAsState(initial = emptyList())

    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("ALL") } // ALL, LOW_STOCK, IN_STOCK
    var showAddDialog by remember { mutableStateOf(false) }
    var editingProduct by remember { mutableStateOf<ProductEntity?>(null) }

    // Metrics calculations
    val totalProducts = products.size
    val totalStockValue = products.sumOf { it.stockQuantity * it.purchaseCost }
    val lowStockCount = products.count { it.stockQuantity <= 5.0 }

    // Filtered products
    val filteredProducts = remember(products, searchQuery, selectedFilter) {
        products.filter { p ->
            val matchesQuery = searchQuery.isBlank() ||
                    p.name.contains(searchQuery, ignoreCase = true) ||
                    p.barcode.contains(searchQuery, ignoreCase = true) ||
                    p.variantInfo.contains(searchQuery, ignoreCase = true)

            val matchesFilter = when (selectedFilter) {
                "LOW_STOCK" -> p.stockQuantity <= 5.0
                "IN_STOCK" -> p.stockQuantity > 5.0
                else -> true
            }

            matchesQuery && matchesFilter
        }
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
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
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
                                text = "Inventory & Stock",
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

                    FilledTonalButton(
                        onClick = {
                            editingProduct = null
                            showAddDialog = true
                        },
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = SurfaceWhite,
                            contentColor = PrimaryDarkGreen
                        ),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(imageVector = Icons.Outlined.Add, contentDescription = "Add", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = "Add Item", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        },
        bottomBar = {
            MSBookBottomNavBar(
                currentRoute = Screen.Inventory.route,
                onNavigateToRoute = onBottomNavTabSelected
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Summary Metric Cards
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, CardBorderStroke)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(text = "Total Stock Value", fontSize = 10.sp, color = OnSurfaceVariantText)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "₹${String.format("%.2f", totalStockValue)}",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryDarkGreen
                        )
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, CardBorderStroke)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(text = "Total Items", fontSize = 10.sp, color = OnSurfaceVariantText)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "$totalProducts Products",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = OnSurfaceText
                        )
                    }
                }

                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (lowStockCount > 0) Color(0xFFFEF2F2) else SurfaceWhite
                    ),
                    border = BorderStroke(1.dp, if (lowStockCount > 0) Color(0xFFFCA5A5) else CardBorderStroke)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(text = "Low Stock Alerts", fontSize = 10.sp, color = if (lowStockCount > 0) ErrorRed else OnSurfaceVariantText)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "$lowStockCount Items",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (lowStockCount > 0) ErrorRed else PrimaryDarkGreen
                        )
                    }
                }
            }

            // Search Bar & Filter Chips
            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search by name, barcode or variant...", fontSize = 12.sp) },
                    leadingIcon = {
                        Icon(imageVector = Icons.Outlined.Search, contentDescription = "Search", tint = OnSurfaceVariantText)
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(imageVector = Icons.Outlined.Close, contentDescription = "Clear")
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = SurfaceWhite,
                        unfocusedContainerColor = SurfaceWhite
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = selectedFilter == "ALL",
                        onClick = { selectedFilter = "ALL" },
                        label = { Text("All ($totalProducts)", fontSize = 11.sp) }
                    )
                    FilterChip(
                        selected = selectedFilter == "LOW_STOCK",
                        onClick = { selectedFilter = "LOW_STOCK" },
                        label = { Text("Low Stock ($lowStockCount)", fontSize = 11.sp) }
                    )
                    FilterChip(
                        selected = selectedFilter == "IN_STOCK",
                        onClick = { selectedFilter = "IN_STOCK" },
                        label = { Text("In Stock (${totalProducts - lowStockCount})", fontSize = 11.sp) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Products List
            if (filteredProducts.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(CircleShape)
                                .background(SoftGreenSurface),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Inventory2,
                                contentDescription = null,
                                tint = PrimaryDarkGreen,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = if (searchQuery.isNotBlank()) "No matching products found" else "No products in inventory yet",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = OnSurfaceText
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Add Kirana goods (Rice, Oil, Sugar) or Clothing items (Jeans, Shirts) with fractional units and cost basis.",
                            fontSize = 12.sp,
                            color = OnSurfaceVariantText,
                            modifier = Modifier.padding(horizontal = 20.dp),
                            lineHeight = 18.sp
                        )
                        Spacer(modifier = Modifier.height(18.dp))
                        Button(
                            onClick = {
                                editingProduct = null
                                showAddDialog = true
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGreen),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(imageVector = Icons.Outlined.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "Add First Product", fontWeight = FontWeight.Bold)
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        TextButton(
                            onClick = {
                                scope.launch {
                                    val starters = listOf(
                                        ProductEntity(
                                            id = UUID.randomUUID().toString(),
                                            businessId = businessId,
                                            name = "Basmati Rice Premium",
                                            barcode = "8901234001",
                                            unit = "kg",
                                            sellingPrice = 110.0,
                                            purchaseCost = 85.0,
                                            stockQuantity = 50.0
                                        ),
                                        ProductEntity(
                                            id = UUID.randomUUID().toString(),
                                            businessId = businessId,
                                            name = "Tata Salt Iodized",
                                            barcode = "8901234002",
                                            unit = "pkt",
                                            sellingPrice = 28.0,
                                            purchaseCost = 22.0,
                                            stockQuantity = 30.0
                                        ),
                                        ProductEntity(
                                            id = UUID.randomUUID().toString(),
                                            businessId = businessId,
                                            name = "Fortune Sunflower Oil",
                                            barcode = "8901234003",
                                            unit = "ltr",
                                            sellingPrice = 165.0,
                                            purchaseCost = 140.0,
                                            stockQuantity = 24.0
                                        ),
                                        ProductEntity(
                                            id = UUID.randomUUID().toString(),
                                            businessId = businessId,
                                            name = "Slim Fit Cotton Shirt",
                                            barcode = "8901234004",
                                            unit = "pcs",
                                            sellingPrice = 799.0,
                                            purchaseCost = 450.0,
                                            stockQuantity = 12.0,
                                            variantInfo = "Size 40 / Sky Blue"
                                        ),
                                        ProductEntity(
                                            id = UUID.randomUUID().toString(),
                                            businessId = businessId,
                                            name = "Denim Jeans Regular Fit",
                                            barcode = "8901234005",
                                            unit = "pcs",
                                            sellingPrice = 1299.0,
                                            purchaseCost = 750.0,
                                            stockQuantity = 4.0, // Low stock
                                            variantInfo = "Size 32 / Dark Indigo"
                                        )
                                    )
                                    starters.forEach { accountingRepository.createOrUpdateProduct(it) }
                                }
                            }
                        ) {
                            Text(text = "Load Sample Starter Products", color = PrimaryDarkGreen, fontSize = 12.sp)
                        }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filteredProducts, key = { it.id }) { product ->
                        ProductItemCard(
                            product = product,
                            onEdit = {
                                editingProduct = product
                                showAddDialog = true
                            },
                            onAdjustStock = { delta ->
                                scope.launch {
                                    val updated = product.copy(stockQuantity = (product.stockQuantity + delta).coerceAtLeast(0.0))
                                    accountingRepository.createOrUpdateProduct(updated)
                                }
                            }
                        )
                    }
                }
            }
        }
    }

    // Add / Edit Product Dialog
    if (showAddDialog) {
        ProductFormDialog(
            businessId = businessId,
            initialProduct = editingProduct,
            onDismiss = { showAddDialog = false },
            onSave = { product ->
                scope.launch {
                    accountingRepository.createOrUpdateProduct(product)
                    showAddDialog = false
                }
            }
        )
    }
}

@Composable
private fun ProductItemCard(
    product: ProductEntity,
    onEdit: () -> Unit,
    onAdjustStock: (Double) -> Unit
) {
    val isLowStock = product.stockQuantity <= 5.0
    val isOutOfStock = product.stockQuantity <= 0.0
    val valuation = product.stockQuantity * product.purchaseCost

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onEdit() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
        border = BorderStroke(1.dp, if (isOutOfStock) Color(0xFFFCA5A5) else if (isLowStock) Color(0xFFFCD34D) else CardBorderStroke)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = product.name,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = OnSurfaceText
                    )

                    if (product.variantInfo.isNotBlank()) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = product.variantInfo,
                            fontSize = 11.sp,
                            color = PrimaryDarkGreen,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    if (product.barcode.isNotBlank()) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Outlined.QrCode,
                                contentDescription = null,
                                modifier = Modifier.size(12.dp),
                                tint = OnSurfaceVariantText
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = product.barcode,
                                fontSize = 10.sp,
                                color = OnSurfaceVariantText
                            )
                        }
                    }
                }

                // Stock Badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(
                            when {
                                isOutOfStock -> Color(0xFFFEE2E2)
                                isLowStock -> Color(0xFFFEF3C7)
                                else -> SoftGreenSurface
                            }
                        )
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "${product.stockQuantity} ${product.unit}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = when {
                            isOutOfStock -> ErrorRed
                            isLowStock -> Color(0xFFB45309)
                            else -> PrimaryDarkGreen
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            Divider(color = CardBorderStroke.copy(alpha = 0.5f), thickness = 0.5.dp)
            Spacer(modifier = Modifier.height(8.dp))

            // Pricing & Valuation Info + Quick Adjustment Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Column {
                        Text(text = "Selling Price", fontSize = 10.sp, color = OnSurfaceVariantText)
                        Text(
                            text = "₹${product.sellingPrice}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = OnSurfaceText
                        )
                    }

                    Column {
                        Text(text = "Purchase Cost", fontSize = 10.sp, color = OnSurfaceVariantText)
                        Text(
                            text = "₹${product.purchaseCost}",
                            fontWeight = FontWeight.Medium,
                            fontSize = 12.sp,
                            color = OnSurfaceVariantText
                        )
                    }

                    Column {
                        Text(text = "Asset Value", fontSize = 10.sp, color = OnSurfaceVariantText)
                        Text(
                            text = "₹${String.format("%.1f", valuation)}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = PrimaryDarkGreen
                        )
                    }
                }

                // Quick stock step adjustments (+ / -)
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    FilledTonalIconButton(
                        onClick = { onAdjustStock(-1.0) },
                        modifier = Modifier.size(28.dp),
                        shape = CircleShape
                    ) {
                        Icon(imageVector = Icons.Outlined.Remove, contentDescription = "Decrease", modifier = Modifier.size(14.dp))
                    }

                    FilledTonalIconButton(
                        onClick = { onAdjustStock(1.0) },
                        modifier = Modifier.size(28.dp),
                        shape = CircleShape
                    ) {
                        Icon(imageVector = Icons.Outlined.Add, contentDescription = "Increase", modifier = Modifier.size(14.dp))
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductFormDialog(
    businessId: String,
    initialProduct: ProductEntity?,
    onDismiss: () -> Unit,
    onSave: (ProductEntity) -> Unit
) {
    var name by remember { mutableStateOf(initialProduct?.name ?: "") }
    var barcode by remember { mutableStateOf(initialProduct?.barcode ?: "") }
    var unit by remember { mutableStateOf(initialProduct?.unit ?: "pcs") }
    var sellingPriceStr by remember { mutableStateOf(initialProduct?.sellingPrice?.toString() ?: "") }
    var purchaseCostStr by remember { mutableStateOf(initialProduct?.purchaseCost?.toString() ?: "") }
    var stockQuantityStr by remember { mutableStateOf(initialProduct?.stockQuantity?.toString() ?: "0") }
    var variantInfo by remember { mutableStateOf(initialProduct?.variantInfo ?: "") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val units = listOf("pcs", "kg", "g", "ltr", "pkt", "box", "mtr")

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = if (initialProduct != null) "Edit Product" else "Add New Product",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = PrimaryDarkGreen
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Product Name *", fontSize = 12.sp) },
                    placeholder = { Text("e.g. Basmati Rice, Cotton Jeans", fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = barcode,
                        onValueChange = { barcode = it },
                        label = { Text("Barcode", fontSize = 12.sp) },
                        placeholder = { Text("890...", fontSize = 12.sp) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = variantInfo,
                        onValueChange = { variantInfo = it },
                        label = { Text("Variant / Size", fontSize = 12.sp) },
                        placeholder = { Text("Size 32 / Blue", fontSize = 12.sp) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                }

                // Unit Selector
                Column {
                    Text(text = "Unit of Measurement", fontSize = 11.sp, color = OnSurfaceVariantText)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        units.forEach { u ->
                            val isSelected = unit == u
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isSelected) PrimaryDarkGreen else SoftGreenSurface)
                                    .clickable { unit = u }
                                    .padding(horizontal = 8.dp, vertical = 4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = u,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                    color = if (isSelected) SurfaceWhite else OnSurfaceText
                                )
                            }
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = sellingPriceStr,
                        onValueChange = { sellingPriceStr = it },
                        label = { Text("Selling Price (₹) *", fontSize = 12.sp) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = purchaseCostStr,
                        onValueChange = { purchaseCostStr = it },
                        label = { Text("Purchase Cost (₹) *", fontSize = 12.sp) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true
                    )
                }

                OutlinedTextField(
                    value = stockQuantityStr,
                    onValueChange = { stockQuantityStr = it },
                    label = { Text("Stock Quantity ($unit)", fontSize = 12.sp) },
                    placeholder = { Text("e.g. 10 or 2.5", fontSize = 12.sp) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                if (errorMessage != null) {
                    Text(text = errorMessage!!, color = ErrorRed, fontSize = 11.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val pName = name.trim()
                    if (pName.isBlank()) {
                        errorMessage = "Product name is required"
                        return@Button
                    }
                    val sp = sellingPriceStr.toDoubleOrNull()
                    if (sp == null || sp < 0) {
                        errorMessage = "Valid selling price is required"
                        return@Button
                    }
                    val cp = purchaseCostStr.toDoubleOrNull() ?: 0.0
                    val qty = stockQuantityStr.toDoubleOrNull() ?: 0.0

                    val productToSave = ProductEntity(
                        id = initialProduct?.id ?: UUID.randomUUID().toString(),
                        businessId = businessId,
                        name = pName,
                        barcode = barcode.trim(),
                        unit = unit,
                        sellingPrice = sp,
                        purchaseCost = cp,
                        stockQuantity = qty,
                        variantInfo = variantInfo.trim(),
                        createdAt = initialProduct?.createdAt ?: System.currentTimeMillis()
                    )
                    onSave(productToSave)
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGreen),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(text = "Save Product", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(text = "Cancel", color = OnSurfaceVariantText)
            }
        }
    )
}
