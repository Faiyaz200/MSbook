package com.msbook.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.msbook.app.data.local.entity.BusinessEntity
import kotlinx.coroutines.flow.Flow

/**
 * Data Access Object for businesses in Room database.
 */
@Dao
interface BusinessDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBusiness(business: BusinessEntity)

    @Update
    suspend fun updateBusiness(business: BusinessEntity)

    @Query("SELECT * FROM businesses ORDER BY createdAt ASC")
    fun getAllBusinessesFlow(): Flow<List<BusinessEntity>>

    @Query("SELECT * FROM businesses ORDER BY createdAt ASC")
    suspend fun getAllBusinesses(): List<BusinessEntity>

    @Query("SELECT * FROM businesses WHERE id = :id LIMIT 1")
    fun getBusinessByIdFlow(id: String): Flow<BusinessEntity?>

    @Query("SELECT * FROM businesses WHERE id = :id LIMIT 1")
    suspend fun getBusinessById(id: String): BusinessEntity?

    @Query("SELECT COUNT(*) FROM businesses")
    suspend fun getBusinessCount(): Int

    @Query("DELETE FROM businesses WHERE id = :id")
    suspend fun deleteBusinessById(id: String)
}
