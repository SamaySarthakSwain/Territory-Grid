package com.yourname.territorygrid.data.repository

import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.Team
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

class FakeTeamRepository : TeamRepository {
    private val _teams = MutableStateFlow<List<Team>>(emptyList())
    override val teams: StateFlow<List<Team>> = _teams.asStateFlow()

    override fun getTeam(teamId: String): Flow<Team?> {
        return _teams.map { list -> list.find { it.id == teamId } }
    }

    override suspend fun createTeam(name: String, clueOrder: List<String>): Result<String> {
        val newId = "team_${System.currentTimeMillis()}"
        val newTeam = Team(
            id = newId,
            name = name,
            score = 0,
            cards = emptyList(),
            clueOrder = clueOrder,
            currentClueIndex = 0,
            visitedZones = emptyList(),
            updatedAt = null
        )
        _teams.value = _teams.value + newTeam
        return Result.success(newId)
    }

    override suspend fun updateClueOrder(teamId: String, clueOrder: List<String>): Result<Unit> {
        _teams.value = _teams.value.map {
            if (it.id == teamId) it.copy(clueOrder = clueOrder) else it
        }
        return Result.success(Unit)
    }

    override suspend fun generateAndSaveClueOrders(clues: List<Clue>): Result<Unit> {
        val clueIds = clues.map { it.id }
        _teams.value = _teams.value.mapIndexed { index, team ->
            val shuffled = clueIds.shuffled().toMutableList()
            val rotate = index % shuffled.size
            val rotated = shuffled.subList(rotate, shuffled.size) + shuffled.subList(0, rotate)
            team.copy(clueOrder = rotated)
        }
        return Result.success(Unit)
    }

    override suspend fun approveTeam(teamId: String): Result<Unit> {
        _teams.value = _teams.value.map {
            if (it.id == teamId) it.copy(isApproved = true) else it
        }
        return Result.success(Unit)
    }

    override suspend fun deleteTeam(teamId: String): Result<Unit> {
        _teams.value = _teams.value.filter { it.id != teamId }
        return Result.success(Unit)
    }

    fun setTeams(teams: List<Team>) {
        _teams.value = teams
    }
}
