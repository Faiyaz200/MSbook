package com.msbook.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.msbook.app.domain.model.Business
import com.msbook.app.domain.model.BusinessType

/**
 * Room Database entity for persistent storage of business profiles.
 */
@Entity(tableName = "businesses")
data class BusinessEntity(
    @PrimaryKey
    val id: String,
    val businessName: String,
    val businessType: String,
    val ownerName: String = "",
    val mobileNumber: String = "",
    val address: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    fun toDomain(): Business {
        return Business(
            id = id,
            businessName = businessName,
            businessType = BusinessType.fromString(businessType),
            ownerName = ownerName,
            mobileNumber = mobileNumber,
            address = address,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }

    companion object {
        fun fromDomain(domain: Business): BusinessEntity {
            return BusinessEntity(
                id = domain.id,
                businessName = domain.businessName,
                businessType = domain.businessType.name,
                ownerName = domain.ownerName,
                mobileNumber = domain.mobileNumber,
                address = domain.address,
                createdAt = domain.createdAt,
                updatedAt = domain.updatedAt
            )
        }
    }
}
