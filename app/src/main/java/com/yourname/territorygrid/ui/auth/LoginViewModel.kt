package com.yourname.territorygrid.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.FirebaseNetworkException
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthInvalidUserException
import com.yourname.territorygrid.data.repository.AuthRepository
import com.yourname.territorygrid.data.repository.AuthState
import com.yourname.territorygrid.domain.model.Role
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
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

    fun selectPortal(role: Role) {
        _uiState.update {
            it.copy(
                mode = LoginScreenMode.PORTAL_LOGIN,
                selectedRole = role,
                email = if (role == Role.ADMIN) "samay" else "",
                pass = if (role == Role.ADMIN) "samay" else "",
                errorMessage = null
            )
        }
    }

    fun returnToPortalChooser() {
        _uiState.update {
            it.copy(
                mode = LoginScreenMode.PORTAL_CHOOSER,
                selectedRole = null,
                errorMessage = null
            )
        }
    }

    fun onEmailChanged(email: String) {
        _uiState.update { it.copy(email = email, errorMessage = null) }
    }

    fun onPasswordChanged(password: String) {
        _uiState.update { it.copy(pass = password, errorMessage = null) }
    }

    fun onTogglePasswordVisibility() {
        _uiState.update { it.copy(isPasswordVisible = !it.isPasswordVisible) }
    }

    fun clearError() {
        _uiState.update { it.copy(errorMessage = null) }
    }

    fun submitLogin() {
        val currentState = _uiState.value
        val rawEmail = currentState.email.trim()
        val rawPass = currentState.pass.trim()
        val expectedRole = currentState.selectedRole ?: Role.PLAYER

        if (rawEmail.isBlank() || rawPass.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Clearance denied: Please enter both callsign and access key.") }
            return
        }

        val isSamayAdmin = rawEmail.equals("samay", ignoreCase = true) && rawPass == "samay"

        if (!isSamayAdmin && rawPass.length < 6) {
            _uiState.update { it.copy(errorMessage = "Security protocol: Access key must be at least 6 characters.") }
            return
        }

        if (isSamayAdmin && expectedRole != Role.ADMIN) {
            _uiState.update { it.copy(errorMessage = "Access Restricted: 'samay' holds Game Master clearance. Please use the Admin Portal.") }
            return
        }

        val resolvedEmail = if (!rawEmail.contains("@")) {
            if (isSamayAdmin) "samay" else "$rawEmail@recon.grid"
        } else {
            rawEmail
        }

        _uiState.update { it.copy(isLoading = true, errorMessage = null) }

        viewModelScope.launch {
            val result = authRepository.signIn(resolvedEmail, rawPass)
            if (result.isSuccess) {
                // Verify account role matches the chosen portal!
                val authFlow = authRepository.authState
                for (i in 1..25) {
                    val currentAuth = authFlow.value
                    if (currentAuth is AuthState.SignedIn) {
                        if (currentAuth.user.role != expectedRole) {
                            authRepository.signOut()
                            _uiState.update {
                                it.copy(
                                    isLoading = false,
                                    errorMessage = "Portal Access Denied: Account '${currentAuth.user.name}' has role ${currentAuth.user.role.name}, but you are accessing the ${expectedRole.name} Portal. Access restricted."
                                )
                            }
                            return@launch
                        } else {
                            break
                        }
                    }
                    delay(40)
                }
                _uiState.update { it.copy(isLoading = false, errorMessage = null) }
            } else {
                val ex = result.exceptionOrNull()
                val message = when (ex) {
                    is FirebaseAuthInvalidCredentialsException -> "Clearance rejected: Invalid callsign or access key."
                    is FirebaseAuthInvalidUserException -> "Unrecognized agent: ID not found in grid database."
                    is FirebaseNetworkException -> "Comms blacked out: Network connection unavailable."
                    else -> ex?.localizedMessage ?: "Terminal authentication error. Check credentials."
                }
                _uiState.update { it.copy(isLoading = false, errorMessage = message) }
            }
        }
    }
}
