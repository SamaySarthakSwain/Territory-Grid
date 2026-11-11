package com.yourname.territorygrid.data.repository

import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.Team
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.StateFlow

interface TeamRepository {
    val teams: StateFlow<List<Team>>
    fun getTeam(teamId: String): Flow<Team?>
    suspend fun createTeam(name: String, clueOrder: List<String>): Result<String>
    suspend fun updateClueOrder(teamId: String, clueOrder: List<String>): Result<Unit>
    suspend fun generateAndSaveClueOrders(clues: List<Clue>): Result<Unit>
    suspend fun deleteTeam(teamId: String): Result<Unit>
}
