package com.yourname.territorygrid.ui.navigation

sealed class Screen(val route: String) {
    data object Splash : Screen("splash")
    data object Login : Screen("login")
    data object AdminRoot : Screen("admin_root")
    data object MemberRoot : Screen("member_root")
    data object PlayerRoot : Screen("player_root")
    data object Gallery : Screen("gallery")
    data object Settings : Screen("settings")
}
