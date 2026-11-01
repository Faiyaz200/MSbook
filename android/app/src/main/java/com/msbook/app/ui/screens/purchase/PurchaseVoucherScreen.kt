package com.msbook.app.ui.screens.purchase

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.msbook.app.data.repository.AccountingRepository
import com.msbook.app.data.repository.CartItem
import com.msbook.app.domain.model.VoucherType
import com.msbook.app.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PurchaseVoucherScreen(
    businessId: String,
    accountingRepository: AccountingRepository,
    onNavigateBack: () -> Unit,
    onPurchaseSaved: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var voucherNumber by remember { mutableStateOf("") }
    var supplierNameInput by remember { mutableStateOf("") }

    var productNameInput by remember { mutableStateOf("") }
    var quantityInput by remember { mutableStateOf("10") }
    var unitInput by remember { mutableStateOf("pcs") }
    var purchasePriceInput by remember { mutableStateOf("") }

    var cartItems by remember { mutableStateOf<List<CartItem>>(emptyList()) }

    var cashAmountInput by remember { mutableStateOf("") }
    var upiAmountInput by remember { mutableStateOf("") }
    var bankAmountInput by remember { mutableStateOf("") }
    var creditAmountInput by remember { mutableStateOf("") }

    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isSaving by remember { mutableStateOf(false) }

    LaunchedEffect(businessId) {
        voucherNumber = accountingRepository.generateNextVoucherNumber(businessId, VoucherType.PURCHASE)
    }

    val totalAmount = cartItems.sumOf { it.lineTotal }
    val cash = cashAmountInput.toDoubleOrNull() ?: 0.0
    val upi = upiAmountInput.toDoubleOrNull() ?: 0.0
    val bank = bankAmountInput.toDoubleOrNull() ?: 0.0
    val credit = creditAmountInput.toDoubleOrNull() ?: 0.0
    val totalAllocated = cash + upi + bank + credit

    val isBalanced = cartItems.isNotEmpty() && Math.abs(totalAmount - totalAllocated) < 0.05

    fun addItem() {
        val name = productNameInput.trim()
        val qty = quantityInput.toDoubleOrNull() ?: 0.0
        val price = purchasePriceInput.toDoubleOrNull() ?: 0.0

        if (name.isBlank() || qty <= 0.0 || price <= 0.0) {
            errorMessage = "Enter product name, quantity, and purchase price"
            return
        }

        val item = CartItem(
            productId = null,
            productName = name,
            quantity = qty,
            unit = unitInput.trim(),
            variantInfo = "",
            sellingPrice = price * 1.3, // default markup
            purchaseCost = price,
            discount = 0.0
        )
        cartItems = cartItems + item
        productNameInput = ""
        purchasePriceInput = ""
        errorMessage = null

        if (cartItems.size == 1 && totalAllocated == 0.0) {
            cashAmountInput = item.lineTotal.toString()
        }
    }

    fun handleSave() {
        if (supplierNameInput.isBlank()) {
            errorMessage = "Enter supplier name"
            return
        }
        if (cartItems.isEmpty()) {
            errorMessage = "Add at least one product"
            return
        }
        if (!isBalanced) {
            errorMessage = "Payment allocation (₹$totalAllocated) must equal Purchase Total (₹$totalAmount)"
            return
        }

        isSaving = true
        scope.launch {
            val result = accountingRepository.savePurchaseVoucher(
                businessId = businessId,
                supplierName = supplierNameInput.trim(),
                items = cartItems,
                cashAmount = cash,
                upiAmount = upi,
                bankAmount = bank,
                creditAmount = credit,
                date = System.currentTimeMillis(),
                remarks = "Purchase from ${supplierNameInput.trim()}"
            )
            isSaving = false
            result.fold(
                onSuccess = { onPurchaseSaved() },
                onFailure = { err -> errorMessage = err.message }
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(text = "Purchase Voucher", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        Text(text = voucherNumber, color = PrimaryDarkGreen, style = MaterialTheme.typography.labelSmall)
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
        bottomBar = {
            Box(
                modifier = Modifier.fillMaxWidth().background(SurfaceWhite).padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                Button(
                    onClick = { handleSave() },
                    enabled = isBalanced && !isSaving,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGreen)
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(color = SurfaceWhite, modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
                    } else {
                        Text(text = "Save Purchase • ₹$totalAmount", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                }
            }
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
            if (errorMessage != null) {
                Card(colors = CardDefaults.cardColors(containerColor = ErrorContainer), shape = RoundedCornerShape(12.dp)) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.ErrorOutline, contentDescription = null, tint = ErrorRed, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = errorMessage!!, color = ErrorRed, fontSize = 12.sp)
                    }
                }
            }

            // Supplier Input
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, CardBorderStroke)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Supplier Details", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = supplierNameInput,
                        onValueChange = { supplierNameInput = it },
                        label = { Text("Supplier Name / Firm *") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            }

            // Product Entry
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, CardBorderStroke)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(text = "Purchased Items", fontWeight = FontWeight.Bold, fontSize = 14.sp)

                    OutlinedTextField(
                        value = productNameInput,
                        onValueChange = { productNameInput = it },
                        label = { Text("Product Name *") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = quantityInput,
                            onValueChange = { quantityInput = it },
                            label = { Text("Qty") },
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = unitInput,
                            onValueChange = { unitInput = it },
                            label = { Text("Unit") },
                            modifier = Modifier.weight(0.8f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = purchasePriceInput,
                            onValueChange = { purchasePriceInput = it },
                            label = { Text("Cost Price (₹)") },
                            modifier = Modifier.weight(1.2f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                    }

                    Button(
                        onClick = { addItem() },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGreen),
                        modifier = Modifier.fillMaxWidth().height(42.dp),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add Item to Purchase")
                    }
                }
            }

            // Cart Items
            if (cartItems.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, CardBorderStroke)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(text = "Items (${cartItems.size})", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text(text = "Total: ₹$totalAmount", fontWeight = FontWeight.Bold, color = PrimaryDarkGreen, fontSize = 14.sp)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        cartItems.forEach { item ->
                            Text(text = "• ${item.productName} - ${item.quantity} ${item.unit} @ ₹${item.purchaseCost} = ₹${item.lineTotal}", fontSize = 12.sp)
                        }
                    }
                }
            }

            // Payment Allocation
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, CardBorderStroke)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(text = "Supplier Payment Mode (Cash / UPI / Bank / Credit)", fontWeight = FontWeight.Bold, fontSize = 14.sp)

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = cashAmountInput,
                            onValueChange = { cashAmountInput = it },
                            label = { Text("Cash (₹)") },
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = upiAmountInput,
                            onValueChange = { upiAmountInput = it },
                            label = { Text("UPI (₹)") },
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = bankAmountInput,
                            onValueChange = { bankAmountInput = it },
                            label = { Text("Bank (₹)") },
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = creditAmountInput,
                            onValueChange = { creditAmountInput = it },
                            label = { Text("Supplier Credit (₹)") },
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                    }

                    Text(text = "Allocated: ₹$totalAllocated / ₹$totalAmount", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = if (isBalanced) PrimaryDarkGreen else ErrorRed)
                }
            }
        }
    }
}
