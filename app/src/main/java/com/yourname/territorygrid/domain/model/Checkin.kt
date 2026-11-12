package com.yourname.territorygrid.domain.model

import com.google.firebase.Timestamp

data class Checkin(
    val teamId: String = "",
    val zoneId: String = "",
    val memberId: String = "",
    val cone: String = "",
    val cardRank: Int = 1,
    val cardSuit: String = "",
    val points: Int = 0,
    val timestamp: Timestamp? = null,
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    val failureReason: String? = null
) {
    val documentId: String
        get() = "${teamId}_${zoneId}"
}

enum class SyncStatus {
    PENDING,
    SYNCED,
    FAILED
}
