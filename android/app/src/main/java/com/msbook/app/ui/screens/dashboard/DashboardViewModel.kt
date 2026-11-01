package com.msbook.app.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.msbook.app.data.repository.BusinessRepository
import com.msbook.app.domain.model.Business
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

data class DashboardUiState(
    val activeBusiness: Business? = null,
    val isLoading: Boolean = true
)

class DashboardViewModel(
    private val repository: BusinessRepository
) : ViewModel() {

    val uiState: StateFlow<DashboardUiState> = repository.activeBusinessFlow
        .map { business ->
            DashboardUiState(activeBusiness = business, isLoading = false)
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = DashboardUiState(isLoading = true)
        )

    class Factory(
        private val repository: BusinessRepository
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return DashboardViewModel(repository) as T
        }
    }
}
