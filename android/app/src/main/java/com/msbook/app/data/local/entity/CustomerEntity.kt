package com.msbook.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Customer profile associated with a specific business ID.
 */
@Entity(
    tableName = "customers",
    indices = [
        Index(value = ["businessId", "name"]),
        Index(value = ["businessId", "mobileNumber"])
    ]
)
data class CustomerEntity(
    @PrimaryKey
    val id: String,
    val businessId: String,
    val name: String,
    val mobileNumber: String = "",
    val address: String = "",
    val createdAt: Long = System.currentTimeMillis()
)
