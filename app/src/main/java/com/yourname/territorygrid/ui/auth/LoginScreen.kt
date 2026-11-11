package com.yourname.territorygrid.ui.auth

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.SportsEsports
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yourname.territorygrid.R
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.ui.components.GlassCard
import com.yourname.territorygrid.ui.components.HexGridBackground
import com.yourname.territorygrid.ui.components.NeonButton
import com.yourname.territorygrid.ui.components.NeonButtonVariant
import com.yourname.territorygrid.ui.components.NeonTextField
import com.yourname.territorygrid.ui.components.ScanlineDivider
import com.yourname.territorygrid.ui.theme.TacticalColors

@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onNavigateToGallery: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val state by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    val pulseTransition = rememberInfiniteTransition(label = "RadarPulse")
    val radarPulse by pulseTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "RadarPulseAnim"
    )

    Box(modifier = modifier.fillMaxSize()) {
        HexGridBackground(modifier = Modifier.fillMaxSize())

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 16.dp, vertical = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 1. Top Telemetry Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(
                                color = TacticalColors.ConeGreen.copy(alpha = radarPulse),
                                shape = CircleShape
                            )
                    )
                    Text(
                        text = stringResource(R.string.sys_online),
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary,
                        letterSpacing = 1.sp
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Security,
                        contentDescription = null,
                        tint = TacticalColors.PrimaryContainer,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = stringResource(R.string.grid_active),
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.PrimaryContainer,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 2. Brand Identity Hero
            Box(
                modifier = Modifier
                    .size(88.dp)
                    .clickable { onNavigateToGallery() } // Secret access to gallery
                    .drawBehind {
                        // Cyan ambient aura
                        drawCircle(
                            brush = Brush.radialGradient(
                                colors = listOf(
                                    TacticalColors.PrimaryContainer.copy(alpha = 0.35f * radarPulse),
                                    Color.Transparent
                                )
                            ),
                            radius = size.width * 0.9f
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                // Tactical Emblem Frame
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val w = size.width
                    val h = size.height
                    val tickLen = 14f

                    // 4-corner reticle marks
                    // Top-Left
                    drawLine(TacticalColors.PrimaryContainer, Offset(0f, 0f), Offset(tickLen, 0f), strokeWidth = 2.5f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(0f, 0f), Offset(0f, tickLen), strokeWidth = 2.5f)
                    // Top-Right
                    drawLine(TacticalColors.PrimaryContainer, Offset(w, 0f), Offset(w - tickLen, 0f), strokeWidth = 2.5f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(w, 0f), Offset(w, tickLen), strokeWidth = 2.5f)
                    // Bottom-Left
                    drawLine(TacticalColors.PrimaryContainer, Offset(0f, h), Offset(tickLen, h), strokeWidth = 2.5f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(0f, h), Offset(0f, h - tickLen), strokeWidth = 2.5f)
                    // Bottom-Right
                    drawLine(TacticalColors.PrimaryContainer, Offset(w, h), Offset(w - tickLen, h), strokeWidth = 2.5f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(w, h), Offset(w, h - tickLen), strokeWidth = 2.5f)

                    // Concentric radar rings
                    drawCircle(
                        color = TacticalColors.PrimaryContainer.copy(alpha = 0.25f),
                        radius = w * 0.38f,
                        style = Stroke(width = 1.5f)
                    )
                    drawCircle(
                        color = TacticalColors.PrimaryContainer.copy(alpha = 0.5f),
                        radius = w * 0.22f,
                        style = Stroke(width = 2f)
                    )
                    drawCircle(
                        color = TacticalColors.PrimaryContainer,
                        radius = 4f
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Title
            Text(
                text = buildAnnotatedString {
                    append("TERRITORY ")
                    withStyle(SpanStyle(color = TacticalColors.PrimaryContainer)) {
                        append("GRID")
                    }
                },
                style = MaterialTheme.typography.headlineLarge,
                color = TacticalColors.TextPrimary,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp
            )

            Text(
                text = stringResource(R.string.tagline),
                style = MaterialTheme.typography.labelSmall,
                color = TacticalColors.PrimaryFixed,
                letterSpacing = 2.sp,
                modifier = Modifier.padding(top = 4.dp)
            )

            // Subtitle Pills: EXPLORE • HUNT • SCORE • WIN
            Row(
                modifier = Modifier.padding(top = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text("EXPLORE", style = MaterialTheme.typography.labelSmall, color = TacticalColors.TextSecondary)
                Box(Modifier.size(3.dp).background(TacticalColors.PrimaryContainer, CircleShape))
                Text("HUNT", style = MaterialTheme.typography.labelSmall, color = TacticalColors.SecondaryContainer)
                Box(Modifier.size(3.dp).background(TacticalColors.SecondaryContainer, CircleShape))
                Text("SCORE", style = MaterialTheme.typography.labelSmall, color = TacticalColors.ConeYellow)
                Box(Modifier.size(3.dp).background(TacticalColors.ConeYellow, CircleShape))
                Text("WIN", style = MaterialTheme.typography.labelSmall, color = TacticalColors.ConeGreen)
            }

            Spacer(modifier = Modifier.height(20.dp))

            // 3. Cyber Matrix Terminal Card
            GlassCard(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Terminal Header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(TacticalColors.SurfaceLowest, RoundedCornerShape(4.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = null,
                                tint = TacticalColors.PrimaryContainer,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = stringResource(R.string.gateway_header),
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.TextSecondary,
                                letterSpacing = 1.sp
                            )
                        }
                        Text(
                            text = stringResource(R.string.port_number),
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.ConeGreen,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // Role Quick-Selector Chip Matrix
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "ASSIGNMENT ROLE",
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.TextSecondary,
                                letterSpacing = 1.sp
                            )
                            Text(
                                text = state.roleDescriptor,
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.PrimaryContainer,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(TacticalColors.SurfaceLowest, RoundedCornerShape(6.dp))
                                .padding(4.dp),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            // Player
                            RoleChipButton(
                                title = "PLAYER",
                                isSelected = state.selectedRoleHint == Role.PLAYER,
                                activeColor = TacticalColors.PrimaryContainer,
                                activeTextColor = TacticalColors.Background,
                                icon = Icons.Default.SportsEsports,
                                modifier = Modifier.weight(1f),
                                onClick = { viewModel.onRoleHintSelected(Role.PLAYER) }
                            )

                            // Marshal (Member)
                            RoleChipButton(
                                title = "MARSHAL",
                                isSelected = state.selectedRoleHint == Role.MEMBER,
                                activeColor = TacticalColors.ConeGreen,
                                activeTextColor = TacticalColors.Background,
                                icon = Icons.Default.Security,
                                modifier = Modifier.weight(1f),
                                onClick = { viewModel.onRoleHintSelected(Role.MEMBER) }
                            )

                            // Admin
                            RoleChipButton(
                                title = "ADMIN",
                                isSelected = state.selectedRoleHint == Role.ADMIN,
                                activeColor = TacticalColors.SecondaryContainer,
                                activeTextColor = TacticalColors.TextPrimary,
                                icon = Icons.Default.Shield,
                                modifier = Modifier.weight(1f),
                                onClick = { viewModel.onRoleHintSelected(Role.ADMIN) }
                            )
                        }
                    }

                    // Input 1: Tactical Callsign / Email
                    NeonTextField(
                        value = state.email,
                        onValueChange = { viewModel.onEmailChanged(it) },
                        label = stringResource(R.string.callsign_label),
                        placeholder = "agent@recon.grid or CALLSIGN",
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = null,
                                tint = TacticalColors.PrimaryContainer,
                                modifier = Modifier.size(18.dp)
                            )
                        },
                        trailingIcon = {
                            Text(
                                text = stringResource(R.string.required_badge),
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.PrimaryFixed,
                                fontSize = 9.sp
                            )
                        },
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Input 2: Cryptographic Access Key
                    NeonTextField(
                        value = state.pass,
                        onValueChange = { viewModel.onPasswordChanged(it) },
                        label = stringResource(R.string.access_key_label),
                        placeholder = stringResource(R.string.access_key_hint),
                        visualTransformation = if (state.isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = null,
                                tint = TacticalColors.PrimaryContainer,
                                modifier = Modifier.size(18.dp)
                            )
                        },
                        trailingIcon = {
                            IconButton(onClick = { viewModel.onTogglePasswordVisibility() }) {
                                Icon(
                                    imageVector = if (state.isPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = "Toggle password visibility",
                                    tint = TacticalColors.TextSecondary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Active Mission Zone Telemetry
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(TacticalColors.SurfaceLowest, RoundedCornerShape(6.dp))
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = state.missionZoneHint,
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.TextPrimary,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = stringResource(R.string.auto_locks_beacon),
                                style = MaterialTheme.typography.bodySmall,
                                color = TacticalColors.TextSecondary,
                                fontSize = 10.sp
                            )
                        }
                        Box(
                            modifier = Modifier
                                .background(TacticalColors.ConeGreen.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                .border(1.dp, TacticalColors.ConeGreen.copy(alpha = 0.5f), RoundedCornerShape(4.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = stringResource(R.string.synced_badge),
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.ConeGreen,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // Friendly Tactical Error Alert
                    AnimatedVisibility(
                        visible = state.errorMessage != null,
                        enter = fadeIn(),
                        exit = fadeOut()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(TacticalColors.ErrorContainer.copy(alpha = 0.25f), RoundedCornerShape(6.dp))
                                .border(1.dp, TacticalColors.Error, RoundedCornerShape(6.dp))
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Warning,
                                contentDescription = null,
                                tint = TacticalColors.Error,
                                modifier = Modifier.size(18.dp)
                            )
                            Text(
                                text = state.errorMessage.orEmpty(),
                                style = MaterialTheme.typography.bodySmall,
                                color = TacticalColors.Error,
                                fontSize = 11.sp
                            )
                        }
                    }

                    // Primary Submit Button
                    NeonButton(
                        text = state.actionButtonLabel,
                        onClick = { viewModel.submitLogin() },
                        variant = when (state.selectedRoleHint) {
                            Role.PLAYER -> NeonButtonVariant.PRIMARY
                            Role.MEMBER -> NeonButtonVariant.SUCCESS
                            Role.ADMIN -> NeonButtonVariant.DANGER
                        },
                        isLoading = state.isLoading,
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.PlayArrow,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                        },
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Fast Deployment Divider
                    ScanlineDivider(modifier = Modifier.padding(vertical = 4.dp))

                    // Quick Team Passcode Access Shortcut
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(TacticalColors.SurfaceLowest, RoundedCornerShape(6.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Security,
                            contentDescription = null,
                            tint = TacticalColors.SecondaryContainer,
                            modifier = Modifier.size(18.dp)
                        )
                        Box(modifier = Modifier.weight(1f)) {
                            Text(
                                text = stringResource(R.string.squad_token_hint),
                                style = MaterialTheme.typography.bodySmall,
                                color = TacticalColors.TextSecondary,
                                fontSize = 12.sp
                            )
                        }
                        Box(
                            modifier = Modifier
                                .background(TacticalColors.SecondaryContainer, RoundedCornerShape(4.dp))
                                .clickable {
                                    viewModel.onEmailChanged("player1@recon.grid")
                                    viewModel.onPasswordChanged("recon123")
                                    viewModel.onRoleHintSelected(Role.PLAYER)
                                }
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = stringResource(R.string.join),
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.TextPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 4. Live Intel Telemetry Snippet (3 Cards)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                TelemetryStatCard(
                    title = stringResource(R.string.active_teams),
                    value = "08",
                    valueColor = TacticalColors.PrimaryContainer,
                    modifier = Modifier.weight(1f)
                )
                TelemetryStatCard(
                    title = stringResource(R.string.field_cones),
                    value = "14/14",
                    valueColor = TacticalColors.ConeGreen,
                    modifier = Modifier.weight(1f)
                )
                TelemetryStatCard(
                    title = stringResource(R.string.match_timer),
                    value = "45:32",
                    valueColor = TacticalColors.SecondaryContainer,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // 5. Tactical Footer
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(Modifier.size(4.dp).background(TacticalColors.ConeGreen, CircleShape))
                    Text(
                        text = "ADMIN • MARSHAL • PLAYER",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary,
                        letterSpacing = 1.sp
                    )
                    Box(Modifier.size(4.dp).background(TacticalColors.ConeGreen, CircleShape))
                }
                Text(
                    text = stringResource(R.string.security_protocol),
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalColors.TextSecondary.copy(alpha = 0.6f),
                    fontSize = 9.sp,
                    letterSpacing = 1.sp
                )
            }
        }
    }
}

@Composable
private fun RoleChipButton(
    title: String,
    isSelected: Boolean,
    activeColor: Color,
    activeTextColor: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(4.dp))
            .background(if (isSelected) activeColor else TacticalColors.SurfaceContainerHigh)
            .clickable { onClick() }
            .padding(vertical = 8.dp, horizontal = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isSelected) activeTextColor else TacticalColors.TextSecondary,
                modifier = Modifier.size(16.dp)
            )
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = if (isSelected) activeTextColor else TacticalColors.TextSecondary,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                fontSize = 10.sp
            )
        }
    }
}

@Composable
private fun TelemetryStatCard(
    title: String,
    value: String,
    valueColor: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(TacticalColors.SurfaceContainerLow.copy(alpha = 0.8f))
            .border(1.dp, TacticalColors.BorderSubtle, RoundedCornerShape(6.dp))
            .padding(vertical = 8.dp, horizontal = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = TacticalColors.TextSecondary,
                fontSize = 9.sp,
                textAlign = TextAlign.Center
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                color = valueColor,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
        }
    }
}
