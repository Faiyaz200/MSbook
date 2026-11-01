package com.msbook.app.ui.screens.receipt

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.msbook.app.data.local.entity.CustomerEntity
import com.msbook.app.data.repository.AccountingRepository
import com.msbook.app.domain.model.VoucherType
import com.msbook.app.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReceiptVoucherScreen(
    businessId: String,
    accountingRepository: AccountingRepository,
    onNavigateBack: () -> Unit,
    onReceiptSaved: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var receiptNumber by remember { mutableStateOf("") }
    val currentDateStr = remember {
        SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date())
    }

    var customers by remember { mutableStateOf<List<CustomerEntity>>(emptyList()) }
    var selectedCustomer by remember { mutableStateOf<CustomerEntity?>(null) }
    var customerOutstanding by remember { mutableStateOf(0.0) }

    var amountInput by remember { mutableStateOf("") }
    var selectedPaymentMode by remember { mutableStateOf("Cash") } // Cash, UPI, Bank
    var referenceInput by remember { mutableStateOf("") }
    var remarksInput by remember { mutableStateOf("") }

    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isSaving by remember { mutableStateOf(false) }

    LaunchedEffect(businessId) {
        receiptNumber = accountingRepository.generateNextVoucherNumber(businessId, VoucherType.RECEIPT)
        customers = accountingRepository.getCustomers(businessId)
    }

    // Refresh customer outstanding whenever selected customer changes
    LaunchedEffect(selectedCustomer) {
        if (selectedCustomer != null) {
            val ledger = accountingRepository.getCustomerLedger(businessId, selectedCustomer!!.id)
            customerOutstanding = ledger.totalOutstanding
            if (amountInput.isBlank() && customerOutstanding > 0.0) {
                amountInput = customerOutstanding.toString()
            }
        } else {
            customerOutstanding = 0.0
        }
    }

    val receiptAmount = amountInput.toDoubleOrNull() ?: 0.0
    val newOutstanding = Math.max(0.0, customerOutstanding - receiptAmount)

    fun handleSave() {
        if (selectedCustomer == null) {
            errorMessage = "Select a customer"
            return
        }
        if (receiptAmount <= 0.0) {
            errorMessage = "Enter valid receipt amount"
            return
        }

        isSaving = true
        errorMessage = null

        scope.launch {
            val result = accountingRepository.saveReceiptVoucher(
                businessId = businessId,
                customer = selectedCustomer!!,
                amount = receiptAmount,
                paymentMode = selectedPaymentMode,
                date = System.currentTimeMillis(),
                referenceNo = referenceInput.ifBlank { null },
                remarks = remarksInput.ifBlank { "Received from ${selectedCustomer!!.name}" }
            )

            isSaving = false
            result.fold(
                onSuccess = { onReceiptSaved() },
                onFailure = { err -> errorMessage = err.message }
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(text = "Receipt Voucher", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        Text(text = receiptNumber, color = PrimaryDarkGreen, style = MaterialTheme.typography.labelSmall)
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
                    enabled = selectedCustomer != null && receiptAmount > 0.0 && !isSaving,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGreen)
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(color = SurfaceWhite, modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
                    } else {
                        Text(text = "Save Receipt • ₹$receiptAmount", fontWeight = FontWeight.Bold, fontSize = 15.sp)
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
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = ErrorContainer),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.ErrorOutline, contentDescription = null, tint = ErrorRed, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = errorMessage!!, color = ErrorRed, fontSize = 12.sp)
                    }
                }
            }

            // Customer Selector & Current Balance
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, CardBorderStroke)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Select Customer", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    if (customers.isEmpty()) {
                        Text(text = "No customers found. Create a sale with customer first.", fontSize = 12.sp, color = OnSurfaceVariantText)
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            customers.forEach { cust ->
                                val isSelected = selectedCustomer?.id == cust.id
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(if (isSelected) SoftGreenSurface else SurfaceWhite)
                                        .clickable { selectedCustomer = cust }
                                        .border(1.dp, if (isSelected) PrimaryDarkGreen else CardBorderStroke, RoundedCornerShape(10.dp))
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(text = cust.name, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                        Text(text = cust.mobileNumber.ifBlank { "No Mobile" }, fontSize = 11.sp, color = OnSurfaceVariantText)
                                    }
                                    if (isSelected) {
                                        Text(text = "Selected ✓", color = PrimaryDarkGreen, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }

                    if (selectedCustomer != null) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(SoftGreenSurface)
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(text = "Current Outstanding", fontSize = 11.sp, color = OnSurfaceVariantText)
                                Text(text = "₹$customerOutstanding", fontWeight = FontWeight.Bold, color = ErrorRed, fontSize = 14.sp)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(text = "Balance After Receipt", fontSize = 11.sp, color = OnSurfaceVariantText)
                                Text(text = "₹$newOutstanding", fontWeight = FontWeight.Bold, color = PrimaryDarkGreen, fontSize = 14.sp)
                            }
                        }
                    }
                }
            }

            // Receipt Details
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SurfaceWhite),
                border = BorderStroke(1.dp, CardBorderStroke)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(text = "Receipt Particulars", fontWeight = FontWeight.Bold, fontSize = 14.sp)

                    OutlinedTextField(
                        value = amountInput,
                        onValueChange = { amountInput = it },
                        label = { Text("Amount Received (₹) *") },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true
                    )

                    // Payment Mode Pills (Cash, UPI, Bank)
                    Text(text = "Payment Mode", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Cash", "UPI", "Bank").forEach { mode ->
                            val isSelected = selectedPaymentMode == mode
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (isSelected) PrimaryDarkGreen else SoftGreenSurface)
                                    .clickable { selectedPaymentMode = mode }
                                    .padding(vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = mode,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) SurfaceWhite else PrimaryDarkGreen
                                )
                            }
                        }
                    }

                    OutlinedTextField(
                        value = referenceInput,
                        onValueChange = { referenceInput = it },
                        label = { Text("Reference / UTR / Cheque No. (Optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = remarksInput,
                        onValueChange = { remarksInput = it },
                        label = { Text("Remarks (Optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            }

            // Note on Double Entry
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = SoftGreenSurface),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "Double Entry Posting:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = PrimaryDarkGreen)
                    Text(text = "• Debit: $selectedPaymentMode Account ₹$receiptAmount\n• Credit: Customer Receivable ₹$receiptAmount (Reduces customer outstanding)", fontSize = 11.sp, color = OnSurfaceVariantText)
                }
            }
        }
    }
}
