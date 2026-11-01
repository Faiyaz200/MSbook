package com.msbook.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Supplier entity for recording purchases and payables per business ID.
 */
@Entity(
    tableName = "suppliers",
    indices = [
        Index(value = ["businessId", "name"])
    ]
)
data class SupplierEntity(
    @PrimaryKey
    val id: String,
    val businessId: String,
    val name: String,
    val mobileNumber: String = "",
    val address: String = "",
    val createdAt: Long = System.currentTimeMillis()
)
