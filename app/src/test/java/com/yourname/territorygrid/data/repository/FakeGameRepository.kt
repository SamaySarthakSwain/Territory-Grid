package com.yourname.territorygrid.data.repository

import com.google.firebase.Timestamp
import com.yourname.territorygrid.domain.model.GameState
import com.yourname.territorygrid.domain.model.GameStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class FakeGameRepository : GameRepository {
    private val _gameState = MutableStateFlow(GameState(status = GameStatus.LOBBY))
    override val gameState: StateFlow<GameState> = _gameState.asStateFlow()

    override suspend fun updateStatus(status: GameStatus): Result<Unit> {
        val current = _gameState.value
        _gameState.value = current.copy(
            status = status,
            startedAt = if (status == GameStatus.PLAYER_PHASE && current.startedAt == null) Timestamp.now() else current.startedAt,
            endedAt = if (status == GameStatus.ENDED) Timestamp.now() else current.endedAt
        )
        return Result.success(Unit)
    }

    override suspend fun pauseGame(): Result<Unit> {
        _gameState.value = _gameState.value.copy(
            status = GameStatus.PAUSED,
            pausedAt = Timestamp.now()
        )
        return Result.success(Unit)
    }

    override suspend fun resumeGame(): Result<Unit> {
        val current = _gameState.value
        val pausedAtTime = current.pausedAt?.toDate()?.time ?: System.currentTimeMillis()
        val delta = (System.currentTimeMillis() - pausedAtTime).coerceAtLeast(0L)
        _gameState.value = current.copy(
            status = GameStatus.PLAYER_PHASE,
            pausedAt = null,
            totalPausedMs = current.totalPausedMs + delta
        )
        return Result.success(Unit)
    }

    override suspend fun resetGrid(): Result<Unit> {
        _gameState.value = GameState(status = GameStatus.LOBBY)
        return Result.success(Unit)
    }
}
