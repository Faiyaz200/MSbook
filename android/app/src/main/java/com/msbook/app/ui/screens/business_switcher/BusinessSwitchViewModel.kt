package com.msbook.app.ui.screens.business_switcher

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.msbook.app.data.repository.BusinessRepository
import com.msbook.app.domain.model.Business
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class BusinessSwitchUiState(
    val businesses: List<Business> = emptyList(),
    val activeBusinessId: String? = null,
    val isLoading: Boolean = true
)

class BusinessSwitchViewModel(
    private val repository: BusinessRepository
) : ViewModel() {

    val uiState: StateFlow<BusinessSwitchUiState> = combine(
        repository.allBusinessesFlow,
        repository.activeBusinessIdFlow
    ) { businesses, activeId ->
        BusinessSwitchUiState(
            businesses = businesses,
            activeBusinessId = activeId,
            isLoading = false
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = BusinessSwitchUiState(isLoading = true)
    )

    fun onSelectBusiness(businessId: String, onComplete: () -> Unit) {
        viewModelScope.launch {
            repository.switchBusiness(businessId)
            onComplete()
        }
    }

    class Factory(
        private val repository: BusinessRepository
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return BusinessSwitchViewModel(repository) as T
        }
    }
}
