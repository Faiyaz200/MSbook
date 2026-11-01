package com.msbook.app

import android.app.Application
import com.msbook.app.data.local.database.MSBookDatabase
import com.msbook.app.data.preferences.UserPreferencesManager
import com.msbook.app.data.repository.BusinessRepository

/**
 * Application class for MSbook.
 * Manages singleton Room database and repository instances.
 */
class MSBookApplication : Application() {

    lateinit var database: MSBookDatabase
        private set

    lateinit var preferencesManager: UserPreferencesManager
        private set

    lateinit var businessRepository: BusinessRepository
        private set

    lateinit var accountingRepository: com.msbook.app.data.repository.AccountingRepository
        private set

    override fun onCreate() {
        super.onCreate()
        database = MSBookDatabase.getInstance(this)
        preferencesManager = UserPreferencesManager(this)
        businessRepository = BusinessRepository(
            businessDao = database.businessDao(),
            preferencesManager = preferencesManager
        )
        accountingRepository = com.msbook.app.data.repository.AccountingRepository(
            customerDao = database.customerDao(),
            supplierDao = database.supplierDao(),
            productDao = database.productDao(),
            voucherDao = database.voucherDao(),
            journalDao = database.journalDao()
        )
    }
}
