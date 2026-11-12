package com.yourname.territorygrid.data.repository

import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.domain.model.UserProfile
import kotlinx.coroutines.flow.StateFlow

sealed interface AuthState {
    data object Loading : AuthState
    data object SignedOut : AuthState
    data class SignedIn(val user: UserProfile) : AuthState
    sealed class Error(val message: String) : AuthState {
        data object NoUserDocument : Error("Account profile not initialized in database. Contact Game Master.")
        data object NoRole : Error("Account has no assigned role. Contact Game Master.")
        data class Network(val details: String) : Error(details)
    }
}

interface AuthRepository {
    val authState: StateFlow<AuthState>
    val currentUserId: String?
    suspend fun signIn(email: String, pass: String): Result<Unit>
    suspend fun signOut()
    suspend fun createAccountWithSecondaryApp(
        email: String,
        pass: String,
        role: Role,
        name: String,
        teamId: String?,
        zoneId: String?
    ): Result<String>
}
