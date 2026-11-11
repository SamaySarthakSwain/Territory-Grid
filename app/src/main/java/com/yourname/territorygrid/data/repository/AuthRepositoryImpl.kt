package com.yourname.territorygrid.data.repository

import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.yourname.territorygrid.data.mapper.toUserProfile
import com.yourname.territorygrid.domain.model.Role
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore,
    @ApplicationContext private val context: Context
) : AuthRepository {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    override val authState: StateFlow<AuthState> = _authState.asStateFlow()

    override val currentUserId: String?
        get() = auth.currentUser?.uid

    private var userDocListener: ListenerRegistration? = null

    init {
        auth.addAuthStateListener { firebaseAuth ->
            val firebaseUser = firebaseAuth.currentUser
            userDocListener?.remove()

            if (firebaseUser == null) {
                _authState.value = AuthState.SignedOut
            } else {
                _authState.value = AuthState.Loading
                // Attach live snapshot listener to users/{uid} for dynamic role changes
                userDocListener = firestore.collection("users")
                    .document(firebaseUser.uid)
                    .addSnapshotListener { snapshot, error ->
                        if (error != null) {
                            _authState.value = AuthState.Error.Network(error.localizedMessage ?: "Network error")
                            return@addSnapshotListener
                        }

                        if (snapshot == null || !snapshot.exists()) {
                            _authState.value = AuthState.Error.NoUserDocument
                            return@addSnapshotListener
                        }

                        val roleStr = snapshot.getString("role")
                        val role = Role.fromString(roleStr)
                        if (role == null) {
                            _authState.value = AuthState.Error.NoRole
                            return@addSnapshotListener
                        }

                        val userProfile = snapshot.toUserProfile()
                        _authState.value = AuthState.SignedIn(userProfile)
                    }
            }
        }
    }

    override suspend fun signIn(email: String, pass: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            auth.signInWithEmailAndPassword(email.trim(), pass.trim()).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun signOut() = withContext(Dispatchers.IO) {
        userDocListener?.remove()
        userDocListener = null
        auth.signOut()
        _authState.value = AuthState.SignedOut
    }

    override suspend fun createAccountWithSecondaryApp(
        email: String,
        pass: String,
        role: Role,
        name: String,
        teamId: String?,
        zoneId: String?
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            // Non-Negotiable Rule 4: Create user using secondary FirebaseApp to avoid Admin sign-out
            val secondaryAppName = "SecondaryAdminAuth_${System.currentTimeMillis()}"
            val options = FirebaseApp.getInstance().options
            val secondaryApp = FirebaseApp.initializeApp(context, options, secondaryAppName)
            val secondaryAuth = FirebaseAuth.getInstance(secondaryApp)

            val authResult = secondaryAuth.createUserWithEmailAndPassword(email.trim(), pass.trim()).await()
            val newUid = authResult.user?.uid ?: throw IllegalStateException("Failed to generate UID")

            secondaryAuth.signOut()
            secondaryApp.delete()

            // Write user document using primary Admin session
            val userMap = mutableMapOf<String, Any?>(
                "name" to name.trim(),
                "email" to email.trim(),
                "role" to role.name,
                "teamId" to teamId,
                "zoneId" to zoneId,
                "createdAt" to FieldValue.serverTimestamp()
            )

            firestore.collection("users").document(newUid).set(userMap).await()
            Result.success(newUid)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
