package com.msbook.app.data.local.entity

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Standard double-entry journal entry record.
 * Connects debits and credits for Cash, UPI, Bank, Receivables, Sales, COGS, and Inventory.
 */
@Entity(
    tableName = "journal_entries",
    indices = [
        Index(value = ["businessId", "accountName"]),
        Index(value = ["voucherId"]),
        Index(value = ["businessId", "partyId"]),
        Index(value = ["businessId", "date"])
    ]
)
data class JournalEntryEntity(
    @PrimaryKey
    val id: String,
    val businessId: String,
    val voucherId: String,
    val accountName: String, // e.g. "Cash Account", "UPI Account", "Bank Account", "Sales Account", "Customer Receivable", "Supplier Payable", "Cost of Goods Sold", "Inventory Asset"
    val partyId: String? = null,
    val debit: Double = 0.0,
    val credit: Double = 0.0,
    val date: Long,
    val narration: String = ""
)
