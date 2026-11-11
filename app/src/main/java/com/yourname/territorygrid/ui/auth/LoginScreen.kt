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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import androidx.compose.ui.graphics.vector.ImageVector
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
                    .size(80.dp)
                    .clickable { onNavigateToGallery() }
                    .drawBehind {
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
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val w = size.width
                    val h = size.height
                    val tickLen = 14f

                    drawLine(TacticalColors.PrimaryContainer, Offset(0f, 0f), Offset(tickLen, 0f), strokeWidth = 2.5f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(0f, 0f), Offset(0f, tickLen), strokeWidth = 2.5f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(w, 0f), Offset(w - tickLen, 0f), strokeWidth = 2.5f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(w, 0f), Offset(w, tickLen), strokeWidth = 2.5f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(0f, h), Offset(tickLen, h), strokeWidth = 2.5f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(0f, h), Offset(0f, h - tickLen), strokeWidth = 2.5f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(w, h), Offset(w - tickLen, h), strokeWidth = 2.5f)
                    drawLine(TacticalColors.PrimaryContainer, Offset(w, h), Offset(w, h - tickLen), strokeWidth = 2.5f)

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

            Spacer(modifier = Modifier.height(20.dp))

            // 3. Conditional Mode: Portal Chooser vs. Dedicated Login Form
            if (state.mode == LoginScreenMode.PORTAL_CHOOSER) {
                // STARTUP PORTAL SELECTION
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        text = "SELECT OPERATIONAL PORTAL",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.PrimaryContainer,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // 1. Admin Portal
                    PortalSelectionCard(
                        title = "ADMIN COMMAND PORTAL",
                        clearance = "LEVEL 5 // GAME MASTER",
                        description = "Mission clock, phase transitions, squad approvals & live telemetry.",
                        icon = Icons.Default.Shield,
                        accentColor = TacticalColors.SecondaryContainer,
                        onClick = { viewModel.selectPortal(Role.ADMIN) }
                    )

                    // 2. Field Marshal Portal
                    PortalSelectionCard(
                        title = "FIELD MARSHAL PORTAL",
                        clearance = "SECTOR ARBITER // STATION CHECKPOINT",
                        description = "Checkpoint cone verification and card draw scoring arbitration.",
                        icon = Icons.Default.Security,
                        accentColor = TacticalColors.ConeGreen,
                        onClick = { viewModel.selectPortal(Role.MEMBER) }
                    )

                    // 3. Player Squad Portal
                    PortalSelectionCard(
                        title = "PLAYER SQUAD PORTAL",
                        clearance = "COMPETITOR SQUAD // RECON HUD",
                        description = "Active directive navigation, score ring and card inventory.",
                        icon = Icons.Default.SportsEsports,
                        accentColor = TacticalColors.PrimaryContainer,
                        onClick = { viewModel.selectPortal(Role.PLAYER) }
                    )
                }
            } else {
                // DEDICATED LOGIN TERMINAL FOR SELECTED PORTAL
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        // Back to Portal Chooser Button
                        Row(
                            modifier = Modifier
                                .clickable { viewModel.returnToPortalChooser() }
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = TacticalColors.PrimaryContainer,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "CHANGE OPERATIONAL PORTAL",
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.PrimaryContainer,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                        }

                        // Terminal Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(TacticalColors.SurfaceLowest, RoundedCornerShape(4.dp))
                                .padding(horizontal = 10.dp, vertical = 8.dp),
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
                                    tint = when (state.selectedRole) {
                                        Role.ADMIN -> TacticalColors.SecondaryContainer
                                        Role.MEMBER -> TacticalColors.ConeGreen
                                        else -> TacticalColors.PrimaryContainer
                                    },
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = state.portalHeaderTitle,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TacticalColors.TextPrimary,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.sp
                                )
                            }
                            Text(
                                text = state.roleDescriptor,
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.PrimaryFixed,
                                fontSize = 9.sp
                            )
                        }

                        // Specific hint for Admin
                        if (state.selectedRole == Role.ADMIN) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(TacticalColors.SecondaryContainer.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                    .border(1.dp, TacticalColors.SecondaryContainer.copy(alpha = 0.4f), RoundedCornerShape(4.dp))
                                    .padding(8.dp)
                            ) {
                                Text(
                                    text = "Game Master Clearance: ID = samay | Access Key = samay",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TacticalColors.TextPrimary,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        // Input 1: Callsign / ID
                        NeonTextField(
                            value = state.email,
                            onValueChange = { viewModel.onEmailChanged(it) },
                            label = if (state.selectedRole == Role.ADMIN) "Admin ID / Callsign" else stringResource(R.string.callsign_label),
                            placeholder = if (state.selectedRole == Role.ADMIN) "samay" else "callsign or user@recon.grid",
                            leadingIcon = {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    tint = TacticalColors.PrimaryContainer,
                                    modifier = Modifier.size(18.dp)
                                )
                            },
                            modifier = Modifier.fillMaxWidth()
                        )

                        // Input 2: Access Key
                        NeonTextField(
                            value = state.pass,
                            onValueChange = { viewModel.onPasswordChanged(it) },
                            label = stringResource(R.string.access_key_label),
                            placeholder = if (state.selectedRole == Role.ADMIN) "samay" else stringResource(R.string.access_key_hint),
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

                        // Error Banner
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

                        // Submit Button
                        NeonButton(
                            text = state.actionButtonLabel,
                            onClick = { viewModel.submitLogin() },
                            variant = when (state.selectedRole) {
                                Role.PLAYER -> NeonButtonVariant.PRIMARY
                                Role.MEMBER -> NeonButtonVariant.SUCCESS
                                Role.ADMIN -> NeonButtonVariant.DANGER
                                null -> NeonButtonVariant.PRIMARY
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
                    }
                }
            }
        }
    }
}

@Composable
private fun PortalSelectionCard(
    title: String,
    clearance: String,
    description: String,
    icon: ImageVector,
    accentColor: Color,
    onClick: () -> Unit
) {
    GlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(accentColor.copy(alpha = 0.15f))
                    .border(1.dp, accentColor.copy(alpha = 0.5f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = accentColor,
                    modifier = Modifier.size(28.dp)
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = clearance,
                    style = MaterialTheme.typography.labelSmall,
                    color = accentColor,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = TacticalColors.TextPrimary,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalColors.TextSecondary,
                    fontSize = 11.sp
                )
            }
        }
    }
}
