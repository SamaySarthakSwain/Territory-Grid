package com.yourname.territorygrid.ui.auth

import com.yourname.territorygrid.domain.model.Role

data class LoginUiState(
    val email: String = "",
    val pass: String = "",
    val isPasswordVisible: Boolean = false,
    val selectedRoleHint: Role = Role.PLAYER,
    val squadToken: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isOffline: Boolean = false
) {
    val roleDescriptor: String
        get() = when (selectedRoleHint) {
            Role.PLAYER -> "HUNTER_FIELD"
            Role.MEMBER -> "MARSHAL_LOG"
            Role.ADMIN -> "CMD_OPERATOR"
        }

    val actionButtonLabel: String
        get() = when (selectedRoleHint) {
            Role.PLAYER -> "ENTER THE GRID"
            Role.MEMBER -> "FIELD MARSHAL STATION"
            Role.ADMIN -> "COMMAND CONTROL ACCESS"
        }

    val missionZoneHint: String
        get() = when (selectedRoleHint) {
            Role.PLAYER -> "MISSION CONCOURSE: SECTOR D"
            Role.MEMBER -> "BEACON ARBITRATION: ZONE 02"
            Role.ADMIN -> "CENTRAL TELEMETRY // FULL GRID"
        }
}
