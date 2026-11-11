package com.yourname.territorygrid.ui.settings

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
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.Vibration
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.yourname.territorygrid.R
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.ui.components.GlassCard
import com.yourname.territorygrid.ui.components.HexGridBackground
import com.yourname.territorygrid.ui.components.NeonButton
import com.yourname.territorygrid.ui.components.NeonButtonVariant
import com.yourname.territorygrid.ui.theme.TacticalColors

@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToGallery: () -> Unit,
    onSignedOut: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    Box(modifier = modifier.fillMaxSize()) {
        HexGridBackground(
            modifier = Modifier.fillMaxSize(),
            isLiteMode = uiState.isLiteMode
        )

        Column(modifier = Modifier.fillMaxSize()) {
            // Header Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(TacticalColors.Surface.copy(alpha = 0.9f))
                    .padding(horizontal = 8.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onNavigateBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = TacticalColors.NeonCyan
                    )
                }
                Spacer(modifier = Modifier.width(4.dp))
                Column {
                    Text(
                        text = stringResource(R.string.settings_title),
                        style = MaterialTheme.typography.titleMedium,
                        color = TacticalColors.NeonCyan,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = "System Diagnostics & Preferences",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary
                    )
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Identity Card
                val user = uiState.currentUser
                if (user != null) {
                    GlassCard(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(TacticalColors.Primary.copy(alpha = 0.15f), CircleShape)
                                    .border(1.5.dp, TacticalColors.NeonCyan, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    tint = TacticalColors.NeonCyan,
                                    modifier = Modifier.size(24.dp)
                                )
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = user.name.ifBlank { user.email },
                                    style = MaterialTheme.typography.titleMedium,
                                    color = TacticalColors.TextPrimary,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = user.email,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TacticalColors.TextSecondary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    RolePill(role = user.role)
                                    if (!user.zoneId.isNullOrBlank()) {
                                        Text(
                                            text = "ZONE: ${user.zoneId}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = TacticalColors.NeonGreen,
                                            fontSize = 9.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Toggles Group
                Text(
                    text = "HARDWARE & PERFORMANCE",
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalColors.TextSecondary,
                    letterSpacing = 1.sp
                )

                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        SettingToggleRow(
                            icon = Icons.Default.Speed,
                            title = stringResource(R.string.lite_mode),
                            description = "Disables animated hex canvas drift to conserve phone battery.",
                            checked = uiState.isLiteMode,
                            onCheckedChange = { viewModel.toggleLiteMode(it) }
                        )

                        Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(TacticalColors.CardBorder))

                        SettingToggleRow(
                            icon = Icons.Default.Vibration,
                            title = stringResource(R.string.haptics_enabled),
                            description = "Tactile vibrational pulse on scoring, card scan, and phase transitions.",
                            checked = uiState.isHapticsEnabled,
                            onCheckedChange = { viewModel.toggleHaptics(it) }
                        )

                        Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(TacticalColors.CardBorder))

                        SettingToggleRow(
                            icon = Icons.AutoMirrored.Filled.VolumeUp,
                            title = stringResource(R.string.audio_enabled),
                            description = "Auditory sound effects on point calculation and station check-in.",
                            checked = uiState.isAudioEnabled,
                            onCheckedChange = { viewModel.toggleAudio(it) }
                        )
                    }
                }

                // Debug Tools
                Text(
                    text = "DIAGNOSTIC TELEMETRY",
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalColors.TextSecondary,
                    letterSpacing = 1.sp
                )

                GlassCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigateToGallery() }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Build,
                                contentDescription = null,
                                tint = TacticalColors.NeonCyan,
                                modifier = Modifier.size(20.dp)
                            )
                            Column {
                                Text(
                                    text = "Component Design Gallery",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TacticalColors.TextPrimary,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "Inspect tactical HUD tokens and UI preview widgets",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TacticalColors.TextSecondary
                                )
                            }
                        }

                        Text(
                            text = "OPEN ▶",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.NeonCyan,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Session termination
                Spacer(modifier = Modifier.height(8.dp))
                NeonButton(
                    text = stringResource(R.string.sign_out),
                    onClick = { viewModel.signOut(onSignedOut) },
                    variant = NeonButtonVariant.DANGER,
                    modifier = Modifier.fillMaxWidth()
                )

                // Version display
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = uiState.version,
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalColors.TextSecondary.copy(alpha = 0.6f),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                    letterSpacing = 1.5.sp
                )
            }
        }
    }
}

@Composable
private fun SettingToggleRow(
    icon: ImageVector,
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.weight(1f)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (checked) TacticalColors.NeonCyan else TacticalColors.TextSecondary,
                modifier = Modifier.size(22.dp)
            )
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TacticalColors.TextPrimary,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalColors.TextSecondary,
                    fontSize = 11.sp
                )
            }
        }

        Spacer(modifier = Modifier.width(8.dp))

        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = TacticalColors.NeonCyan,
                checkedTrackColor = TacticalColors.SurfaceHighest,
                uncheckedThumbColor = TacticalColors.TextSecondary,
                uncheckedTrackColor = TacticalColors.SurfaceLowest
            )
        )
    }
}

@Composable
private fun RolePill(role: Role) {
    val (color, text) = when (role) {
        Role.ADMIN -> Pair(TacticalColors.AlertMagenta, "COMMAND ADMIN")
        Role.MEMBER -> Pair(TacticalColors.NeonGreen, "FIELD MARSHAL")
        Role.PLAYER -> Pair(TacticalColors.NeonCyan, "GRID HUNTER")
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(color.copy(alpha = 0.15f))
            .border(0.5.dp, color, RoundedCornerShape(4.dp))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = color,
            fontWeight = FontWeight.Bold,
            fontSize = 9.sp
        )
    }
}
