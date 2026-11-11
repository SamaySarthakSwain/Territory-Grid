package com.yourname.territorygrid.data.repository

import com.yourname.territorygrid.domain.model.Checkin
import com.yourname.territorygrid.domain.model.ConeColor
import com.yourname.territorygrid.domain.model.PlayingCard
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class FakeCheckinRepository : CheckinRepository {
    private val _recentSubmissions = MutableStateFlow<List<Checkin>>(emptyList())
    override val recentSubmissions: StateFlow<List<Checkin>> = _recentSubmissions.asStateFlow()

    private val _allCheckins = MutableStateFlow<List<Checkin>>(emptyList())
    override val allCheckins: StateFlow<List<Checkin>> = _allCheckins.asStateFlow()

    override suspend fun submitCheckin(
        teamId: String,
        zoneId: String,
        memberId: String,
        cone: ConeColor,
        card: PlayingCard,
        points: Int
    ): Result<Unit> {
        val checkin = Checkin(
            teamId = teamId,
            zoneId = zoneId,
            memberId = memberId,
            cone = cone.name,
            cardRank = card.rank,
            cardSuit = card.suit,
            points = points
        )
        _allCheckins.value = listOf(checkin) + _allCheckins.value
        _recentSubmissions.value = listOf(checkin) + _recentSubmissions.value
        return Result.success(Unit)
    }

    override suspend fun undoCheckin(checkin: Checkin, card: PlayingCard): Result<Unit> {
        _allCheckins.value = _allCheckins.value.filter { it.documentId != checkin.documentId }
        _recentSubmissions.value = _recentSubmissions.value.filter { it.documentId != checkin.documentId }
        return Result.success(Unit)
    }

    fun setCheckins(list: List<Checkin>) {
        _allCheckins.value = list
        _recentSubmissions.value = list
    }
}
