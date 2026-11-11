package com.yourname.territorygrid.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yourname.territorygrid.data.repository.AuthRepository
import com.yourname.territorygrid.data.repository.CheckinRepository
import com.yourname.territorygrid.data.repository.ClueRepository
import com.yourname.territorygrid.data.repository.GameRepository
import com.yourname.territorygrid.data.repository.TeamRepository
import com.yourname.territorygrid.domain.model.Checkin
import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.GameStatus
import com.yourname.territorygrid.domain.model.PlayingCard
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.domain.model.Team
import com.yourname.territorygrid.domain.model.UserProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.security.SecureRandom
import javax.inject.Inject

@HiltViewModel
class AdminViewModel @Inject constructor(
    private val gameRepository: GameRepository,
    private val teamRepository: TeamRepository,
    private val authRepository: AuthRepository,
    private val clueRepository: ClueRepository,
    private val checkinRepository: CheckinRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(AdminUiState())

    val uiState: StateFlow<AdminUiState> = combine(
        _uiState,
        gameRepository.gameState,
        teamRepository.teams,
        authRepository.allUsers,
        combine(clueRepository.clues, checkinRepository.allCheckins) { clues, checkins ->
            Pair(clues, checkins)
        }
    ) { currentUi, gameState, teams, users, (clues, checkins) ->
        currentUi.copy(
            gameState = gameState,
            teams = teams,
            users = users,
            clues = clues,
            checkins = checkins
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = AdminUiState()
    )

    private var clockJob: kotlinx.coroutines.Job? = null

    fun startMissionClock() {
        clockJob?.cancel()
        clockJob = viewModelScope.launch {
            while (isActive) {
                val state = uiState.value.gameState
                val elapsed = state.deriveElapsedMs(System.currentTimeMillis())
                _uiState.update { it.copy(elapsedMs = elapsed) }
                delay(1000)
            }
        }
    }

    fun stopMissionClock() {
        clockJob?.cancel()
        clockJob = null
    }

    public override fun onCleared() {
        super.onCleared()
        stopMissionClock()
    }

    fun selectTab(tab: AdminTab) {
        _uiState.update { it.copy(currentTab = tab, errorMessage = null, infoMessage = null) }
    }

    // --- Mission State Transitions ---
    fun advanceGamePhase() {
        val currentStatus = uiState.value.gameState.status
        val nextStatus = when (currentStatus) {
            GameStatus.LOBBY -> GameStatus.MEMBER_PHASE
            GameStatus.MEMBER_PHASE -> GameStatus.PLAYER_PHASE
            else -> return
        }

        viewModelScope.launch {
            val result = gameRepository.updateStatus(nextStatus)
            if (result.isFailure) {
                _uiState.update { it.copy(errorMessage = "Failed to advance phase: ${result.exceptionOrNull()?.localizedMessage}") }
            } else {
                _uiState.update { it.copy(infoMessage = "Advanced phase to $nextStatus") }
            }
        }
    }

    fun pauseGame() {
        viewModelScope.launch {
            val result = gameRepository.pauseGame()
            if (result.isFailure) {
                _uiState.update { it.copy(errorMessage = "Failed to pause ops: ${result.exceptionOrNull()?.localizedMessage}") }
            }
        }
    }

    fun resumeGame() {
        viewModelScope.launch {
            val result = gameRepository.resumeGame()
            if (result.isFailure) {
                _uiState.update { it.copy(errorMessage = "Failed to resume ops: ${result.exceptionOrNull()?.localizedMessage}") }
            }
        }
    }

    fun endGame() {
        viewModelScope.launch {
            val result = gameRepository.updateStatus(GameStatus.ENDED)
            if (result.isFailure) {
                _uiState.update { it.copy(errorMessage = "Failed to end mission: ${result.exceptionOrNull()?.localizedMessage}") }
            }
        }
    }

    // --- Reset Grid Modal ---
    fun showResetDialog(show: Boolean) {
        _uiState.update { it.copy(showResetDialog = show, resetInputText = "") }
    }

    fun onResetInputChanged(text: String) {
        _uiState.update { it.copy(resetInputText = text) }
    }

    fun executeResetGrid() {
        if (_uiState.value.resetInputText.trim() != "RESET") {
            _uiState.update { it.copy(errorMessage = "Type RESET exactly to confirm authorization.") }
            return
        }

        _uiState.update { it.copy(isLoading = true, showResetDialog = false) }
        viewModelScope.launch {
            val result = gameRepository.resetGrid()
            _uiState.update {
                it.copy(
                    isLoading = false,
                    infoMessage = if (result.isSuccess) "Grid purged successfully. All teams reset to Lobby." else null,
                    errorMessage = if (result.isFailure) "Grid reset error: ${result.exceptionOrNull()?.localizedMessage}" else null
                )
            }
        }
    }

    // --- Team Operations ---
    fun openAddTeamDialog(show: Boolean) {
        _uiState.update { it.copy(showAddTeamDialog = show, newTeamName = "") }
    }

    fun onTeamNameChanged(name: String) {
        _uiState.update { it.copy(newTeamName = name) }
    }

    fun saveNewTeam() {
        val name = _uiState.value.newTeamName.trim()
        if (name.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Team name cannot be empty") }
            return
        }

        val allClues = uiState.value.clues.map { it.id }.shuffled()
        viewModelScope.launch {
            val result = teamRepository.createTeam(name, allClues)
            if (result.isSuccess) {
                _uiState.update { it.copy(showAddTeamDialog = false, newTeamName = "", infoMessage = "Team '$name' registered.") }
            } else {
                _uiState.update { it.copy(errorMessage = "Failed to create team: ${result.exceptionOrNull()?.localizedMessage}") }
            }
        }
    }

    fun confirmDeleteTeam(team: Team?) {
        _uiState.update { it.copy(teamToDelete = team) }
    }

    fun executeDeleteTeam() {
        val team = _uiState.value.teamToDelete ?: return
        viewModelScope.launch {
            val result = teamRepository.deleteTeam(team.id)
            _uiState.update {
                it.copy(
                    teamToDelete = null,
                    infoMessage = if (result.isSuccess) "Team '${team.name}' deleted." else null,
                    errorMessage = if (result.isFailure) "Failed to delete team: ${result.exceptionOrNull()?.localizedMessage}" else null
                )
            }
        }
    }

    // --- Clue Order Generator & Preview ---
    fun previewClueOrderGeneration() {
        val clues = uiState.value.clues
        val teams = uiState.value.teams
        if (clues.isEmpty()) {
            _uiState.update { it.copy(errorMessage = "Cannot generate orders: No clues defined in database.") }
            return
        }
        if (teams.isEmpty()) {
            _uiState.update { it.copy(errorMessage = "Cannot generate orders: No teams registered.") }
            return
        }

        val clueIds = clues.map { it.id }
        val previewMap = mutableMapOf<String, List<String>>()

        teams.forEachIndexed { index, team ->
            val shuffled = clueIds.shuffled()
            val rotate = index % shuffled.size
            val rotated = shuffled.subList(rotate, shuffled.size) + shuffled.subList(0, rotate)
            previewMap[team.name] = rotated
        }

        _uiState.update {
            it.copy(
                generatedClueOrdersPreview = previewMap,
                showClueOrderPreviewDialog = true
            )
        }
    }

    fun dismissClueOrderPreview() {
        _uiState.update { it.copy(showClueOrderPreviewDialog = false) }
    }

    fun commitClueOrderGeneration() {
        _uiState.update { it.copy(isLoading = true, showClueOrderPreviewDialog = false) }
        viewModelScope.launch {
            val result = teamRepository.generateAndSaveClueOrders(uiState.value.clues)
            _uiState.update {
                it.copy(
                    isLoading = false,
                    infoMessage = if (result.isSuccess) "Clue orders randomized and saved across all teams!" else null,
                    errorMessage = if (result.isFailure) "Failed to commit clue orders: ${result.exceptionOrNull()?.localizedMessage}" else null
                )
            }
        }
    }

    // --- People & Account Management ---
    fun openAddUserDialog(show: Boolean, role: Role = Role.MEMBER) {
        val defaultEmail = if (role == Role.MEMBER) "marshal1@recon.grid" else "player1@recon.grid"
        _uiState.update {
            it.copy(
                showAddUserDialog = show,
                newUserRole = role,
                newUserName = "",
                newUserEmail = defaultEmail,
                newUserPass = generateCyberPassword(),
                newUserZoneId = "ZONE_01",
                newUserTeamId = it.teams.firstOrNull()?.id.orEmpty()
            )
        }
    }

    fun onNewUserNameChanged(name: String) = _uiState.update { it.copy(newUserName = name) }
    fun onNewUserEmailChanged(email: String) = _uiState.update { it.copy(newUserEmail = email) }
    fun onNewUserPassChanged(pass: String) = _uiState.update { it.copy(newUserPass = pass) }
    fun onNewUserRoleChanged(role: Role) = _uiState.update { it.copy(newUserRole = role) }
    fun onNewUserZoneChanged(zone: String) = _uiState.update { it.copy(newUserZoneId = zone) }
    fun onNewUserTeamChanged(teamId: String) = _uiState.update { it.copy(newUserTeamId = teamId) }

    fun generateNewPassword() {
        _uiState.update { it.copy(newUserPass = generateCyberPassword()) }
    }

    fun saveNewUser() {
        val state = _uiState.value
        val name = state.newUserName.trim()
        val email = state.newUserEmail.trim()
        val pass = state.newUserPass.trim()

        if (name.isBlank() || email.isBlank() || pass.length < 6) {
            _uiState.update { it.copy(errorMessage = "Name, email, and 6+ char password required.") }
            return
        }

        _uiState.update { it.copy(isLoading = true) }
        viewModelScope.launch {
            val result = authRepository.createAccountWithSecondaryApp(
                email = email,
                pass = pass,
                role = state.newUserRole,
                name = name,
                teamId = if (state.newUserRole == Role.PLAYER) state.newUserTeamId.ifBlank { null } else null,
                zoneId = if (state.newUserRole == Role.MEMBER) state.newUserZoneId.ifBlank { null } else null
            )
            _uiState.update {
                it.copy(
                    isLoading = false,
                    showAddUserDialog = false,
                    infoMessage = if (result.isSuccess) "Account for '$name' ($email) provisioned successfully." else null,
                    errorMessage = if (result.isFailure) "Account provisioning error: ${result.exceptionOrNull()?.localizedMessage}" else null
                )
            }
        }
    }

    fun confirmDeleteUser(user: UserProfile?) {
        _uiState.update { it.copy(userToDelete = user) }
    }

    fun executeDeleteUser() {
        val user = _uiState.value.userToDelete ?: return
        viewModelScope.launch {
            val result = authRepository.deleteUserDoc(user.uid)
            _uiState.update {
                it.copy(
                    userToDelete = null,
                    infoMessage = if (result.isSuccess) "User '${user.name}' record removed. Note: Auth record must be purged from Firebase console." else null,
                    errorMessage = if (result.isFailure) "Failed to delete user: ${result.exceptionOrNull()?.localizedMessage}" else null
                )
            }
        }
    }

    // --- Clue CRUD ---
    fun openAddClueDialog(show: Boolean) {
        _uiState.update {
            it.copy(
                showAddClueDialog = show,
                newClueText = "",
                newClueZoneId = "ZONE_0${it.clues.size + 1}",
                newClueZoneLabel = ""
            )
        }
    }

    fun onNewClueTextChanged(text: String) = _uiState.update { it.copy(newClueText = text) }
    fun onNewClueZoneIdChanged(zone: String) = _uiState.update { it.copy(newClueZoneId = zone) }
    fun onNewClueZoneLabelChanged(label: String) = _uiState.update { it.copy(newClueZoneLabel = label) }

    fun saveNewClue() {
        val state = _uiState.value
        val text = state.newClueText.trim()
        val zoneId = state.newClueZoneId.trim()
        val zoneLabel = state.newClueZoneLabel.trim()

        if (text.isBlank() || zoneId.isBlank()) {
            _uiState.update { it.copy(errorMessage = "Clue text and Zone ID are required.") }
            return
        }

        viewModelScope.launch {
            val result = clueRepository.createClue(text, zoneId, zoneLabel)
            _uiState.update {
                it.copy(
                    showAddClueDialog = false,
                    infoMessage = if (result.isSuccess) "Clue for $zoneId created." else null,
                    errorMessage = if (result.isFailure) "Failed to save clue: ${result.exceptionOrNull()?.localizedMessage}" else null
                )
            }
        }
    }

    fun confirmDeleteClue(clue: Clue?) {
        _uiState.update { it.copy(clueToDelete = clue) }
    }

    fun executeDeleteClue() {
        val clue = _uiState.value.clueToDelete ?: return
        viewModelScope.launch {
            val result = clueRepository.deleteClue(clue.id)
            _uiState.update {
                it.copy(
                    clueToDelete = null,
                    infoMessage = if (result.isSuccess) "Clue for ${clue.zoneId} deleted." else null,
                    errorMessage = if (result.isFailure) "Failed to delete clue: ${result.exceptionOrNull()?.localizedMessage}" else null
                )
            }
        }
    }

    // --- Undo Check-in ---
    fun confirmUndoCheckin(checkin: Checkin?) {
        _uiState.update { it.copy(checkinToUndo = checkin) }
    }

    fun executeUndoCheckin() {
        val checkin = _uiState.value.checkinToUndo ?: return
        val card = PlayingCard(
            rank = checkin.cardRank,
            suit = checkin.cardSuit,
            zoneId = checkin.zoneId
        )

        _uiState.update { it.copy(isLoading = true, checkinToUndo = null) }
        viewModelScope.launch {
            val result = checkinRepository.undoCheckin(checkin, card)
            _uiState.update {
                it.copy(
                    isLoading = false,
                    infoMessage = if (result.isSuccess) "Check-in undone! Deducted ${checkin.points} PTS from team." else null,
                    errorMessage = if (result.isFailure) "Undo failed: ${result.exceptionOrNull()?.localizedMessage}" else null
                )
            }
        }
    }

    fun dismissMessage() {
        _uiState.update { it.copy(errorMessage = null, infoMessage = null) }
    }

    fun approveTeam(teamId: String) {
        _uiState.update { it.copy(isLoading = true) }
        viewModelScope.launch {
            val result = teamRepository.approveTeam(teamId)
            _uiState.update {
                it.copy(
                    isLoading = false,
                    infoMessage = if (result.isSuccess) "Squad clearance authorized. Team is approved to play." else "Failed to approve squad: ${result.exceptionOrNull()?.localizedMessage}"
                )
            }
        }
    }

    fun exportLeaderboardText(): String {
        val state = uiState.value
        val sb = StringBuilder()
        sb.appendLine("=========================================")
        sb.appendLine("TERRITORY GRID // MISSION LEADERBOARD")
        sb.appendLine("Status: ${state.gameState.status}")
        sb.appendLine("=========================================")
        state.teams.forEachIndexed { index, team ->
            sb.appendLine("#${index + 1} ${team.name} — ${team.score} PTS (${team.cards.size} Cards)")
        }
        sb.appendLine("=========================================")
        sb.appendLine("Generated via Territory Grid Tactical Protocol")
        return sb.toString()
    }

    private fun generateCyberPassword(): String {
        val chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!#$@"
        val random = SecureRandom()
        val sb = StringBuilder()
        repeat(10) {
            sb.append(chars[random.nextInt(chars.length)])
        }
        return sb.toString()
    }
}
