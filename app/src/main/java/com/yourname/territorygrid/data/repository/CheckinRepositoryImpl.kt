package com.yourname.territorygrid.data.repository

import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.MetadataChanges
import com.google.firebase.firestore.Query
import com.yourname.territorygrid.data.mapper.toCheckin
import com.yourname.territorygrid.domain.model.Checkin
import com.yourname.territorygrid.domain.model.ConeColor
import com.yourname.territorygrid.domain.model.PlayingCard
import com.yourname.territorygrid.domain.model.SyncStatus
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
class CheckinRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : CheckinRepository {

    // Application-scoped coroutine scope per Non-Negotiable Rule 1
    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    private val _recentSubmissions = MutableStateFlow<List<Checkin>>(emptyList())
    override val recentSubmissions: StateFlow<List<Checkin>> = _recentSubmissions.asStateFlow()

    private val _allCheckins = MutableStateFlow<List<Checkin>>(emptyList())
    override val allCheckins: StateFlow<List<Checkin>> = _allCheckins.asStateFlow()

    init {
        // Listen with metadata changes to detect pending vs synced writes
        firestore.collection("checkins")
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .addSnapshotListener(MetadataChanges.INCLUDE) { snapshot, error ->
                if (error != null) return@addSnapshotListener
                if (snapshot != null) {
                    val list = snapshot.documents.map { it.toCheckin() }
                    _allCheckins.value = list
                    _recentSubmissions.value = list.take(10)
                }
            }
    }

    override suspend fun submitCheckin(
        teamId: String,
        zoneId: String,
        memberId: String,
        cone: ConeColor,
        card: PlayingCard,
        points: Int
    ): Result<Unit> = withContext(Dispatchers.IO) {
        val docId = "${teamId}_${zoneId}"
        val checkinRef = firestore.collection("checkins").document(docId)
        val teamRef = firestore.collection("teams").document(teamId)

        // Optimistically add to recentSubmissions as PENDING
        val optimistic = Checkin(
            teamId = teamId,
            zoneId = zoneId,
            memberId = memberId,
            cone = cone.name,
            cardRank = card.rank,
            cardSuit = card.suit,
            points = points,
            syncStatus = SyncStatus.PENDING
        )
        _recentSubmissions.value = listOf(optimistic) + _recentSubmissions.value.filter { it.documentId != docId }

        try {
            // Non-Negotiable Rule 1: ONE WriteBatch, NOT runTransaction
            val batch = firestore.batch()

            val checkinData = mapOf(
                "teamId" to teamId,
                "zoneId" to zoneId,
                "memberId" to memberId,
                "cone" to cone.name,
                "cardRank" to card.rank,
                "cardSuit" to card.suit,
                "points" to points,
                "timestamp" to FieldValue.serverTimestamp()
            )
            batch.set(checkinRef, checkinData)

            val teamUpdates = mapOf(
                "score" to FieldValue.increment(points.toLong()),
                "cards" to FieldValue.arrayUnion(card.toMap()),
                "visitedZones" to FieldValue.arrayUnion(zoneId),
                "currentClueIndex" to FieldValue.increment(1L),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            batch.update(teamRef, teamUpdates)

            // Commit from application-scoped coroutine
            appScope.launch {
                try {
                    batch.commit().await()
                } catch (e: Exception) {
                    // Update submission status to FAILED with reason
                    _recentSubmissions.value = _recentSubmissions.value.map {
                        if (it.documentId == docId) {
                            it.copy(syncStatus = SyncStatus.FAILED, failureReason = e.localizedMessage)
                        } else it
                    }
                }
            }

            Result.success(Unit)
        } catch (e: Exception) {
            _recentSubmissions.value = _recentSubmissions.value.map {
                if (it.documentId == docId) {
                    it.copy(syncStatus = SyncStatus.FAILED, failureReason = e.localizedMessage)
                } else it
            }
            Result.failure(e)
        }
    }

    override suspend fun undoCheckin(checkin: Checkin, card: PlayingCard): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val checkinRef = firestore.collection("checkins").document(checkin.documentId)
            val teamRef = firestore.collection("teams").document(checkin.teamId)

            val batch = firestore.batch()
            batch.delete(checkinRef)

            val teamReversion = mapOf(
                "score" to FieldValue.increment(-checkin.points.toLong()),
                "cards" to FieldValue.arrayRemove(card.toMap()),
                "visitedZones" to FieldValue.arrayRemove(checkin.zoneId),
                "currentClueIndex" to FieldValue.increment(-1L),
                "updatedAt" to FieldValue.serverTimestamp()
            )
            batch.update(teamRef, teamReversion)
            batch.commit().await()

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun dismissSubmission(documentId: String) {
        _recentSubmissions.value = _recentSubmissions.value.filter { it.documentId != documentId }
    }

    override suspend fun retrySubmission(checkin: Checkin): Result<Unit> {
        val cone = ConeColor.fromString(checkin.cone)
        val card = PlayingCard(checkin.cardRank, checkin.cardSuit, checkin.zoneId)
        return submitCheckin(
            teamId = checkin.teamId,
            zoneId = checkin.zoneId,
            memberId = checkin.memberId,
            cone = cone,
            card = card,
            points = checkin.points
        )
    }
}
