package com.yourname.territorygrid.ui.admin

import com.yourname.territorygrid.domain.model.Checkin
import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.GameState
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.domain.model.Team
import com.yourname.territorygrid.domain.model.UserProfile

enum class AdminTab {
    CONTROL,
    TEAMS,
    PEOPLE,
    CLUES,
    LIVE
}

data class AdminUiState(
    val currentTab: AdminTab = AdminTab.CONTROL,
    val gameState: GameState = GameState(),
    val teams: List<Team> = emptyList(),
    val users: List<UserProfile> = emptyList(),
    val clues: List<Clue> = emptyList(),
    val checkins: List<Checkin> = emptyList(),
    val elapsedMs: Long = 0L,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val infoMessage: String? = null,

    // Reset Grid Dialog
    val showResetDialog: Boolean = false,
    val resetInputText: String = "",

    // Team Dialogs
    val showAddTeamDialog: Boolean = false,
    val newTeamName: String = "",
    val teamToDelete: Team? = null,

    // Clue Order Preview Dialog
    val showClueOrderPreviewDialog: Boolean = false,
    val generatedClueOrdersPreview: Map<String, List<String>> = emptyMap(),

    // User Dialogs
    val showAddUserDialog: Boolean = false,
    val newUserName: String = "",
    val newUserEmail: String = "",
    val newUserPass: String = "",
    val newUserRole: Role = Role.MEMBER,
    val newUserZoneId: String = "",
    val newUserTeamId: String = "",
    val userToDelete: UserProfile? = null,
    val userToEdit: UserProfile? = null,

    // Clue Dialogs
    val showAddClueDialog: Boolean = false,
    val newClueText: String = "",
    val newClueZoneId: String = "",
    val newClueZoneLabel: String = "",
    val clueToDelete: Clue? = null,
    val clueToEdit: Clue? = null,

    // Undo Check-in Dialog
    val checkinToUndo: Checkin? = null
) {
    val totalPoints: Int
        get() = teams.sumOf { it.score }

    val activeZonesCount: Int
        get() = clues.map { it.zoneId }.distinct().size

    val duplicateZoneWarnings: List<String>
        get() = clues.groupBy { it.zoneId }
            .filter { it.value.size > 1 }
            .map { "Zone ${it.key} has ${it.value.size} clues assigned!" }

    val formattedElapsedTime: String
        get() {
            val totalSeconds = (elapsedMs / 1000).coerceAtLeast(0L)
            val hours = totalSeconds / 3600
            val minutes = (totalSeconds % 3600) / 60
            val seconds = totalSeconds % 60
            return String.format("%02d:%02d:%02d", hours, minutes, seconds)
        }
}
