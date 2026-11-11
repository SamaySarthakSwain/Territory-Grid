package com.yourname.territorygrid.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.FirebaseNetworkException
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.yourname.territorygrid.data.repository.AuthRepository
import com.yourname.territorygrid.domain.model.Role
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmailChanged(email: String) {
        _uiState.update { it.copy(email = email, errorMessage = null) }
    }

    fun onPasswordChanged(password: String) {
        _uiState.update { it.copy(pass = password, errorMessage = null) }
    }

    fun onTogglePasswordVisibility() {
        _uiState.update { it.copy(isPasswordVisible = !it.isPasswordVisible) }
    }

    fun onRoleHintSelected(role: Role) {
        _uiState.update { it.copy(selectedRoleHint = role) }
    }

    fun onSquadTokenChanged(token: String) {
        _uiState.update { it.copy(squadToken = token, errorMessage = null) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun submitLogin() {
        val currentState = _uiState.value
        val rawEmail = currentState.email.trim()
        val rawPass = currentState.pass.trim()

        if (rawEmail.isBlank() || rawPass.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Clearance denied: Please enter both callsign and access key.") }
            return
        }

        if (rawPass.length < 6) {
            _uiState.update { it.copy(errorMessage = "Security protocol: Access key must be at least 6 characters.") }
            return
        }

        // Support both callsign-style aliases and standard emails
        val resolvedEmail = if (!rawEmail.contains("@")) {
            "$rawEmail@recon.grid"
        } else {
            rawEmail
        }

        _uiState.update { it.copy(isLoading = true, errorMessage = null) }

        viewModelScope.launch {
            val result = authRepository.signIn(resolvedEmail, rawPass)
            _uiState.update {
                if (result.isSuccess) {
                    it.copy(isLoading = false, errorMessage = null)
                } else {
                    val ex = result.exceptionOrNull()
                    val message = when (ex) {
                        is FirebaseAuthInvalidCredentialsException -> "Clearance rejected: Invalid callsign or access key."
                        is FirebaseAuthInvalidUserException -> "Unrecognized agent: ID not found in grid database."
                        is FirebaseNetworkException -> "Comms blacked out: Network connection unavailable."
                        else -> ex?.localizedMessage ?: "Terminal authentication error. Check credentials."
                    }
                    it.copy(isLoading = false, errorMessage = message)
                }
            }
        }
    }
}
