package com.msbook.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.msbook.app.data.local.entity.JournalEntryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface JournalDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertJournalEntries(entries: List<JournalEntryEntity>)

    @Query("SELECT * FROM journal_entries WHERE businessId = :businessId ORDER BY date ASC, id ASC")
    suspend fun getJournalEntriesByBusiness(businessId: String): List<JournalEntryEntity>

    @Query("SELECT * FROM journal_entries WHERE businessId = :businessId AND accountName = :accountName ORDER BY date ASC")
    suspend fun getJournalEntriesByAccount(businessId: String, accountName: String): List<JournalEntryEntity>

    @Query("SELECT * FROM journal_entries WHERE businessId = :businessId AND partyId = :partyId ORDER BY date ASC")
    suspend fun getJournalEntriesByParty(businessId: String, partyId: String): List<JournalEntryEntity>

    @Query("SELECT COALESCE(SUM(debit), 0.0) - COALESCE(SUM(credit), 0.0) FROM journal_entries WHERE businessId = :businessId AND partyId = :partyId AND accountName = 'Customer Receivable'")
    suspend fun getCustomerOutstandingBalance(businessId: String, partyId: String): Double

    @Query("SELECT COALESCE(SUM(debit), 0.0) - COALESCE(SUM(credit), 0.0) FROM journal_entries WHERE businessId = :businessId AND accountName = :accountName")
    suspend fun getAccountBalance(businessId: String, accountName: String): Double
}
