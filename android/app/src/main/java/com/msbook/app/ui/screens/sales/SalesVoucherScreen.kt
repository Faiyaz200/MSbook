package com.msbook.app.ui.screens.sales

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
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
import com.msbook.app.data.local.entity.CustomerEntity
import com.msbook.app.data.local.entity.ProductEntity
import com.msbook.app.data.repository.AccountingRepository
import com.msbook.app.data.repository.CartItem
import com.msbook.app.domain.model.BusinessType
import com.msbook.app.domain.model.VoucherType
import com.msbook.app.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Full-screen Sales Voucher screen with barcode scanning, fractional/variant support,
 * editable cart, and flexible split payment allocation (Cash, UPI, Bank, Udhar).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SalesVoucherScreen(
    businessId: String,
    businessType: BusinessType,
    accountingRepository: AccountingRepository,
    onNavigateBack: () -> Unit,
    onSalesSaved: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var invoiceNumber by remember { mutableStateOf("") }
    val currentDateStr = remember {
        SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date())
    }

    // Customer state
    var customers by remember { mutableStateOf<List<CustomerEntity>>(emptyList()) }
    var selectedCustomer by remember { mutableStateOf<CustomerEntity?>(null) }
    var isNewCustomerSectionOpen by remember { mutableStateOf(false) }
    var newCustomerName by remember { mutableStateOf("") }
    var newCustomerMobile by remember { mutableStateOf("") }

    // Product & Cart state
    var products by remember { mutableStateOf<List<ProductEntity>>(emptyList()) }
    var cartItems by remember { mutableStateOf<List<CartItem>>(emptyList()) }

    // Manual/Barcode product entry
    var barcodeInput by remember { mutableStateOf("") }
    var productNameInput by remember { mutableStateOf("") }
    var quantityInput by remember { mutableStateOf("1") }
    var unitInput by remember { mutableStateOf(if (businessType == BusinessType.KIRANA) "kg" else "pcs") }
    var variantInput by remember { mutableStateOf(if (businessType == BusinessType.CLOTHING) "M / Navy" else "") }
    var sellingPriceInput by remember { mutableStateOf("") }
    var purchaseCostInput by remember { mutableStateOf("") }
    var discountInput by remember { mutableStateOf("0") }

    // Split Payment State
    var cashAmountInput by remember { mutableStateOf("") }
    var upiAmountInput by remember { mutableStateOf("") }
    var bankAmountInput by remember { mutableStateOf("") }
    var udharAmountInput by remember { mutableStateOf("") }

    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isSaving by remember { mutableStateOf(false) }

    // Load initial data
    LaunchedEffect(businessId) {
        invoiceNumber = accountingRepository.generateNextVoucherNumber(businessId, VoucherType.SALES)
        customers = accountingRepository.getCustomers(businessId)
        products = accountingRepository.getProducts(businessId)
    }

    // Calculations
    val grandTotal = cartItems.sumOf { it.lineTotal }
    val cashAmount = cashAmountInput.toDoubleOrNull() ?: 0.0
    val upiAmount = upiAmountInput.toDoubleOrNull() ?: 0.0
    val bankAmount = bankAmountInput.toDoubleOrNull() ?: 0.0
    val udharAmount = udharAmountInput.toDoubleOrNull() ?: 0.0
    val totalAllocated = cashAmount + upiAmount + bankAmount + udharAmount
    val totalReceived = cashAmount + upiAmount + bankAmount
    val remainingDue = udharAmount

    val isAllocationBalanced = cartItems.isNotEmpty() && Math.abs(grandTotal - totalAllocated) < 0.05

    fun addCartItem() {
        val name = productNameInput.trim()
        val qty = quantityInput.toDoubleOrNull() ?: 0.0
        val price = sellingPriceInput.toDoubleOrNull() ?: 0.0
        val cost = purchaseCostInput.toDoubleOrNull() ?: (price * 0.75) // default 25% margin if unspecified
        val disc = discountInput.toDoubleOrNull() ?: 0.0

        if (name.isBlank()) {
            errorMessage = "Enter product name"
            return
        }
        if (qty <= 0.0) {
            errorMessage = "Enter valid quantity"
            return
        }
        if (price <= 0.0) {
            errorMessage = "Enter valid selling price"
            return
        }

        val item = CartItem(
            productId = null,
            productName = name,
            quantity = qty,
            unit = unitInput.trim(),
            variantInfo = variantInput.trim(),
            sellingPrice = price,
            purchaseCost = cost,
            discount = disc
        )
        cartItems = cartItems + item

        // Reset inputs
        productNameInput = ""
        quantityInput = "1"
        sellingPriceInput = ""
        purchaseCostInput = ""
        discountInput = "0"
        barcodeInput = ""
        errorMessage = null

        // Auto balance to cash by default if first item
        if (cartItems.size == 1 && totalAllocated == 0.0) {
            cashAmountInput = item.lineTotal.toString()
        }
    }

    fun handleBarcodeScan(code: String) {
        barcodeInput = code
        scope.launch {
            val found = accountingRepository.getProductByBarcode(businessId, code)
            if (found != null) {
                productNameInput = found.name
                unitInput = found.unit
                sellingPriceInput = found.sellingPrice.toString()
                purchaseCostInput = found.purchaseCost.toString()
                variantInput = found.variantInfo
            }
        }
    }

    fun handleSave() {
        if (cartItems.isEmpty()) {
            errorMessage = "Add at least one product"
            return
        }
        if (!isAllocationBalanced) {
            errorMessage = "Total payment allocations (₹$totalAllocated) must equal Invoice Total (₹$grandTotal)"
            return
        }
        if (udharAmount > 0.0 && selectedCustomer == null) {
            errorMessage = "Customer selection is required when sale has Udhar (credit)"
            return
        }

        isSaving = true
        errorMessage = null

        scope.launch {
            val result = accountingRepository.saveSalesVoucher(
                businessId = businessId,
                customer = selectedCustomer,
                items = cartItems,
                cashAmount = cashAmount,
                upiAmount = upiAmount,
                bankAmount = bankAmount,
                udharAmount = udharAmount,
                date = System.currentTimeMillis(),
                remarks = "Sales bill $invoiceNumber"
            )

            isSaving = false
            result.fold(
                onSuccess = { onSalesSaved() },
                onFailure = { err -> errorMessage = err.message }
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(text = "Sales Voucher", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        Text(text = invoiceNumber, color = PrimaryDarkGreen, style = MaterialTheme.typography.labelSmall)
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
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceWhite)
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                Button(
                    onClick = { handleSave() },
                    enabled = isAllocationBalanced && !isSaving,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = PrimaryDarkGreen,
                        contentColor = SurfaceWhite
                    )
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(color = SurfaceWhite, modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
                    } else {
                        Text(text = "Save Invoice • ₹$grandTotal", fontWeight = FontWeight.Bold, fontSize = 15.sp)
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
            // Error banner
            if (errorMessage != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = ErrorContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.ErrorOutline, contentDescription = null, tint = ErrorRed, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = errorMessage!!, color = ErrorRed, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                    }
                }
            }

            // 1. Customer Selection Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, CardBorderStroke)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Person, contentDescription = null, tint = PrimaryDarkGreen, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "Customer (Required for Udhar)", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        TextButton(onClick = { isNewCustomerSectionOpen = !isNewCustomerSectionOpen }) {
                            Text(text = if (isNewCustomerSectionOpen) "Close" else "+ Add New", color = PrimaryDarkGreen, fontSize = 12.sp)
                        }
                    }

                    if (customers.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            customers.take(4).forEach { cust ->
                                val isSelected = selectedCustomer?.id == cust.id
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (isSelected) PrimaryDarkGreen else SoftGreenSurface)
                                        .clickable { selectedCustomer = if (isSelected) null else cust }
                                        .padding(horizontal = 10.dp, vertical = 6.dp)
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

                    // Add new customer in-flow
                    AnimatedVisibility(visible = isNewCustomerSectionOpen) {
                        Column(modifier = Modifier.padding(top = 10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(
                                value = newCustomerName,
                                onValueChange = { newCustomerName = it },
                                label = { Text("Customer Name") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true
                            )
                            OutlinedTextField(
                                value = newCustomerMobile,
                                onValueChange = { newCustomerMobile = it },
                                label = { Text("Mobile Number (Optional)") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone)
                            )
                            Button(
                                onClick = {
                                    if (newCustomerName.isNotBlank()) {
                                        scope.launch {
                                            val created = accountingRepository.createCustomer(businessId, newCustomerName, newCustomerMobile, "")
                                            customers = customers + created
                                            selectedCustomer = created
                                            newCustomerName = ""
                                            newCustomerMobile = ""
                                            isNewCustomerSectionOpen = false
                                        }
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGreen),
                                modifier = Modifier.align(Alignment.End)
                            ) {
                                Text("Save Customer", fontSize = 12.sp)
                            }
                        }
                    }

                    if (selectedCustomer != null) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(text = "Selected: ${selectedCustomer!!.name} (${selectedCustomer!!.mobileNumber.ifBlank { "No Mobile" }})", fontSize = 12.sp, color = PrimaryDarkGreen, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // 2. Product Search & Entry Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, CardBorderStroke)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.QrCodeScanner, contentDescription = null, tint = PrimaryDarkGreen, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "Add Items (Fractional Units & Variants)", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }

                    // Barcode input simulator
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = barcodeInput,
                            onValueChange = { handleBarcodeScan(it) },
                            placeholder = { Text("Scan / Type Barcode") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            leadingIcon = { Icon(Icons.Outlined.QrCode, contentDescription = null, modifier = Modifier.size(18.dp)) }
                        )
                        IconButton(onClick = { handleBarcodeScan("8901030383${(10..99).random()}") }) {
                            Icon(Icons.Outlined.CameraAlt, contentDescription = "Scan", tint = PrimaryDarkGreen)
                        }
                    }

                    // Product Name
                    OutlinedTextField(
                        value = productNameInput,
                        onValueChange = { productNameInput = it },
                        label = { Text("Product Name *") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    // Qty, Unit, Variant
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = quantityInput,
                            onValueChange = { quantityInput = it },
                            label = { Text("Qty (e.g. 0.5)") },
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
                            value = variantInput,
                            onValueChange = { variantInput = it },
                            label = { Text("Variant") },
                            modifier = Modifier.weight(1.2f),
                            singleLine = true
                        )
                    }

                    // Selling Price, Purchase Cost, Discount
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = sellingPriceInput,
                            onValueChange = { sellingPriceInput = it },
                            label = { Text("Price (₹) *") },
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = discountInput,
                            onValueChange = { discountInput = it },
                            label = { Text("Disc (₹)") },
                            modifier = Modifier.weight(0.8f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                    }

                    Button(
                        onClick = { addCartItem() },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGreen),
                        modifier = Modifier.fillMaxWidth().height(44.dp),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add Line Item")
                    }
                }
            }

            // 3. Cart Items List
            if (cartItems.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                    border = BorderStroke(1.dp, CardBorderStroke)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(text = "Selected Items (${cartItems.size})", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text(text = "Total: ₹$grandTotal", fontWeight = FontWeight.Bold, color = PrimaryDarkGreen, fontSize = 14.sp)
                        }
                        Spacer(modifier = Modifier.height(10.dp))

                        cartItems.forEachIndexed { index, item ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = item.productName, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                    Text(
                                        text = "${item.quantity} ${item.unit} @ ₹${item.sellingPrice}" + if (item.variantInfo.isNotBlank()) " • ${item.variantInfo}" else "",
                                        fontSize = 11.sp,
                                        color = OnSurfaceVariantText
                                    )
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(text = "₹${item.lineTotal}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    IconButton(
                                        onClick = { cartItems = cartItems.filterIndexed { i, _ -> i != index } },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = "Remove", tint = ErrorRed, modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                            if (index < cartItems.size - 1) {
                                HorizontalDivider(color = SoftGreenSurface)
                            }
                        }
                    }
                }
            }

            // 4. Split Payment Allocation Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, if (isAllocationBalanced) PrimaryDarkGreen else CardBorderStroke)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Payments, contentDescription = null, tint = PrimaryDarkGreen, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(text = "Split Payment Allocation", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        Text(
                            text = if (isAllocationBalanced) "Balanced ✓" else "₹$totalAllocated / ₹$grandTotal",
                            color = if (isAllocationBalanced) PrimaryDarkGreen else ErrorRed,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }

                    Text(
                        text = "Enter any combination of payment amounts (Cash, UPI, Bank, Udhar). Total must equal invoice.",
                        fontSize = 11.sp,
                        color = OnSurfaceVariantText
                    )

                    // 4 Payment mode fields
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
                            value = udharAmountInput,
                            onValueChange = { udharAmountInput = it },
                            label = { Text("Udhar / Due (₹)") },
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true
                        )
                    }

                    // Calculation breakdown: Total Received & Remaining Due
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(SoftGreenSurface)
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(text = "Total Received", fontSize = 11.sp, color = OnSurfaceVariantText)
                            Text(text = "₹$totalReceived", fontWeight = FontWeight.Bold, color = PrimaryDarkGreen, fontSize = 13.sp)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "Remaining Due (Udhar)", fontSize = 11.sp, color = OnSurfaceVariantText)
                            Text(text = "₹$remainingDue", fontWeight = FontWeight.Bold, color = if (remainingDue > 0) ErrorRed else PrimaryDarkGreen, fontSize = 13.sp)
                        }
                    }
                }
            }
        }
    }
}
