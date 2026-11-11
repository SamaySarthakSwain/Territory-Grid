package com.yourname.territorygrid.ui.member

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yourname.territorygrid.data.repository.AuthRepository
import com.yourname.territorygrid.data.repository.AuthState
import com.yourname.territorygrid.data.repository.CheckinRepository
import com.yourname.territorygrid.data.repository.ClueRepository
import com.yourname.territorygrid.data.repository.GameRepository
import com.yourname.territorygrid.data.repository.TeamRepository
import com.yourname.territorygrid.domain.model.Checkin
import com.yourname.territorygrid.domain.model.ConeColor
import com.yourname.territorygrid.domain.usecase.CalculatePointsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MemberCheckinViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val gameRepository: GameRepository,
    private val teamRepository: TeamRepository,
    private val clueRepository: ClueRepository,
    private val checkinRepository: CheckinRepository,
    private val calculatePointsUseCase: CalculatePointsUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(MemberCheckinUiState())

    val uiState: StateFlow<MemberCheckinUiState> = combine(
        _uiState,
        authRepository.authState,
        gameRepository.gameState,
        teamRepository.teams,
        combine(clueRepository.clues, checkinRepository.recentSubmissions) { clues, submissions ->
            Pair(clues, submissions)
        }
    ) { currentUi, authState, gameState, teams, (clues, submissions) ->
        val user = (authState as? AuthState.SignedIn)?.user
        currentUi.copy(
            userProfile = user,
            gameState = gameState,
            teams = teams,
            clues = clues,
            recentSubmissions = submissions
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = MemberCheckinUiState()
    )

    fun onTeamSelected(teamId: String?) {
        _uiState.update { it.copy(selectedTeamId = teamId, errorMessage = null) }
    }

    fun onConeSelected(cone: ConeColor) {
        _uiState.update { it.copy(selectedCone = cone) }
    }

    fun onCardRankSelected(rank: Int) {
        _uiState.update { it.copy(selectedCardRank = rank.coerceIn(1, 13)) }
    }

    fun onCardSuitSelected(suit: String) {
        _uiState.update { it.copy(selectedCardSuit = suit) }
    }

    fun onRequestSubmit() {
        val state = uiState.value
        val reason = state.blockingReason
        if (reason != null) {
            _uiState.update { it.copy(errorMessage = reason) }
            return
        }
        _uiState.update { it.copy(showConfirmDialog = true, errorMessage = null) }
    }

    fun dismissConfirmDialog() {
        _uiState.update { it.copy(showConfirmDialog = false) }
    }

    fun executeCheckin() {
        val state = uiState.value
        val team = state.selectedTeam ?: run {
            _uiState.update { it.copy(showConfirmDialog = false, errorMessage = "No team selected.") }
            return
        }
        val zoneId = state.assignedZoneId ?: run {
            _uiState.update { it.copy(showConfirmDialog = false, errorMessage = "No grid zone assigned to Field Marshal.") }
            return
        }
        val memberId = state.userProfile?.uid ?: authRepository.currentUserId ?: "unknown_marshal"

        val cone = state.selectedCone
        val card = state.currentCard
        val points = calculatePointsUseCase(card.rank, cone)

        _uiState.update { it.copy(isSubmitting = true, showConfirmDialog = false) }

        viewModelScope.launch {
            val result = checkinRepository.submitCheckin(
                teamId = team.id,
                zoneId = zoneId,
                memberId = memberId,
                cone = cone,
                card = card,
                points = points
            )

            if (result.isSuccess) {
                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        submissionSuccess = true,
                        infoMessage = "Transmitted: +$points PTS awarded to ${team.name}!",
                        selectedTeamId = null,
                        selectedCone = ConeColor.YELLOW,
                        selectedCardRank = 13,
                        selectedCardSuit = "♠"
                    )
                }
            } else {
                val error = result.exceptionOrNull()?.localizedMessage ?: "Unknown submission error"
                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        errorMessage = "Transmission failed: $error"
                    )
                }
            }
        }
    }

    fun dismissSuccessBanner() {
        _uiState.update { it.copy(submissionSuccess = false) }
    }

    fun retrySubmission(checkin: Checkin) {
        viewModelScope.launch {
            val result = checkinRepository.retrySubmission(checkin)
            if (result.isSuccess) {
                _uiState.update { it.copy(infoMessage = "Retried check-in successfully!") }
            } else {
                _uiState.update { it.copy(errorMessage = "Retry failed: ${result.exceptionOrNull()?.localizedMessage}") }
            }
        }
    }

    fun dismissSubmission(documentId: String) {
        checkinRepository.dismissSubmission(documentId)
    }

    fun clearMessages() {
        _uiState.update { it.copy(errorMessage = null, infoMessage = null) }
    }
}
