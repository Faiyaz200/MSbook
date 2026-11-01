package com.msbook.app.data.repository

import com.msbook.app.data.local.dao.BusinessDao
import com.msbook.app.data.local.entity.BusinessEntity
import com.msbook.app.data.preferences.UserPreferencesManager
import com.msbook.app.domain.model.Business
import com.msbook.app.domain.model.BusinessType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.util.UUID

/**
 * Single source of truth for business operations and active business state.
 */
class BusinessRepository(
    private val businessDao: BusinessDao,
    private val preferencesManager: UserPreferencesManager
) {
    private val createMutex = Mutex()

    /**
     * Flow emitting all businesses ordered by creation date.
     */
    val allBusinessesFlow: Flow<List<Business>> = businessDao.getAllBusinessesFlow()
        .map { entities -> entities.map { it.toDomain() } }
        .flowOn(Dispatchers.IO)

    /**
     * Flow of the currently active business ID.
     */
    val activeBusinessIdFlow: Flow<String?> = preferencesManager.activeBusinessIdFlow
        .distinctUntilChanged()
        .flowOn(Dispatchers.IO)

    /**
     * Reactive flow of the currently active Business object.
     * Re-emits automatically whenever the active business ID changes or the business record is updated.
     */
    @OptIn(ExperimentalCoroutinesApi::class)
    val activeBusinessFlow: Flow<Business?> = activeBusinessIdFlow.flatMapLatest { activeId ->
        if (activeId.isNullOrBlank()) {
            flowOf(null)
        } else {
            businessDao.getBusinessByIdFlow(activeId).map { it?.toDomain() }
        }
    }.flowOn(Dispatchers.IO)

    /**
     * Check if at least one business exists.
     */
    suspend fun hasAnyBusiness(): Boolean = withContext(Dispatchers.IO) {
        businessDao.getBusinessCount() > 0
    }

    /**
     * Retrieve current active business ID synchronously from preferences.
     */
    suspend fun getActiveBusinessId(): String? = withContext(Dispatchers.IO) {
        preferencesManager.getActiveBusinessId()
    }

    /**
     * Creates a new business, saves it to Room DB, and sets it as active.
     * Uses a Mutex to prevent accidental duplicate business creation from rapid button taps.
     */
    suspend fun createBusiness(
        name: String,
        type: BusinessType,
        ownerName: String = "",
        mobileNumber: String = "",
        address: String = ""
    ): Result<Business> = withContext(Dispatchers.IO) {
        createMutex.withLock {
            val trimmedName = name.trim()
            if (trimmedName.isEmpty()) {
                return@withContext Result.failure(IllegalArgumentException("Business name cannot be empty"))
            }

            val newId = UUID.randomUUID().toString()
            val currentTime = System.currentTimeMillis()

            val entity = BusinessEntity(
                id = newId,
                businessName = trimmedName,
                businessType = type.name,
                ownerName = ownerName.trim(),
                mobileNumber = mobileNumber.trim(),
                address = address.trim(),
                createdAt = currentTime,
                updatedAt = currentTime
            )

            businessDao.insertBusiness(entity)
            preferencesManager.setActiveBusinessId(newId)

            Result.success(entity.toDomain())
        }
    }

    /**
     * Switch active business to the selected business ID.
     */
    suspend fun switchBusiness(businessId: String) = withContext(Dispatchers.IO) {
        val business = businessDao.getBusinessById(businessId)
        if (business != null) {
            preferencesManager.setActiveBusinessId(businessId)
        }
    }

    /**
     * Ensure an active business is selected if none currently is, picking the first existing one.
     */
    suspend fun ensureActiveBusiness(): String? = withContext(Dispatchers.IO) {
        val currentActive = preferencesManager.getActiveBusinessId()
        if (currentActive != null) {
            val exists = businessDao.getBusinessById(currentActive)
            if (exists != null) return@withContext currentActive
        }

        val all = businessDao.getAllBusinesses()
        if (all.isNotEmpty()) {
            val firstId = all.first().id
            preferencesManager.setActiveBusinessId(firstId)
            firstId
        } else {
            preferencesManager.clearActiveBusinessId()
            null
        }
    }
}
