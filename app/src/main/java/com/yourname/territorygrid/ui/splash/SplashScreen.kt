package com.yourname.territorygrid.ui.splash

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yourname.territorygrid.R
import com.yourname.territorygrid.data.repository.AuthRepository
import com.yourname.territorygrid.data.repository.AuthState
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.ui.components.HexGridBackground
import com.yourname.territorygrid.ui.components.NeonButton
import com.yourname.territorygrid.ui.components.NeonButtonVariant
import com.yourname.territorygrid.ui.theme.TacticalColors
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    authRepository: AuthRepository,
    onNavigateToLogin: () -> Unit,
    onNavigateToRole: (Role) -> Unit,
    modifier: Modifier = Modifier
) {
    val authState by authRepository.authState.collectAsState()

    val pulseTransition = rememberInfiniteTransition(label = "SplashPulse")
    val pulseAlpha by pulseTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "PulseAlpha"
    )

    LaunchedEffect(authState) {
        // Add a slight minimum dwell of 600ms so splash looks purposeful
        delay(600)
        when (val state = authState) {
            is AuthState.SignedIn -> onNavigateToRole(state.user.role)
            is AuthState.SignedOut -> onNavigateToLogin()
            is AuthState.Error -> {
                // If there's an error, allow user to proceed to login or retry
            }
            AuthState.Loading -> {
                // Keep showing splash
            }
        }
    }

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        HexGridBackground(modifier = Modifier.fillMaxSize())

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            // Glowing Radar Emblem
            Box(
                modifier = Modifier
                    .size(110.dp)
                    .drawBehind {
                        drawCircle(
                            brush = Brush.radialGradient(
                                colors = listOf(
                                    TacticalColors.PrimaryContainer.copy(alpha = 0.45f * pulseAlpha),
                                    Color.Transparent
                                )
                            ),
                            radius = size.width * 1.1f
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val w = size.width
                    val h = size.height
                    val tick = 18f

                    // Corner brackets
                    drawLine(TacticalColors.PrimaryContainer, Offset(0f, 0f), Offset(tick, 0f), strokeWidth = 3f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(0f, 0f), Offset(0f, tick), strokeWidth = 3f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(w, 0f), Offset(w - tick, 0f), strokeWidth = 3f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(w, 0f), Offset(w, tick), strokeWidth = 3f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(0f, h), Offset(tick, h), strokeWidth = 3f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(0f, h), Offset(0f, h - tick), strokeWidth = 3f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(w, h), Offset(w - tick, h), strokeWidth = 3f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(w, h), Offset(w, h - tick), strokeWidth = 3f)

                    // Concentric rings
                    drawCircle(
                        color = TacticalColors.PrimaryContainer.copy(alpha = 0.35f),
                        radius = w * 0.42f,
                        style = Stroke(width = 2f)
                    )
                    drawCircle(
                        color = TacticalColors.PrimaryContainer.copy(alpha = 0.7f),
                        radius = w * 0.24f,
                        style = Stroke(width = 2.5f)
                    )
                    drawCircle(
                        color = TacticalColors.PrimaryContainer,
                        radius = 5f
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Title
            Text(
                text = buildAnnotatedString {
                    append("TERRITORY ")
                    withStyle(SpanStyle(color = TacticalColors.PrimaryContainer)) {
                        append("GRID")
                    }
                },
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                letterSpacing = 3.sp,
                color = TacticalColors.TextPrimary
            )

            Text(
                text = stringResource(R.string.tagline),
                style = MaterialTheme.typography.labelSmall,
                color = TacticalColors.PrimaryFixed,
                letterSpacing = 2.sp,
                modifier = Modifier.padding(top = 6.dp)
            )

            Spacer(modifier = Modifier.height(40.dp))

            when (val state = authState) {
                is AuthState.Error -> {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = TacticalColors.Error,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = state.message,
                                style = MaterialTheme.typography.bodySmall,
                                color = TacticalColors.Error
                            )
                        }
                        NeonButton(
                            text = "PROCEED TO LOGIN",
                            onClick = onNavigateToLogin,
                            variant = NeonButtonVariant.SECONDARY
                        )
                    }
                }
                else -> {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = TacticalColors.PrimaryContainer,
                            strokeWidth = 2.dp
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Box(Modifier.size(6.dp).background(TacticalColors.ConeGreen, CircleShape))
                            Text(
                                text = stringResource(R.string.splash_init),
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.TextSecondary,
                                letterSpacing = 1.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
