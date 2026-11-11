package com.yourname.territorygrid.data.repository

import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.yourname.territorygrid.data.mapper.toTeam
import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.Team
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
class TeamRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : TeamRepository {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _teams = MutableStateFlow<List<Team>>(emptyList())
    override val teams: StateFlow<List<Team>> = _teams.asStateFlow()

    init {
        // Listen to live leaderboard: score desc, ties broken by earliest updatedAt asc
        firestore.collection("teams")
            .addSnapshotListener { snapshot, error ->
                if (error != null) return@addSnapshotListener
                if (snapshot != null) {
                    val list = snapshot.documents.map { it.toTeam() }
                        .sortedWith(
                            compareByDescending<Team> { it.score }
                                .thenBy { it.updatedAt?.toDate()?.time ?: Long.MAX_VALUE }
                        )
                    _teams.value = list
                }
            }
    }

    override fun getTeam(teamId: String): Flow<Team?> = callbackFlow {
        val listener = firestore.collection("teams").document(teamId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null && snapshot.exists()) {
                    trySend(snapshot.toTeam())
                } else {
                    trySend(null)
                }
            }
        awaitClose { listener.remove() }
    }

    override suspend fun createTeam(name: String, clueOrder: List<String>): Result<String> = withContext(Dispatchers.IO) {
        try {
            val docRef = firestore.collection("teams").document()
            val teamData = mapOf(
                "name" to name.trim(),
                "score" to 0,
                "cards" to emptyList<Map<String, Any>>(),
                "clueOrder" to clueOrder,
                "currentClueIndex" to 0,
                "visitedZones" to emptyList<String>(),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            docRef.set(teamData).await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateClueOrder(teamId: String, clueOrder: List<String>): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            firestore.collection("teams").document(teamId).update("clueOrder", clueOrder).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun generateAndSaveClueOrders(clues: List<Clue>): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            if (clues.isEmpty()) return@withContext Result.failure(IllegalStateException("No clues available to generate orders"))

            val currentTeams = _teams.value
            if (currentTeams.isEmpty()) return@withContext Result.failure(IllegalStateException("No teams available"))

            val clueIds = clues.map { it.id }
            val batch = firestore.batch()

            currentTeams.forEachIndexed { index, team ->
                // Shuffle clue pool per team, rotate the first clue so teams start at different stations
                val shuffled = clueIds.shuffled().toMutableList()
                val rotateIndex = index % shuffled.size
                val rotated = shuffled.subList(rotateIndex, shuffled.size) + shuffled.subList(0, rotateIndex)

                val ref = firestore.collection("teams").document(team.id)
                batch.update(ref, "clueOrder", rotated)
            }

            batch.commit().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteTeam(teamId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            firestore.collection("teams").document(teamId).delete().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
