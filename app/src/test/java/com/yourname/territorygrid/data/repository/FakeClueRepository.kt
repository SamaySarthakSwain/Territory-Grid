package com.yourname.territorygrid.data.repository

import com.yourname.territorygrid.domain.model.Clue
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

class FakeClueRepository : ClueRepository {
    private val _clues = MutableStateFlow<List<Clue>>(emptyList())
    override val clues: StateFlow<List<Clue>> = _clues.asStateFlow()

    override fun getClue(clueId: String): Flow<Clue?> {
        return _clues.map { list -> list.find { it.id == clueId } }
    }

    override suspend fun createClue(text: String, zoneId: String, zoneLabel: String): Result<String> {
        val newId = "clue_${System.currentTimeMillis()}"
        val newClue = Clue(id = newId, text = text, zoneId = zoneId, zoneLabel = zoneLabel)
        _clues.value = _clues.value + newClue
        return Result.success(newId)
    }

    override suspend fun updateClue(clue: Clue): Result<Unit> {
        _clues.value = _clues.value.map { if (it.id == clue.id) clue else it }
        return Result.success(Unit)
    }

    override suspend fun deleteClue(clueId: String): Result<Unit> {
        _clues.value = _clues.value.filter { it.id != clueId }
        return Result.success(Unit)
    }

    fun setClues(clues: List<Clue>) {
        _clues.value = clues
    }
}
