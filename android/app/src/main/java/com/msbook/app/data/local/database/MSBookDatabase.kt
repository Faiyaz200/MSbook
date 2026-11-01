package com.msbook.app.data.local.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.msbook.app.data.local.dao.BusinessDao
import com.msbook.app.data.local.dao.CustomerDao
import com.msbook.app.data.local.dao.JournalDao
import com.msbook.app.data.local.dao.ProductDao
import com.msbook.app.data.local.dao.SupplierDao
import com.msbook.app.data.local.dao.VoucherDao
import com.msbook.app.data.local.entity.BusinessEntity
import com.msbook.app.data.local.entity.CustomerEntity
import com.msbook.app.data.local.entity.JournalEntryEntity
import com.msbook.app.data.local.entity.ProductEntity
import com.msbook.app.data.local.entity.SupplierEntity
import com.msbook.app.data.local.entity.VoucherEntity
import com.msbook.app.data.local.entity.VoucherItemEntity

/**
 * Main Room Database for MSbook.
 * Houses business identities, customer/supplier ledgers, product catalog with fractional units/variants,
 * multi-mode split vouchers, voucher line items with cost basis, and double-entry journals.
 */
@Database(
    entities = [
        BusinessEntity::class,
        CustomerEntity::class,
        SupplierEntity::class,
        ProductEntity::class,
        VoucherEntity::class,
        VoucherItemEntity::class,
        JournalEntryEntity::class
    ],
    version = 2,
    exportSchema = false
)
abstract class MSBookDatabase : RoomDatabase() {

    abstract fun businessDao(): BusinessDao
    abstract fun customerDao(): CustomerDao
    abstract fun supplierDao(): SupplierDao
    abstract fun productDao(): ProductDao
    abstract fun voucherDao(): VoucherDao
    abstract fun journalDao(): JournalDao

    companion object {
        @Volatile
        private var INSTANCE: MSBookDatabase? = null

        fun getInstance(context: Context): MSBookDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    MSBookDatabase::class.java,
                    "msbook_database.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
