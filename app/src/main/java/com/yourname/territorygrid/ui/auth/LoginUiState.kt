package com.yourname.territorygrid.ui.auth

import com.yourname.territorygrid.domain.model.Role

enum class LoginScreenMode {
    PORTAL_CHOOSER,
    PORTAL_LOGIN
}

data class LoginUiState(
    val mode: LoginScreenMode = LoginScreenMode.PORTAL_CHOOSER,
    val selectedRole: Role? = null,
    val email: String = "",
    val pass: String = "",
    val isPasswordVisible: Boolean = false,
    val squadToken: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isOffline: Boolean = false
) {
    val roleDescriptor: String
        get() = when (selectedRole) {
            Role.PLAYER -> "HUNTER_FIELD // SQUAD HUD"
            Role.MEMBER -> "MARSHAL_LOG // ARBITER"
            Role.ADMIN -> "CMD_OPERATOR // GAME MASTER"
            null -> "SELECT OPERATIONAL CLEARANCE"
        }

    val actionButtonLabel: String
        get() = when (selectedRole) {
            Role.PLAYER -> "ENTER PLAYER SQUAD HUD"
            Role.MEMBER -> "ENTER FIELD MARSHAL STATION"
            Role.ADMIN -> "ENTER ADMIN COMMAND TERMINAL"
            null -> "ACCESS PORTAL"
        }

    val portalHeaderTitle: String
        get() = when (selectedRole) {
            Role.PLAYER -> "PLAYER SQUAD LOGIN"
            Role.MEMBER -> "FIELD MARSHAL LOGIN"
            Role.ADMIN -> "ADMIN COMMAND LOGIN"
            null -> "OPERATIONAL GATEWAY"
        }

    val missionZoneHint: String
        get() = when (selectedRole) {
            Role.PLAYER -> "COMPETITOR SQUAD // RECON HUD"
            Role.MEMBER -> "SECTOR CHECKPOINT // CONE & CARD ARBITRATION"
            Role.ADMIN -> "LEVEL 5 CLEARANCE // FULL GRID COMMAND"
            null -> "SELECT OPERATIONAL PORTAL"
        }
}
