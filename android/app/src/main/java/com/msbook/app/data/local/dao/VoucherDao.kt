package com.msbook.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.msbook.app.data.local.entity.VoucherEntity
import com.msbook.app.data.local.entity.VoucherItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface VoucherDao {

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertVoucher(voucher: VoucherEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVoucherItems(items: List<VoucherItemEntity>)

    @Query("SELECT * FROM vouchers WHERE businessId = :businessId ORDER BY date DESC, createdAt DESC")
    fun getVouchersByBusinessFlow(businessId: String): Flow<List<VoucherEntity>>

    @Query("SELECT * FROM vouchers WHERE businessId = :businessId ORDER BY date DESC, createdAt DESC")
    suspend fun getVouchersByBusiness(businessId: String): List<VoucherEntity>

    @Query("SELECT * FROM vouchers WHERE id = :id LIMIT 1")
    suspend fun getVoucherById(id: String): VoucherEntity?

    @Query("SELECT * FROM voucher_items WHERE voucherId = :voucherId")
    suspend fun getVoucherItems(voucherId: String): List<VoucherItemEntity>

    @Query("SELECT * FROM vouchers WHERE businessId = :businessId AND partyId = :partyId ORDER BY date ASC, createdAt ASC")
    suspend fun getVouchersByParty(businessId: String, partyId: String): List<VoucherEntity>

    @Query("SELECT * FROM vouchers WHERE businessId = :businessId AND partyId = :partyId ORDER BY date ASC, createdAt ASC")
    fun getVouchersByPartyFlow(businessId: String, partyId: String): Flow<List<VoucherEntity>>

    @Query("SELECT COUNT(*) FROM vouchers WHERE businessId = :businessId AND voucherType = :voucherType")
    suspend fun countVouchersByType(businessId: String, voucherType: String): Int

    @Query("SELECT * FROM vouchers WHERE businessId = :businessId AND voucherNumber = :voucherNumber LIMIT 1")
    suspend fun getVoucherByNumber(businessId: String, voucherNumber: String): VoucherEntity?
}
