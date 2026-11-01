package com.msbook.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Product inventory master record per business ID.
 * Supports fractional quantities (Kirana: kg, g, ltr, etc.) and size/color variants (Clothing).
 */
@Entity(
    tableName = "products",
    indices = [
        Index(value = ["businessId", "barcode"]),
        Index(value = ["businessId", "name"])
    ]
)
data class ProductEntity(
    @PrimaryKey
    val id: String,
    val businessId: String,
    val name: String,
    val barcode: String = "",
    val unit: String = "pcs", // kg, g, pcs, mtr, pkt, box
    val sellingPrice: Double,
    val purchaseCost: Double, // Cost basis for COGS calculation
    val stockQuantity: Double = 0.0, // Fractional allowed (e.g. 15.5 kg or 12 pcs)
    val variantInfo: String = "", // e.g. "Size 42 / Cotton Navy" for Clothing
    val createdAt: Long = System.currentTimeMillis()
)
