package com.yourname.territorygrid.domain.model

import com.google.firebase.Timestamp

data class Team(
    val id: String = "",
    val name: String = "",
    val score: Int = 0,
    val cards: List<PlayingCard> = emptyList(),
    val clueOrder: List<String> = emptyList(),
    val currentClueIndex: Int = 0,
    val visitedZones: List<String> = emptyList(),
    val isApproved: Boolean = false,
    val updatedAt: Timestamp? = null
) {
    val activeClueId: String?
        get() = clueOrder.getOrNull(currentClueIndex)

    val isFinished: Boolean
        get() = clueOrder.isNotEmpty() && currentClueIndex >= clueOrder.size
}
