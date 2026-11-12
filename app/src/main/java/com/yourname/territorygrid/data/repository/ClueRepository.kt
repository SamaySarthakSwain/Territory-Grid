package com.yourname.territorygrid.data.repository

import com.yourname.territorygrid.domain.model.Clue
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.StateFlow

interface ClueRepository {
    val clues: StateFlow<List<Clue>>
    fun getClue(clueId: String): Flow<Clue?>
    suspend fun createClue(text: String, zoneId: String, zoneLabel: String): Result<String>
    suspend fun updateClue(clue: Clue): Result<Unit>
    suspend fun deleteClue(clueId: String): Result<Unit>
}
