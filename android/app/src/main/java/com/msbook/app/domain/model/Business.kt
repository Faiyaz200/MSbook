package com.msbook.app.domain.model

/**
 * Domain model representing a registered business in MSbook.
 */
data class Business(
    val id: String,
    val businessName: String,
    val businessType: BusinessType,
    val ownerName: String = "",
    val mobileNumber: String = "",
    val address: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
