package com.yourname.territorygrid.data.repository

import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.domain.model.UserProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class FakeAuthRepository : AuthRepository {
    private val _authState = MutableStateFlow<AuthState>(AuthState.SignedOut)
    override val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val _allUsers = MutableStateFlow<List<UserProfile>>(emptyList())
    override val allUsers: StateFlow<List<UserProfile>> = _allUsers.asStateFlow()

    override val currentUserId: String?
        get() = (_authState.value as? AuthState.SignedIn)?.user?.uid

    var signInResult: Result<Unit> = Result.success(Unit)
    var lastSignedInEmail: String? = null
    var lastSignedInPass: String? = null

    override suspend fun signIn(email: String, pass: String): Result<Unit> {
        lastSignedInEmail = email
        lastSignedInPass = pass
        return if (signInResult.isSuccess) {
            _authState.value = AuthState.SignedIn(
                UserProfile(
                    uid = "test-uid",
                    name = "Agent Test",
                    email = email,
                    role = Role.PLAYER,
                    teamId = "alpha-team",
                    zoneId = null,
                    createdAt = null
                )
            )
            Result.success(Unit)
        } else {
            signInResult
        }
    }

    override suspend fun signOut() {
        _authState.value = AuthState.SignedOut
    }

    override suspend fun createAccountWithSecondaryApp(
        email: String,
        pass: String,
        role: Role,
        name: String,
        teamId: String?,
        zoneId: String?
    ): Result<String> {
        return Result.success("generated-uid-123")
    }

    override suspend fun updateUserAssignment(uid: String, teamId: String?, zoneId: String?): Result<Unit> {
        return Result.success(Unit)
    }

    override suspend fun deleteUserDoc(uid: String): Result<Unit> {
        return Result.success(Unit)
    }

    fun setAllUsers(users: List<UserProfile>) {
        _allUsers.value = users
    }

    fun setAuthState(state: AuthState) {
        _authState.value = state
    }
}
