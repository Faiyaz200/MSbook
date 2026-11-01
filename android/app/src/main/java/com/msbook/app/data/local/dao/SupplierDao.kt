package com.msbook.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.msbook.app.data.local.entity.SupplierEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SupplierDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSupplier(supplier: SupplierEntity)

    @Update
    suspend fun updateSupplier(supplier: SupplierEntity)

    @Query("SELECT * FROM suppliers WHERE businessId = :businessId ORDER BY name ASC")
    fun getSuppliersByBusinessFlow(businessId: String): Flow<List<SupplierEntity>>

    @Query("SELECT * FROM suppliers WHERE businessId = :businessId ORDER BY name ASC")
    suspend fun getSuppliersByBusiness(businessId: String): List<SupplierEntity>

    @Query("SELECT * FROM suppliers WHERE id = :id LIMIT 1")
    suspend fun getSupplierById(id: String): SupplierEntity?
}
