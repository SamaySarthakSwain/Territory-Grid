package com.yourname.territorygrid.data.repository

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.yourname.territorygrid.data.mapper.toGameState
import com.yourname.territorygrid.domain.model.GameState
import com.yourname.territorygrid.domain.model.GameStatus
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GameRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : GameRepository {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _gameState = MutableStateFlow(GameState())
    override val gameState: StateFlow<GameState> = _gameState.asStateFlow()

    private val gameStateDoc = firestore.collection("game").document("state")

    init {
        gameStateDoc.addSnapshotListener { snapshot, error ->
            if (error != null) return@addSnapshotListener
            if (snapshot != null && snapshot.exists()) {
                _gameState.value = snapshot.toGameState()
            }
        }
    }

    override suspend fun updateStatus(status: GameStatus): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val updates = mutableMapOf<String, Any?>("status" to status.name)
            if (status == GameStatus.PLAYER_PHASE && _gameState.value.startedAt == null) {
                updates["startedAt"] = FieldValue.serverTimestamp()
            }
            if (status == GameStatus.ENDED) {
                updates["endedAt"] = FieldValue.serverTimestamp()
            }
            gameStateDoc.set(updates, com.google.firebase.firestore.SetOptions.merge()).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun pauseGame(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val updates = mapOf(
                "status" to GameStatus.PAUSED.name,
                "pausedAt" to FieldValue.serverTimestamp()
            )
            gameStateDoc.update(updates).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun resumeGame(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val current = _gameState.value
            val pauseStart = current.pausedAt?.toDate()?.time ?: System.currentTimeMillis()
            val pauseDelta = (System.currentTimeMillis() - pauseStart).coerceAtLeast(0L)
            val newTotalPaused = current.totalPausedMs + pauseDelta

            val updates = mapOf(
                "status" to GameStatus.PLAYER_PHASE.name,
                "pausedAt" to null,
                "totalPausedMs" to newTotalPaused
            )
            gameStateDoc.update(updates).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun resetGrid(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            // 1. Reset Game State document to LOBBY
            val stateReset = mapOf(
                "status" to GameStatus.LOBBY.name,
                "startedAt" to null,
                "endedAt" to null,
                "pausedAt" to null,
                "totalPausedMs" to 0L
            )
            gameStateDoc.set(stateReset).await()

            // 2. Zero all team scores and visited zones in batches <= 400
            val teamsSnapshot = firestore.collection("teams").get().await()
            val teamBatches = teamsSnapshot.documents.chunked(400)
            for (batchDocs in teamBatches) {
                val batch = firestore.batch()
                for (doc in batchDocs) {
                    batch.update(
                        doc.reference,
                        mapOf(
                            "score" to 0,
                            "cards" to emptyList<Map<String, Any>>(),
                            "visitedZones" to emptyList<String>(),
                            "currentClueIndex" to 0,
                            "updatedAt" to FieldValue.serverTimestamp()
                        )
                    )
                }
                batch.commit().await()
            }

            // 3. Delete all check-ins in batches <= 400
            val checkinsSnapshot = firestore.collection("checkins").get().await()
            val checkinBatches = checkinsSnapshot.documents.chunked(400)
            for (batchDocs in checkinBatches) {
                val batch = firestore.batch()
                for (doc in batchDocs) {
                    batch.delete(doc.reference)
                }
                batch.commit().await()
            }

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
