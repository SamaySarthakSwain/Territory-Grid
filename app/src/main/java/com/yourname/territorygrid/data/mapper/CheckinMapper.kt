package com.yourname.territorygrid.data.mapper

import com.google.firebase.firestore.DocumentSnapshot
import com.yourname.territorygrid.domain.model.Checkin
import com.yourname.territorygrid.domain.model.SyncStatus

fun DocumentSnapshot.toCheckin(): Checkin {
    val rankNum = (get("cardRank") as? Number)?.toInt() ?: 1
    val pointsNum = (get("points") as? Number)?.toInt() ?: 0
    val hasPending = metadata.hasPendingWrites()

    return Checkin(
        teamId = getString("teamId").orEmpty(),
        zoneId = getString("zoneId").orEmpty(),
        memberId = getString("memberId").orEmpty(),
        cone = getString("cone").orEmpty(),
        cardRank = rankNum,
        cardSuit = getString("cardSuit").orEmpty(),
        points = pointsNum,
        timestamp = getTimestamp("timestamp"),
        syncStatus = if (hasPending) SyncStatus.PENDING else SyncStatus.SYNCED
    )
}
