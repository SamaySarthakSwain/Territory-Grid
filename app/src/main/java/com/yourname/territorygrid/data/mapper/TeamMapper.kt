package com.yourname.territorygrid.data.mapper

import com.google.firebase.firestore.DocumentSnapshot
import com.yourname.territorygrid.domain.model.PlayingCard
import com.yourname.territorygrid.domain.model.Team

@Suppress("UNCHECKED_CAST")
fun DocumentSnapshot.toTeam(): Team {
    val rawCards = get("cards") as? List<Map<String, Any?>> ?: emptyList()
    val cardList = rawCards.mapNotNull {
        try {
            PlayingCard.fromMap(it)
        } catch (_: Exception) {
            null
        }
    }

    val clueOrderList = (get("clueOrder") as? List<*>)?.mapNotNull { it?.toString() } ?: emptyList()
    val visitedZonesList = (get("visitedZones") as? List<*>)?.mapNotNull { it?.toString() } ?: emptyList()

    val scoreNum = (get("score") as? Number)?.toInt() ?: 0
    val clueIndexNum = (get("currentClueIndex") as? Number)?.toInt() ?: 0

    return Team(
        id = id,
        name = getString("name").orEmpty(),
        score = scoreNum,
        cards = cardList,
        clueOrder = clueOrderList,
        currentClueIndex = clueIndexNum,
        visitedZones = visitedZonesList,
        updatedAt = getTimestamp("updatedAt")
    )
}
