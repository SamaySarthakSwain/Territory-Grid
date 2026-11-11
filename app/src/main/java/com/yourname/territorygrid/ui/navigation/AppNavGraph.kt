package com.yourname.territorygrid.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.yourname.territorygrid.data.repository.AuthRepository
import com.yourname.territorygrid.data.repository.AuthState
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.ui.admin.AdminRootScreen
import com.yourname.territorygrid.ui.auth.LoginScreen
import com.yourname.territorygrid.ui.auth.LoginViewModel
import com.yourname.territorygrid.ui.components.ComponentGalleryScreen
import com.yourname.territorygrid.ui.member.MemberRootScreen
import com.yourname.territorygrid.ui.player.PlayerRootScreen
import com.yourname.territorygrid.ui.settings.SettingsScreen
import com.yourname.territorygrid.ui.splash.SplashScreen
import kotlinx.coroutines.launch

@Composable
fun AppNavGraph(
    authRepository: AuthRepository,
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController()
) {
    val authState by authRepository.authState.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    // Route guards: react dynamically to live auth changes (e.g. sign-out, role assignment changes)
    LaunchedEffect(authState) {
        when (val state = authState) {
            is AuthState.SignedIn -> {
                val targetRoute = when (state.user.role) {
                    Role.ADMIN -> Screen.AdminRoot.route
                    Role.MEMBER -> Screen.MemberRoot.route
                    Role.PLAYER -> Screen.PlayerRoot.route
                }
                if (navController.currentDestination?.route != targetRoute) {
                    navController.navigate(targetRoute) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                        popUpTo(Screen.Login.route) { inclusive = true }
                        launchSingleTop = true
                    }
                }
            }
            AuthState.SignedOut -> {
                if (navController.currentDestination?.route != Screen.Login.route &&
                    navController.currentDestination?.route != Screen.Splash.route &&
                    navController.currentDestination?.route != Screen.Gallery.route
                ) {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                        launchSingleTop = true
                    }
                }
            }
            is AuthState.Error -> {
                // Keep on splash or login with error displayed
            }
            AuthState.Loading -> {
                // Stay on current or splash
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route,
        modifier = modifier
    ) {
        composable(Screen.Splash.route) {
            SplashScreen(
                authRepository = authRepository,
                onNavigateToLogin = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                },
                onNavigateToRole = { role ->
                    val route = when (role) {
                        Role.ADMIN -> Screen.AdminRoot.route
                        Role.MEMBER -> Screen.MemberRoot.route
                        Role.PLAYER -> Screen.PlayerRoot.route
                    }
                    navController.navigate(route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Login.route) {
            val loginViewModel: LoginViewModel = hiltViewModel()
            LoginScreen(
                viewModel = loginViewModel,
                onNavigateToGallery = {
                    navController.navigate(Screen.Gallery.route)
                }
            )
        }

        composable(Screen.AdminRoot.route) {
            val user = (authState as? AuthState.SignedIn)?.user
            if (user != null) {
                AdminRootScreen(
                    user = user,
                    onSignOut = {
                        navController.navigate(Screen.Settings.route)
                    }
                )
            }
        }

        composable(Screen.MemberRoot.route) {
            val user = (authState as? AuthState.SignedIn)?.user
            if (user != null) {
                MemberRootScreen(
                    user = user,
                    onSignOut = {
                        navController.navigate(Screen.Settings.route)
                    }
                )
            }
        }

        composable(Screen.PlayerRoot.route) {
            val user = (authState as? AuthState.SignedIn)?.user
            if (user != null) {
                PlayerRootScreen(
                    user = user,
                    onSignOut = {
                        navController.navigate(Screen.Settings.route)
                    }
                )
            }
        }

        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToGallery = { navController.navigate(Screen.Gallery.route) },
                onSignedOut = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Gallery.route) {
            ComponentGalleryScreen()
        }
    }
}
