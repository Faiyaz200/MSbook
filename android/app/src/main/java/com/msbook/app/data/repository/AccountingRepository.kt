package com.msbook.app.data.repository

import com.msbook.app.data.local.dao.CustomerDao
import com.msbook.app.data.local.dao.JournalDao
import com.msbook.app.data.local.dao.ProductDao
import com.msbook.app.data.local.dao.SupplierDao
import com.msbook.app.data.local.dao.VoucherDao
import com.msbook.app.data.local.entity.CustomerEntity
import com.msbook.app.data.local.entity.JournalEntryEntity
import com.msbook.app.data.local.entity.ProductEntity
import com.msbook.app.data.local.entity.SupplierEntity
import com.msbook.app.data.local.entity.VoucherEntity
import com.msbook.app.data.local.entity.VoucherItemEntity
import com.msbook.app.domain.model.VoucherType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.util.UUID

data class CustomerLedgerSummary(
    val customer: CustomerEntity,
    val totalSales: Double,
    val cashReceived: Double,
    val upiReceived: Double,
    val bankReceived: Double,
    val totalReceived: Double,
    val totalOutstanding: Double,
    val transactions: List<CustomerTransactionRow>
)

data class CustomerTransactionRow(
    val voucherId: String,
    val voucherNumber: String,
    val date: Long,
    val voucherType: String,
    val productDetails: String,
    val totalBill: Double,
    val cashPaid: Double,
    val upiPaid: Double,
    val bankPaid: Double,
    val udhar: Double,
    val runningBalance: Double
)

data class CartItem(
    val productId: String?,
    val productName: String,
    val quantity: Double,
    val unit: String,
    val variantInfo: String,
    val sellingPrice: Double,
    val purchaseCost: Double,
    val discount: Double = 0.0
) {
    val lineTotal: Double
        get() = (quantity * sellingPrice) - discount
}

class AccountingRepository(
    private val customerDao: CustomerDao,
    private val supplierDao: SupplierDao,
    private val productDao: ProductDao,
    private val voucherDao: VoucherDao,
    private val journalDao: JournalDao
) {
    private val transactionMutex = Mutex()

    // Customers
    fun getCustomersFlow(businessId: String): Flow<List<CustomerEntity>> =
        customerDao.getCustomersByBusinessFlow(businessId)

    suspend fun getCustomers(businessId: String): List<CustomerEntity> = withContext(Dispatchers.IO) {
        customerDao.getCustomersByBusiness(businessId)
    }

    suspend fun createCustomer(businessId: String, name: String, mobile: String, address: String): CustomerEntity =
        withContext(Dispatchers.IO) {
            val customer = CustomerEntity(
                id = UUID.randomUUID().toString(),
                businessId = businessId,
                name = name.trim(),
                mobileNumber = mobile.trim(),
                address = address.trim()
            )
            customerDao.insertCustomer(customer)
            customer
        }

    // Products
    fun getProductsFlow(businessId: String): Flow<List<ProductEntity>> =
        productDao.getProductsByBusinessFlow(businessId)

    suspend fun getProducts(businessId: String): List<ProductEntity> = withContext(Dispatchers.IO) {
        productDao.getProductsByBusiness(businessId)
    }

    suspend fun getProductByBarcode(businessId: String, barcode: String): ProductEntity? =
        withContext(Dispatchers.IO) {
            productDao.getProductByBarcode(businessId, barcode.trim())
        }

    suspend fun searchProducts(businessId: String, query: String): List<ProductEntity> =
        withContext(Dispatchers.IO) {
            productDao.searchProducts(businessId, query.trim())
        }

    suspend fun createOrUpdateProduct(product: ProductEntity) = withContext(Dispatchers.IO) {
        productDao.insertProduct(product)
    }

    // Journal
    fun getJournalEntriesFlow(businessId: String): Flow<List<JournalEntryEntity>> =
        journalDao.getJournalEntriesFlow(businessId)

    suspend fun getJournalEntries(businessId: String): List<JournalEntryEntity> = withContext(Dispatchers.IO) {
        journalDao.getJournalEntriesByBusiness(businessId)
    }

    // Voucher Number Generation
    suspend fun generateNextVoucherNumber(businessId: String, voucherType: VoucherType): String =
        withContext(Dispatchers.IO) {
            val count = voucherDao.countVouchersByType(businessId, voucherType.name)
            val prefix = when (voucherType) {
                VoucherType.SALES -> "INV"
                VoucherType.PURCHASE -> "PUR"
                VoucherType.RECEIPT -> "RCT"
                VoucherType.PAYMENT -> "PMT"
                VoucherType.SPLIT_PAYMENT -> "SPL"
                VoucherType.CONTRA -> "CNT"
                VoucherType.JOURNAL -> "JRN"
                VoucherType.DEBIT_NOTE -> "DBN"
                VoucherType.CREDIT_NOTE -> "CRN"
            }
            val seq = (count + 1).toString().padStart(4, '0')
            "$prefix-2026-$seq"
        }

    // Save Sales Voucher with Split Payment & Automatic Accounting Entries
    suspend fun saveSalesVoucher(
        businessId: String,
        customer: CustomerEntity?,
        items: List<CartItem>,
        cashAmount: Double,
        upiAmount: Double,
        bankAmount: Double,
        udharAmount: Double,
        date: Long,
        remarks: String?
    ): Result<VoucherEntity> = withContext(Dispatchers.IO) {
        transactionMutex.withLock {
            if (items.isEmpty()) {
                return@withContext Result.failure(IllegalArgumentException("Cart cannot be empty"))
            }

            val invoiceTotal = items.sumOf { it.lineTotal }
            val allocatedTotal = cashAmount + upiAmount + bankAmount + udharAmount

            // Precise rounding check
            if (Math.abs(invoiceTotal - allocatedTotal) > 0.05) {
                return@withContext Result.failure(
                    IllegalArgumentException("Total allocation (₹$allocatedTotal) must equal Invoice Total (₹$invoiceTotal)")
                )
            }

            if (udharAmount > 0.0 && customer == null) {
                return@withContext Result.failure(
                    IllegalArgumentException("Customer must be selected for Udhar / Credit balance")
                )
            }

            val voucherId = UUID.randomUUID().toString()
            val voucherNumber = generateNextVoucherNumber(businessId, VoucherType.SALES)

            // Prevent duplicate posting
            val existing = voucherDao.getVoucherByNumber(businessId, voucherNumber)
            if (existing != null) {
                return@withContext Result.failure(IllegalStateException("Voucher number $voucherNumber already exists"))
            }

            val voucherEntity = VoucherEntity(
                id = voucherId,
                businessId = businessId,
                voucherType = VoucherType.SALES.name,
                voucherNumber = voucherNumber,
                date = date,
                partyId = customer?.id,
                partyName = customer?.name,
                totalAmount = invoiceTotal,
                cashAmount = cashAmount,
                upiAmount = upiAmount,
                bankAmount = bankAmount,
                udharAmount = udharAmount,
                remarks = remarks
            )

            // Line items with frozen cost basis
            val voucherItemEntities = items.map { item ->
                VoucherItemEntity(
                    id = UUID.randomUUID().toString(),
                    voucherId = voucherId,
                    businessId = businessId,
                    productId = item.productId,
                    productName = item.productName,
                    quantity = item.quantity,
                    unit = item.unit,
                    variantInfo = item.variantInfo,
                    sellingPrice = item.sellingPrice,
                    purchaseCostAtSale = item.purchaseCost,
                    discount = item.discount,
                    lineTotal = item.lineTotal
                )
            }

            // Double Entry Journal Entries
            val journalEntries = mutableListOf<JournalEntryEntity>()

            if (cashAmount > 0.0) {
                journalEntries.add(
                    JournalEntryEntity(
                        id = UUID.randomUUID().toString(),
                        businessId = businessId,
                        voucherId = voucherId,
                        accountName = "Cash Account",
                        partyId = customer?.id,
                        debit = cashAmount,
                        credit = 0.0,
                        date = date,
                        narration = "Cash received on $voucherNumber"
                    )
                )
            }

            if (upiAmount > 0.0) {
                journalEntries.add(
                    JournalEntryEntity(
                        id = UUID.randomUUID().toString(),
                        businessId = businessId,
                        voucherId = voucherId,
                        accountName = "UPI Account",
                        partyId = customer?.id,
                        debit = upiAmount,
                        credit = 0.0,
                        date = date,
                        narration = "UPI payment received on $voucherNumber"
                    )
                )
            }

            if (bankAmount > 0.0) {
                journalEntries.add(
                    JournalEntryEntity(
                        id = UUID.randomUUID().toString(),
                        businessId = businessId,
                        voucherId = voucherId,
                        accountName = "Bank Account",
                        partyId = customer?.id,
                        debit = bankAmount,
                        credit = 0.0,
                        date = date,
                        narration = "Bank deposit on $voucherNumber"
                    )
                )
            }

            if (udharAmount > 0.0 && customer != null) {
                journalEntries.add(
                    JournalEntryEntity(
                        id = UUID.randomUUID().toString(),
                        businessId = businessId,
                        voucherId = voucherId,
                        accountName = "Customer Receivable",
                        partyId = customer.id,
                        debit = udharAmount,
                        credit = 0.0,
                        date = date,
                        narration = "Udhar / Credit sale on $voucherNumber to ${customer.name}"
                    )
                )
            }

            // Sales Account Credit
            journalEntries.add(
                JournalEntryEntity(
                    id = UUID.randomUUID().toString(),
                    businessId = businessId,
                    voucherId = voucherId,
                    accountName = "Sales Account",
                    partyId = customer?.id,
                    debit = 0.0,
                    credit = invoiceTotal,
                    date = date,
                    narration = "Sales Revenue for $voucherNumber"
                )
            )

            // COGS & Inventory Asset
            val totalCostOfGoodsSold = items.sumOf { it.quantity * it.purchaseCost }
            if (totalCostOfGoodsSold > 0.0) {
                journalEntries.add(
                    JournalEntryEntity(
                        id = UUID.randomUUID().toString(),
                        businessId = businessId,
                        voucherId = voucherId,
                        accountName = "Cost of Goods Sold",
                        partyId = null,
                        debit = totalCostOfGoodsSold,
                        credit = 0.0,
                        date = date,
                        narration = "COGS for $voucherNumber"
                    )
                )
                journalEntries.add(
                    JournalEntryEntity(
                        id = UUID.randomUUID().toString(),
                        businessId = businessId,
                        voucherId = voucherId,
                        accountName = "Inventory Asset",
                        partyId = null,
                        debit = 0.0,
                        credit = totalCostOfGoodsSold,
                        date = date,
                        narration = "Inventory reduction for $voucherNumber"
                    )
                )
            }

            // Atomic writes to Room
            voucherDao.insertVoucher(voucherEntity)
            voucherDao.insertVoucherItems(voucherItemEntities)
            journalDao.insertJournalEntries(journalEntries)

            // Deduct stock
            items.forEach { item ->
                if (!item.productId.isNullOrBlank()) {
                    productDao.adjustStock(item.productId, -item.quantity)
                }
            }

            Result.success(voucherEntity)
        }
    }

    // Save Receipt Voucher (Customer payment of outstanding amount)
    suspend fun saveReceiptVoucher(
        businessId: String,
        customer: CustomerEntity,
        amount: Double,
        paymentMode: String, // "Cash", "UPI", "Bank"
        date: Long,
        referenceNo: String?,
        remarks: String?
    ): Result<VoucherEntity> = withContext(Dispatchers.IO) {
        transactionMutex.withLock {
            if (amount <= 0.0) {
                return@withContext Result.failure(IllegalArgumentException("Receipt amount must be greater than zero"))
            }

            val voucherId = UUID.randomUUID().toString()
            val voucherNumber = generateNextVoucherNumber(businessId, VoucherType.RECEIPT)

            val cashAmt = if (paymentMode.equals("Cash", ignoreCase = true)) amount else 0.0
            val upiAmt = if (paymentMode.equals("UPI", ignoreCase = true)) amount else 0.0
            val bankAmt = if (paymentMode.equals("Bank", ignoreCase = true)) amount else 0.0

            val voucherEntity = VoucherEntity(
                id = voucherId,
                businessId = businessId,
                voucherType = VoucherType.RECEIPT.name,
                voucherNumber = voucherNumber,
                date = date,
                partyId = customer.id,
                partyName = customer.name,
                totalAmount = amount,
                cashAmount = cashAmt,
                upiAmount = upiAmt,
                bankAmount = bankAmt,
                udharAmount = 0.0,
                referenceNo = referenceNo,
                remarks = remarks
            )

            // Double Entry:
            // Debit: Cash/UPI/Bank Account
            // Credit: Customer Receivable (Reduces outstanding balance!)
            val receivingAccount = when {
                cashAmt > 0.0 -> "Cash Account"
                upiAmt > 0.0 -> "UPI Account"
                else -> "Bank Account"
            }

            val journalEntries = listOf(
                JournalEntryEntity(
                    id = UUID.randomUUID().toString(),
                    businessId = businessId,
                    voucherId = voucherId,
                    accountName = receivingAccount,
                    partyId = customer.id,
                    debit = amount,
                    credit = 0.0,
                    date = date,
                    narration = "Payment received from ${customer.name} on $voucherNumber"
                ),
                JournalEntryEntity(
                    id = UUID.randomUUID().toString(),
                    businessId = businessId,
                    voucherId = voucherId,
                    accountName = "Customer Receivable",
                    partyId = customer.id,
                    debit = 0.0,
                    credit = amount, // Credit decreases receivable!
                    date = date,
                    narration = "Receivable reduction on $voucherNumber from ${customer.name}"
                )
            )

            voucherDao.insertVoucher(voucherEntity)
            journalDao.insertJournalEntries(journalEntries)

            Result.success(voucherEntity)
        }
    }

    // Save Purchase Voucher
    suspend fun savePurchaseVoucher(
        businessId: String,
        supplierName: String,
        items: List<CartItem>,
        cashAmount: Double,
        upiAmount: Double,
        bankAmount: Double,
        creditAmount: Double,
        date: Long,
        remarks: String?
    ): Result<VoucherEntity> = withContext(Dispatchers.IO) {
        transactionMutex.withLock {
            val total = items.sumOf { it.lineTotal }
            val voucherId = UUID.randomUUID().toString()
            val voucherNumber = generateNextVoucherNumber(businessId, VoucherType.PURCHASE)

            val voucher = VoucherEntity(
                id = voucherId,
                businessId = businessId,
                voucherType = VoucherType.PURCHASE.name,
                voucherNumber = voucherNumber,
                date = date,
                partyName = supplierName,
                totalAmount = total,
                cashAmount = cashAmount,
                upiAmount = upiAmount,
                bankAmount = bankAmount,
                udharAmount = creditAmount,
                remarks = remarks
            )

            val voucherItems = items.map { item ->
                VoucherItemEntity(
                    id = UUID.randomUUID().toString(),
                    voucherId = voucherId,
                    businessId = businessId,
                    productId = item.productId,
                    productName = item.productName,
                    quantity = item.quantity,
                    unit = item.unit,
                    variantInfo = item.variantInfo,
                    sellingPrice = item.sellingPrice,
                    purchaseCostAtSale = item.purchaseCost,
                    discount = item.discount,
                    lineTotal = item.lineTotal
                )
            }

            val journals = mutableListOf<JournalEntryEntity>()
            // Debit Inventory Asset
            journals.add(
                JournalEntryEntity(
                    id = UUID.randomUUID().toString(),
                    businessId = businessId,
                    voucherId = voucherId,
                    accountName = "Inventory Asset",
                    partyId = null,
                    debit = total,
                    credit = 0.0,
                    date = date,
                    narration = "Stock purchase $voucherNumber from $supplierName"
                )
            )

            if (cashAmount > 0.0) {
                journals.add(
                    JournalEntryEntity(
                        id = UUID.randomUUID().toString(),
                        businessId = businessId,
                        voucherId = voucherId,
                        accountName = "Cash Account",
                        partyId = null,
                        debit = 0.0,
                        credit = cashAmount,
                        date = date,
                        narration = "Cash paid on purchase $voucherNumber"
                    )
                )
            }
            if (upiAmount > 0.0) {
                journals.add(
                    JournalEntryEntity(
                        id = UUID.randomUUID().toString(),
                        businessId = businessId,
                        voucherId = voucherId,
                        accountName = "UPI Account",
                        partyId = null,
                        debit = 0.0,
                        credit = upiAmount,
                        date = date,
                        narration = "UPI paid on purchase $voucherNumber"
                    )
                )
            }
            if (creditAmount > 0.0) {
                journals.add(
                    JournalEntryEntity(
                        id = UUID.randomUUID().toString(),
                        businessId = businessId,
                        voucherId = voucherId,
                        accountName = "Supplier Payable",
                        partyId = null,
                        debit = 0.0,
                        credit = creditAmount,
                        date = date,
                        narration = "Credit purchase from $supplierName"
                    )
                )
            }

            voucherDao.insertVoucher(voucher)
            voucherDao.insertVoucherItems(voucherItems)
            journalDao.insertJournalEntries(journals)

            // Increment stock
            items.forEach { item ->
                if (!item.productId.isNullOrBlank()) {
                    productDao.adjustStock(item.productId, item.quantity)
                }
            }

            Result.success(voucher)
        }
    }

    // Complete Customer Ledger Report
    suspend fun getCustomerLedger(businessId: String, customerId: String): CustomerLedgerSummary =
        withContext(Dispatchers.IO) {
            val customer = customerDao.getCustomerById(customerId)
                ?: throw IllegalArgumentException("Customer not found")

            val vouchers = voucherDao.getVouchersByParty(businessId, customerId)
            var runningBalance = 0.0
            var totalSales = 0.0
            var totalCash = 0.0
            var totalUpi = 0.0
            var totalBank = 0.0

            val rows = mutableListOf<CustomerTransactionRow>()

            vouchers.forEach { v ->
                val items = voucherDao.getVoucherItems(v.id)
                val itemSummary = if (items.isNotEmpty()) {
                    items.joinToString(", ") { "${it.productName} (${it.quantity} ${it.unit})" }
                } else if (v.voucherType == VoucherType.RECEIPT.name) {
                    "Payment Received (${if (v.cashAmount > 0) "Cash" else if (v.upiAmount > 0) "UPI" else "Bank"})"
                } else {
                    v.remarks ?: "Accounting Entry"
                }

                if (v.voucherType == VoucherType.SALES.name || v.voucherType == VoucherType.SPLIT_PAYMENT.name) {
                    totalSales += v.totalAmount
                    totalCash += v.cashAmount
                    totalUpi += v.upiAmount
                    totalBank += v.bankAmount
                    // Udhar adds to outstanding balance
                    runningBalance += v.udharAmount
                } else if (v.voucherType == VoucherType.RECEIPT.name) {
                    totalCash += v.cashAmount
                    totalUpi += v.upiAmount
                    totalBank += v.bankAmount
                    // Receipt reduces outstanding balance
                    runningBalance -= v.totalAmount
                }

                rows.add(
                    CustomerTransactionRow(
                        voucherId = v.id,
                        voucherNumber = v.voucherNumber,
                        date = v.date,
                        voucherType = v.voucherType,
                        productDetails = itemSummary,
                        totalBill = v.totalAmount,
                        cashPaid = v.cashAmount,
                        upiPaid = v.upiAmount,
                        bankPaid = v.bankAmount,
                        udhar = v.udharAmount,
                        runningBalance = runningBalance
                    )
                )
            }

            val totalReceived = totalCash + totalUpi + totalBank
            val totalOutstanding = journalDao.getCustomerOutstandingBalance(businessId, customerId)

            CustomerLedgerSummary(
                customer = customer,
                totalSales = totalSales,
                cashReceived = totalCash,
                upiReceived = totalUpi,
                bankReceived = totalBank,
                totalReceived = totalReceived,
                totalOutstanding = Math.max(0.0, totalOutstanding),
                transactions = rows
            )
        }
}
