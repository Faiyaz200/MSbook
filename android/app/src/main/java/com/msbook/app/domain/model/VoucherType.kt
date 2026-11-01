package com.msbook.app.domain.model

/**
 * Enumeration of all voucher types supported by MSbook.
 * Includes 5 primary options (Sales, Purchase, Receipt, Payment, Split Payment)
 * and 4 More Vouchers (Contra, Journal, Debit Note, Credit Note).
 */
enum class VoucherType(
    val title: String,
    val subtitle: String,
    val defaultPrefix: String,
    val isPrimary: Boolean
) {
    SALES(
        title = "Sales Voucher",
        subtitle = "Create Sales Bill",
        defaultPrefix = "SLS",
        isPrimary = true
    ),
    PURCHASE(
        title = "Purchase Voucher",
        subtitle = "Record Purchase",
        defaultPrefix = "PUR",
        isPrimary = true
    ),
    RECEIPT(
        title = "Receipt Voucher",
        subtitle = "Receive Payment",
        defaultPrefix = "RCT",
        isPrimary = true
    ),
    PAYMENT(
        title = "Payment Voucher",
        subtitle = "Make Payment",
        defaultPrefix = "PMT",
        isPrimary = true
    ),
    SPLIT_PAYMENT(
        title = "Split Payment",
        subtitle = "Multi-Mode Cash/UPI/Udhar",
        defaultPrefix = "SPL",
        isPrimary = true
    ),
    CONTRA(
        title = "Contra Voucher",
        subtitle = "Bank & Cash Transfers",
        defaultPrefix = "CNT",
        isPrimary = false
    ),
    JOURNAL(
        title = "Journal Voucher",
        subtitle = "Adjustment & Non-Cash Entries",
        defaultPrefix = "JRN",
        isPrimary = false
    ),
    DEBIT_NOTE(
        title = "Debit Note",
        subtitle = "Purchase Returns & Supplier Debit",
        defaultPrefix = "DBN",
        isPrimary = false
    ),
    CREDIT_NOTE(
        title = "Credit Note",
        subtitle = "Sales Returns & Customer Credit",
        defaultPrefix = "CRN",
        isPrimary = false
    );

    companion object {
        fun fromString(name: String): VoucherType {
            return entries.find { it.name.equals(name, ignoreCase = true) } ?: SALES
        }
    }
}
