package com.yourname.territorygrid.ui.member

import com.yourname.territorygrid.domain.model.Checkin
import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.ConeColor
import com.yourname.territorygrid.domain.model.GameState
import com.yourname.territorygrid.domain.model.GameStatus
import com.yourname.territorygrid.domain.model.PlayingCard
import com.yourname.territorygrid.domain.model.Team
import com.yourname.territorygrid.domain.model.UserProfile

enum class TeamArrivalStatus {
    NONE_SELECTED,
    READY,
    NOT_DUE,
    ALREADY_CHECKED_IN,
    FINISHED,
    NOT_APPROVED
}

data class TeamEligibility(
    val team: Team,
    val isDueHere: Boolean,
    val alreadyCheckedIn: Boolean,
    val isFinished: Boolean,
    val activeZoneTarget: String
)

data class MemberCheckinUiState(
    val userProfile: UserProfile? = null,
    val gameState: GameState = GameState(),
    val teams: List<Team> = emptyList(),
    val clues: List<Clue> = emptyList(),
    val recentSubmissions: List<Checkin> = emptyList(),
    val selectedTeamId: String? = null,
    val selectedCone: ConeColor = ConeColor.YELLOW,
    val selectedCardRank: Int = 13, // King by default
    val selectedCardSuit: String = "♠",
    val showConfirmDialog: Boolean = false,
    val isSubmitting: Boolean = false,
    val submissionSuccess: Boolean = false,
    val errorMessage: String? = null,
    val infoMessage: String? = null,
    val cycleRemainingSeconds: Int = 18
) {
    val assignedZoneId: String?
        get() = userProfile?.zoneId?.takeIf { it.isNotBlank() }

    val hasNoZoneAssigned: Boolean
        get() = assignedZoneId == null

    val selectedTeam: Team?
        get() = teams.find { it.id == selectedTeamId }

    val currentCard: PlayingCard
        get() = PlayingCard(rank = selectedCardRank, suit = selectedCardSuit, zoneId = assignedZoneId.orEmpty())

    val totalPointsToAward: Int
        get() = selectedCardRank.coerceIn(1, 13) + selectedCone.points

    val isPhaseAllowed: Boolean
        get() = gameState.status == GameStatus.PLAYER_PHASE

    // Evaluate eligibility for a given team against this marshal's assigned zone
    fun evaluateTeam(team: Team): TeamEligibility {
        val zone = assignedZoneId.orEmpty()
        val order = team.clueOrder
        val index = team.currentClueIndex
        val isFinished = order.isNotEmpty() && index >= order.size
        val alreadyChecked = team.visitedZones.contains(zone) ||
                recentSubmissions.any { it.teamId == team.id && it.zoneId == zone }

        val activeClueId = if (index < order.size) order.getOrNull(index) else null
        val activeClue = clues.find { it.id == activeClueId }
        val activeTarget = activeClue?.zoneLabel?.ifBlank { activeClue.zoneId } ?: activeClue?.zoneId ?: "None"
        val isDue = !isFinished && !alreadyChecked && activeClue != null && activeClue.zoneId == zone

        return TeamEligibility(
            team = team,
            isDueHere = isDue,
            alreadyCheckedIn = alreadyChecked,
            isFinished = isFinished,
            activeZoneTarget = activeTarget
        )
    }

    val selectedTeamEligibility: TeamEligibility?
        get() = selectedTeam?.let { evaluateTeam(it) }

    val arrivalStatus: TeamArrivalStatus
        get() {
            val elig = selectedTeamEligibility ?: return TeamArrivalStatus.NONE_SELECTED
            return when {
                !elig.team.isApproved -> TeamArrivalStatus.NOT_APPROVED
                elig.isFinished -> TeamArrivalStatus.FINISHED
                elig.alreadyCheckedIn -> TeamArrivalStatus.ALREADY_CHECKED_IN
                elig.isDueHere -> TeamArrivalStatus.READY
                else -> TeamArrivalStatus.NOT_DUE
            }
        }

    val canSubmit: Boolean
        get() = !hasNoZoneAssigned &&
                isPhaseAllowed &&
                arrivalStatus == TeamArrivalStatus.READY &&
                !isSubmitting

    val blockingReason: String?
        get() = when {
            hasNoZoneAssigned -> "No checkpoint zone assigned. Contact Game Master."
            !isPhaseAllowed -> "Check-ins locked: Mission is currently in ${gameState.status.name}."
            selectedTeamId == null -> "Select the arrived team to proceed."
            arrivalStatus == TeamArrivalStatus.NOT_APPROVED -> "Squad not yet approved by Game Master. Cannot score unapproved squads."
            arrivalStatus == TeamArrivalStatus.FINISHED -> "Team has completed all grid directives."
            arrivalStatus == TeamArrivalStatus.ALREADY_CHECKED_IN -> "Team has already completed checkpoint for this zone."
            arrivalStatus == TeamArrivalStatus.NOT_DUE -> {
                val target = selectedTeamEligibility?.activeZoneTarget ?: "another station"
                "Team directive targets $target. Arrival rejected."
            }
            else -> null
        }

    // Telemetry stats
    val loggedCountAtThisZone: Int
        get() = assignedZoneId?.let { zone ->
            teams.count { it.visitedZones.contains(zone) }
        } ?: 0

    val queueCountForThisZone: Int
        get() = assignedZoneId?.let { zone ->
            teams.count { team ->
                val elig = evaluateTeam(team)
                elig.isDueHere
            }
        } ?: 0
}
