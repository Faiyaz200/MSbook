package com.msbook.app.data.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "msbook_user_prefs")

/**
 * Manages persistent user preferences, specifically the currently active business ID.
 * Ensures the selected business survives normal app restarts and cold starts.
 */
class UserPreferencesManager(private val context: Context) {

    private object PreferencesKeys {
        val ACTIVE_BUSINESS_ID = stringPreferencesKey("active_business_id")
    }

    val activeBusinessIdFlow: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferencesKeys.ACTIVE_BUSINESS_ID]
    }

    suspend fun getActiveBusinessId(): String? {
        return context.dataStore.data.first()[PreferencesKeys.ACTIVE_BUSINESS_ID]
    }

    suspend fun setActiveBusinessId(businessId: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.ACTIVE_BUSINESS_ID] = businessId
        }
    }

    suspend fun clearActiveBusinessId() {
        context.dataStore.edit { preferences ->
            preferences.remove(PreferencesKeys.ACTIVE_BUSINESS_ID)
        }
    }
}
