package com.msbook.app.ui.screens.business_details

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.msbook.app.data.repository.BusinessRepository
import com.msbook.app.domain.model.BusinessType
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class BusinessDetailsUiState(
    val businessType: BusinessType = BusinessType.KIRANA,
    val businessName: String = "",
    val ownerName: String = "",
    val mobileNumber: String = "",
    val address: String = "",
    val businessNameError: String? = null,
    val isLoading: Boolean = false
)

sealed interface BusinessDetailsEvent {
    data class Success(val businessId: String) : BusinessDetailsEvent
    data class Error(val message: String) : BusinessDetailsEvent
}

class BusinessDetailsViewModel(
    private val repository: BusinessRepository,
    private val initialBusinessType: BusinessType
) : ViewModel() {

    private val _uiState = MutableStateFlow(BusinessDetailsUiState(businessType = initialBusinessType))
    val uiState: StateFlow<BusinessDetailsUiState> = _uiState.asStateFlow()

    private val _events = MutableSharedFlow<BusinessDetailsEvent>()
    val events: SharedFlow<BusinessDetailsEvent> = _events.asSharedFlow()

    fun onBusinessNameChange(value: String) {
        _uiState.update {
            it.copy(
                businessName = value,
                businessNameError = if (value.isNotBlank()) null else it.businessNameError
            )
        }
    }

    fun onOwnerNameChange(value: String) {
        _uiState.update { it.copy(ownerName = value) }
    }

    fun onMobileNumberChange(value: String) {
        _uiState.update { it.copy(mobileNumber = value) }
    }

    fun onAddressChange(value: String) {
        _uiState.update { it.copy(address = value) }
    }

    fun onSubmit() {
        val currentState = _uiState.value
        val trimmedName = currentState.businessName.trim()

        if (trimmedName.isEmpty()) {
            _uiState.update { it.copy(businessNameError = "Business name is required") }
            return
        }

        if (currentState.isLoading) return

        _uiState.update { it.copy(isLoading = true, businessNameError = null) }

        viewModelScope.launch {
            val result = repository.createBusiness(
                name = trimmedName,
                type = currentState.businessType,
                ownerName = currentState.ownerName,
                mobileNumber = currentState.mobileNumber,
                address = currentState.address
            )

            result.fold(
                onSuccess = { createdBusiness ->
                    _uiState.update { it.copy(isLoading = false) }
                    _events.emit(BusinessDetailsEvent.Success(createdBusiness.id))
                },
                onFailure = { error ->
                    _uiState.update { it.copy(isLoading = false) }
                    _events.emit(BusinessDetailsEvent.Error(error.localizedMessage ?: "Failed to save business"))
                }
            )
        }
    }

    class Factory(
        private val repository: BusinessRepository,
        private val businessType: BusinessType
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return BusinessDetailsViewModel(repository, businessType) as T
        }
    }
}
