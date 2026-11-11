package com.yourname.territorygrid.ui.player

import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.GameState
import com.yourname.territorygrid.domain.model.GameStatus
import com.yourname.territorygrid.domain.model.PlayingCard
import com.yourname.territorygrid.domain.model.Team
import com.yourname.territorygrid.domain.model.UserProfile

enum class PlayerTab {
    HUNT,
    CARDS,
    LEADERBOARD
}

data class TeamLeaderboardItem(
    val team: Team,
    val rank: Int,
    val isUserTeam: Boolean,
    val deltaFromLeader: Int,
    val cardsCount: Int
)

data class PlayerUiState(
    val currentTab: PlayerTab = PlayerTab.HUNT,
    val userProfile: UserProfile? = null,
    val team: Team? = null,
    val activeClue: Clue? = null,
    val gameState: GameState = GameState(),
    val allTeams: List<Team> = emptyList(),
    val recentPointsDelta: Int? = null,
    val showPointsDeltaBanner: Boolean = false,
    val errorMessage: String? = null,
    val infoMessage: String? = null,
    // Self-registration
    val showRegisterTeamDialog: Boolean = false,
    val registerTeamName: String = "",
    val isRegistering: Boolean = false
) {
    val hasNoTeamAssigned: Boolean
        get() = userProfile?.teamId.isNullOrBlank()

    val isTeamPendingApproval: Boolean
        get() = team != null && !team.isApproved

    val isLobbyPhase: Boolean
        get() = gameState.status == GameStatus.LOBBY

    val isMemberPhase: Boolean
        get() = gameState.status == GameStatus.MEMBER_PHASE

    val isGamePaused: Boolean
        get() = gameState.status == GameStatus.PAUSED

    val isGameEnded: Boolean
        get() = gameState.status == GameStatus.ENDED

    val isAllCluesFinished: Boolean
        get() = team != null && team.clueOrder.isNotEmpty() && team.currentClueIndex >= team.clueOrder.size

    val cardsCollected: List<PlayingCard>
        get() = team?.cards ?: emptyList()

    val totalPointsFromCards: Int
        get() = cardsCollected.sumOf { it.rank }

    // Sorted leaderboard: score descending, ties broken by earliest updatedAt, then name
    val sortedTeams: List<Team>
        get() = allTeams.sortedWith(
            compareByDescending<Team> { it.score }
                .thenBy { it.updatedAt?.toDate()?.time ?: Long.MAX_VALUE }
                .thenBy { it.name }
        )

    val leaderboard: List<TeamLeaderboardItem>
        get() {
            val sorted = sortedTeams
            val leaderScore = sorted.firstOrNull()?.score ?: 0
            val userTeamId = team?.id ?: userProfile?.teamId

            return sorted.mapIndexed { index, t ->
                TeamLeaderboardItem(
                    team = t,
                    rank = index + 1,
                    isUserTeam = t.id == userTeamId,
                    deltaFromLeader = (leaderScore - t.score).coerceAtLeast(0),
                    cardsCount = t.cards.size
                )
            }
        }

    val userTeamItem: TeamLeaderboardItem?
        get() = leaderboard.find { it.isUserTeam }

    val userRank: Int
        get() = userTeamItem?.rank ?: 0

    val totalTeamsCount: Int
        get() = allTeams.size

    val currentClueNumber: Int
        get() = ((team?.currentClueIndex ?: 0) + 1).coerceAtMost(team?.clueOrder?.size ?: 1)

    val totalCluesCount: Int
        get() = team?.clueOrder?.size ?: 0
}
