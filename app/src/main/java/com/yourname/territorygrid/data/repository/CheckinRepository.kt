package com.yourname.territorygrid.data.repository

import com.yourname.territorygrid.domain.model.Checkin
import com.yourname.territorygrid.domain.model.ConeColor
import com.yourname.territorygrid.domain.model.PlayingCard
import kotlinx.coroutines.flow.StateFlow

interface CheckinRepository {
    val recentSubmissions: StateFlow<List<Checkin>>
    val allCheckins: StateFlow<List<Checkin>>
    suspend fun submitCheckin(
        teamId: String,
        zoneId: String,
        memberId: String,
        cone: ConeColor,
        card: PlayingCard,
        points: Int
    ): Result<Unit>
    suspend fun undoCheckin(checkin: Checkin, card: PlayingCard): Result<Unit>
    fun dismissSubmission(documentId: String)
    suspend fun retrySubmission(checkin: Checkin): Result<Unit>
}
