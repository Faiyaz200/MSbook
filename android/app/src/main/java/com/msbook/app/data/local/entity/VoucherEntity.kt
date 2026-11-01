package com.msbook.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Header record for all accounting vouchers (Sales, Purchase, Receipt, Payment, etc.).
 * Stores multi-mode payment allocation: Cash, UPI, Bank, Udhar.
 */
@Entity(
    tableName = "vouchers",
    indices = [
        Index(value = ["businessId", "voucherNumber"], unique = true),
        Index(value = ["businessId", "voucherType"]),
        Index(value = ["businessId", "partyId"]),
        Index(value = ["businessId", "date"])
    ]
)
data class VoucherEntity(
    @PrimaryKey
    val id: String,
    val businessId: String,
    val voucherType: String,
    val voucherNumber: String,
    val date: Long,
    val partyId: String? = null,
    val partyName: String? = null,
    val totalAmount: Double,
    val cashAmount: Double = 0.0,
    val upiAmount: Double = 0.0,
    val bankAmount: Double = 0.0,
    val udharAmount: Double = 0.0, // Remaining due / Credit
    val referenceNo: String? = null,
    val remarks: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
