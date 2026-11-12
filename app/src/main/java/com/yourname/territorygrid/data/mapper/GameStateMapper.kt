package com.yourname.territorygrid.data.mapper

import com.google.firebase.firestore.DocumentSnapshot
import com.yourname.territorygrid.domain.model.GameState
import com.yourname.territorygrid.domain.model.GameStatus

fun DocumentSnapshot.toGameState(): GameState {
    val statusStr = getString("status")
    val parsedStatus = GameStatus.fromString(statusStr)
    val totalPaused = (get("totalPausedMs") as? Number)?.toLong() ?: 0L

    return GameState(
        status = parsedStatus,
        startedAt = getTimestamp("startedAt"),
        endedAt = getTimestamp("endedAt"),
        pausedAt = getTimestamp("pausedAt"),
        totalPausedMs = totalPaused
    )
}
