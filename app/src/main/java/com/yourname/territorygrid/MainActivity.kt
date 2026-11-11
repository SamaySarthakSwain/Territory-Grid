package com.yourname.territorygrid

import android.content.pm.ActivityInfo
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.yourname.territorygrid.data.repository.AuthRepository
import com.yourname.territorygrid.ui.navigation.AppNavGraph
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Strict portrait only per Non-Negotiable Rule 1
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT

        enableEdgeToEdge()

        setContent {
            TerritoryGridTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = TacticalColors.Background
                ) {
                    AppNavGraph(authRepository = authRepository)
                }
            }
        }
    }
}
