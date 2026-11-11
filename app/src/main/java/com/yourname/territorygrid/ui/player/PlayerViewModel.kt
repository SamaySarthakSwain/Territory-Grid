package com.yourname.territorygrid.ui.player

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yourname.territorygrid.data.repository.AuthRepository
import com.yourname.territorygrid.data.repository.AuthState
import com.yourname.territorygrid.data.repository.ClueRepository
import com.yourname.territorygrid.data.repository.GameRepository
import com.yourname.territorygrid.data.repository.TeamRepository
import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.Team
import com.yourname.territorygrid.domain.model.UserProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class PlayerViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val gameRepository: GameRepository,
    private val teamRepository: TeamRepository,
    private val clueRepository: ClueRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PlayerUiState())
    private var previousScore: Int? = null

    val userProfileFlow: Flow<UserProfile?> = authRepository.authState.map {
        (it as? AuthState.SignedIn)?.user
    }

    val userTeamFlow: Flow<Team?> = combine(userProfileFlow, teamRepository.teams) { user, teams ->
        teams.find { it.id == user?.teamId }
    }

    // Non-Negotiable Rule 6: Players listen ONLY to their own active clue document
    val activeClueFlow: Flow<Clue?> = userTeamFlow.flatMapLatest { team ->
        val clueId = if (team != null && team.currentClueIndex < team.clueOrder.size) {
            team.clueOrder.getOrNull(team.currentClueIndex)
        } else null

        if (clueId != null) {
            clueRepository.getClue(clueId)
        } else {
            flowOf(null)
        }
    }

    init {
        // Track score deltas for +N points celebration banner
        viewModelScope.launch {
            userTeamFlow.collect { team ->
                if (team != null) {
                    val currentScore = team.score
                    val prev = previousScore
                    if (prev != null && currentScore > prev) {
                        val delta = currentScore - prev
                        _uiState.update {
                            it.copy(
                                recentPointsDelta = delta,
                                showPointsDeltaBanner = true
                            )
                        }
                    }
                    previousScore = currentScore
                }
            }
        }
    }

    val uiState: StateFlow<PlayerUiState> = combine(
        _uiState,
        userProfileFlow,
        userTeamFlow,
        activeClueFlow,
        combine(gameRepository.gameState, teamRepository.teams) { game, teams ->
            Pair(game, teams)
        }
    ) { currentUi, user, team, activeClue, (gameState, allTeams) ->
        currentUi.copy(
            userProfile = user,
            team = team,
            activeClue = activeClue,
            gameState = gameState,
            allTeams = allTeams
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = PlayerUiState()
    )

    fun selectTab(tab: PlayerTab) {
        _uiState.update { it.copy(currentTab = tab, errorMessage = null) }
    }

    fun dismissPointsDelta() {
        _uiState.update { it.copy(showPointsDeltaBanner = false) }
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, infoMessage = null) }
    }

    // ── Self-registration ──────────────────────────────────────────────────────

    fun openRegisterTeamDialog() {
        _uiState.update { it.copy(showRegisterTeamDialog = true, registerTeamName = "", errorMessage = null) }
    }

    fun dismissRegisterTeamDialog() {
        _uiState.update { it.copy(showRegisterTeamDialog = false, registerTeamName = "", isRegistering = false) }
    }

    fun onRegisterTeamNameChanged(name: String) {
        _uiState.update { it.copy(registerTeamName = name, errorMessage = null) }
    }

    fun submitRegisterTeam() {
        val name = _uiState.value.registerTeamName.trim()
        if (name.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Squad name cannot be empty.") }
            return
        }
        val uid = authRepository.currentUserId ?: run {
            _uiState.update { it.copy(errorMessage = "Not signed in.") }
            return
        }
        _uiState.update { it.copy(isRegistering = true, errorMessage = null) }
        viewModelScope.launch {
            val result = teamRepository.createTeam(name, emptyList())
            if (result.isSuccess) {
                val teamId = result.getOrThrow()
                // Link the player to their new (pending) team
                authRepository.updateUserAssignment(uid, teamId, null)
                _uiState.update {
                    it.copy(
                        isRegistering = false,
                        showRegisterTeamDialog = false,
                        registerTeamName = "",
                        infoMessage = "Squad registered! Waiting for Game Master approval before play begins."
                    )
                }
            } else {
                _uiState.update {
                    it.copy(
                        isRegistering = false,
                        errorMessage = result.exceptionOrNull()?.localizedMessage ?: "Registration failed. Try again."
                    )
                }
            }
        }
    }

}
