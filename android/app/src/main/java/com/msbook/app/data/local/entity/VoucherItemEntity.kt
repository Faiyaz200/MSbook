package com.msbook.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Line item record for vouchers (Sales & Purchase).
 * Captures product cost basis at the exact time of transaction.
 */
@Entity(
    tableName = "voucher_items",
    indices = [
        Index(value = ["voucherId"]),
        Index(value = ["businessId", "productId"])
    ]
)
data class VoucherItemEntity(
    @PrimaryKey
    val id: String,
    val voucherId: String,
    val businessId: String,
    val productId: String? = null,
    val productName: String,
    val quantity: Double,
    val unit: String = "pcs",
    val variantInfo: String = "",
    val sellingPrice: Double,
    val purchaseCostAtSale: Double, // Cost basis frozen at transaction time for accurate COGS/profit
    val discount: Double = 0.0,
    val lineTotal: Double
)
