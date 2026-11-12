package com.yourname.territorygrid.data.repository

import com.yourname.territorygrid.domain.model.GameState
import com.yourname.territorygrid.domain.model.GameStatus
import kotlinx.coroutines.flow.StateFlow

interface GameRepository {
    val gameState: StateFlow<GameState>
    suspend fun updateStatus(status: GameStatus): Result<Unit>
    suspend fun pauseGame(): Result<Unit>
    suspend fun resumeGame(): Result<Unit>
    suspend fun resetGrid(): Result<Unit>
}
