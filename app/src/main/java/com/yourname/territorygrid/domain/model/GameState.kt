package com.yourname.territorygrid.domain.model

import com.google.firebase.Timestamp

enum class GameStatus {
    LOBBY,
    MEMBER_PHASE,
    PLAYER_PHASE,
    PAUSED,
    ENDED;

    companion object {
        fun fromString(value: String?): GameStatus = when (value?.uppercase()) {
            "LOBBY" -> LOBBY
            "MEMBER_PHASE" -> MEMBER_PHASE
            "PLAYER_PHASE" -> PLAYER_PHASE
            "PAUSED" -> PAUSED
            "ENDED" -> ENDED
            else -> LOBBY
        }
    }
}

data class GameState(
    val status: GameStatus = GameStatus.LOBBY,
    val startedAt: Timestamp? = null,
    val endedAt: Timestamp? = null,
    val pausedAt: Timestamp? = null,
    val totalPausedMs: Long = 0L
) {
    /**
     * Derives elapsed match time strictly using server timestamps,
     * immune to device clock tampering per Non-Negotiable Rule 5.
     */
    fun deriveElapsedMs(currentTimeMs: Long = System.currentTimeMillis()): Long {
        if (startedAt == null || status == GameStatus.LOBBY) return 0L

        val startMs = startedAt.toDate().time

        return when (status) {
            GameStatus.PAUSED -> {
                val pauseMs = pausedAt?.toDate()?.time ?: currentTimeMs
                (pauseMs - startMs - totalPausedMs).coerceAtLeast(0L)
            }
            GameStatus.ENDED -> {
                val endMs = endedAt?.toDate()?.time ?: currentTimeMs
                (endMs - startMs - totalPausedMs).coerceAtLeast(0L)
            }
            else -> {
                (currentTimeMs - startMs - totalPausedMs).coerceAtLeast(0L)
            }
        }
    }
}
