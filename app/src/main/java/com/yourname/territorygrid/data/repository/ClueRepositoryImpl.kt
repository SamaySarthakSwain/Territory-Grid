package com.yourname.territorygrid.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.yourname.territorygrid.data.mapper.toClue
import com.yourname.territorygrid.domain.model.Clue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ClueRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : ClueRepository {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _clues = MutableStateFlow<List<Clue>>(emptyList())
    override val clues: StateFlow<List<Clue>> = _clues.asStateFlow()

    init {
        firestore.collection("clues")
            .addSnapshotListener { snapshot, error ->
                if (error != null) return@addSnapshotListener
                if (snapshot != null) {
                    _clues.value = snapshot.documents.map { it.toClue() }
                }
            }
    }

    override fun getClue(clueId: String): Flow<Clue?> = callbackFlow {
        val listener = firestore.collection("clues").document(clueId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.exists()) {
                    trySend(snapshot.toClue())
                } else {
                    trySend(null)
                }
            }
        awaitClose { listener.remove() }
    }

    override suspend fun createClue(
        text: String,
        zoneId: String,
        zoneLabel: String
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val docRef = firestore.collection("clues").document()
            val clueMap = mapOf(
                "text" to text.trim(),
                "zoneId" to zoneId.trim(),
                "zoneLabel" to zoneLabel.trim()
            )
            docRef.set(clueMap).await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateClue(clue: Clue): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val clueMap = mapOf(
                "text" to clue.text.trim(),
                "zoneId" to clue.zoneId.trim(),
                "zoneLabel" to clue.zoneLabel.trim()
            )
            firestore.collection("clues").document(clue.id).update(clueMap).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteClue(clueId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            firestore.collection("clues").document(clueId).delete().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
