package com.yourname.territorygrid.ui.member

import android.view.HapticFeedbackConstants
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.yourname.territorygrid.R
import com.yourname.territorygrid.domain.model.Checkin
import com.yourname.territorygrid.domain.model.ConeColor
import com.yourname.territorygrid.domain.model.GameStatus
import com.yourname.territorygrid.domain.model.SyncStatus
import com.yourname.territorygrid.domain.model.Team
import com.yourname.territorygrid.domain.model.UserProfile
import com.yourname.territorygrid.ui.components.ConfirmDialog
import com.yourname.territorygrid.ui.components.GlassCard
import com.yourname.territorygrid.ui.components.HexGridBackground
import com.yourname.territorygrid.ui.components.NeonButton
import com.yourname.territorygrid.ui.components.NeonButtonVariant
import com.yourname.territorygrid.ui.components.TopHudBar
import com.yourname.territorygrid.ui.theme.TacticalColors

@Composable
fun MemberRootScreen(
    user: UserProfile,
    onSignOut: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: MemberCheckinViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val view = LocalView.current

    var showTeamPicker by remember { mutableStateOf(false) }

    Box(modifier = modifier.fillMaxSize()) {
        HexGridBackground(modifier = Modifier.fillMaxSize())

        Column(modifier = Modifier.fillMaxSize()) {
            TopHudBar(
                title = stringResource(R.string.field_marshal),
                subtitle = stringResource(R.string.checkpoint_log),
                roleLabel = "MARSHAL",
                onProfileClick = onSignOut
            )

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                contentPadding = PaddingValues(top = 12.dp, bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Tactical Hero / Field Marshal Status Card
                item {
                    MarshalHeroCard(
                        user = user,
                        assignedZoneId = uiState.assignedZoneId,
                        loggedCount = uiState.loggedCountAtThisZone,
                        totalTeams = uiState.teams.size,
                        queueCount = uiState.queueCountForThisZone
                    )
                }

                // Phase Lockout / No Zone Warnings
                if (uiState.hasNoZoneAssigned) {
                    item {
                        AlertBanner(
                            title = "NO GRID ZONE ASSIGNED",
                            message = stringResource(R.string.member_no_zone_assigned),
                            color = TacticalColors.RedGlow
                        )
                    }
                } else if (!uiState.isPhaseAllowed) {
                    item {
                        AlertBanner(
                            title = "CHECK-INS LOCKED",
                            message = stringResource(
                                R.string.member_phase_locked,
                                uiState.gameState.status.name
                            ),
                            color = TacticalColors.GoldAlert
                        )
                    }
                }

                // Error / Info banners
                if (uiState.errorMessage != null) {
                    item {
                        MessageBanner(
                            message = uiState.errorMessage!!,
                            isError = true,
                            onDismiss = { viewModel.clearMessages() }
                        )
                    }
                }

                if (uiState.infoMessage != null) {
                    item {
                        MessageBanner(
                            message = uiState.infoMessage!!,
                            isError = false,
                            onDismiss = { viewModel.clearMessages() }
                        )
                    }
                }

                // STEP 1: Select Arrived Team
                item {
                    Step1TeamCard(
                        selectedTeam = uiState.selectedTeam,
                        arrivalStatus = uiState.arrivalStatus,
                        selectedEligibility = uiState.selectedTeamEligibility,
                        onClickSelect = { showTeamPicker = true }
                    )
                }

                // STEP 2: Cone Color / Beacon Verified
                item {
                    Step2ConeCard(
                        selectedCone = uiState.selectedCone,
                        onSelectCone = {
                            view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                            viewModel.onConeSelected(it)
                        }
                    )
                }

                // STEP 3: Scan Player Card (NFC / Interactive Card Matrix)
                item {
                    Step3CardMatrix(
                        rank = uiState.selectedCardRank,
                        suit = uiState.selectedCardSuit,
                        onRankSelected = {
                            view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                            viewModel.onCardRankSelected(it)
                        },
                        onSuitSelected = {
                            view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                            viewModel.onCardSuitSelected(it)
                        }
                    )
                }

                // Live Points Calculation Breakdown
                item {
                    PointsAwardSummaryCard(
                        cone = uiState.selectedCone,
                        cardRank = uiState.selectedCardRank,
                        totalPoints = uiState.totalPointsToAward,
                        teamName = uiState.selectedTeam?.name ?: "Pending Team Selection",
                        zoneId = uiState.assignedZoneId ?: "Unassigned"
                    )
                }

                // Primary Transmit Action Button
                item {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        NeonButton(
                            text = if (uiState.isSubmitting) "TRANSMITTING CIPHER..." else stringResource(R.string.transmit_clue),
                            onClick = {
                                view.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY)
                                viewModel.onRequestSubmit()
                            },
                            enabled = uiState.canSubmit,
                            variant = if (uiState.canSubmit) NeonButtonVariant.PRIMARY else NeonButtonVariant.SECONDARY,
                            modifier = Modifier.fillMaxWidth()
                        )

                        if (!uiState.canSubmit && uiState.blockingReason != null) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = uiState.blockingReason!!,
                                style = MaterialTheme.typography.bodySmall,
                                color = TacticalColors.RedGlow,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }

                // Recent Checkpoint Logs Feed
                item {
                    RecentCheckinLogsSection(
                        submissions = uiState.recentSubmissions,
                        onRetry = {
                            view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
                            viewModel.retrySubmission(it)
                        },
                        onDismiss = { viewModel.dismissSubmission(it.documentId) }
                    )
                }
            }
        }
    }

    // Team Picker Dialog
    if (showTeamPicker) {
        TeamPickerDialog(
            teams = uiState.teams,
            selectedTeamId = uiState.selectedTeamId,
            uiState = uiState,
            onSelect = { team ->
                viewModel.onTeamSelected(team.id)
                showTeamPicker = false
            },
            onDismiss = { showTeamPicker = false }
        )
    }

    // Pre-flight Confirmation Dialog per Non-Negotiable Rule 2
    if (uiState.showConfirmDialog) {
        val team = uiState.selectedTeam
        val cone = uiState.selectedCone
        val card = uiState.currentCard
        val points = uiState.totalPointsToAward

        ConfirmDialog(
            title = stringResource(R.string.confirm_submission_title),
            message = "Award ${points} PTS (${cone.name} Cone + ${card.rankDisplay}${card.suitSymbol}) to ${team?.name} at Station ${uiState.assignedZoneId}?\n\nThis will advance the squad's clue directive immediately.",
            confirmText = "Transmit & Unlock",
            onConfirm = {
                view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
                viewModel.executeCheckin()
            },
            onDismiss = { viewModel.dismissConfirmDialog() }
        )
    }
}

// -------------------------------------------------------------
// UI SUBCOMPONENTS
// -------------------------------------------------------------

@Composable
private fun MarshalHeroCard(
    user: UserProfile,
    assignedZoneId: String?,
    loggedCount: Int,
    totalTeams: Int,
    queueCount: Int
) {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .background(TacticalColors.SurfaceHighest, RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "🛡",
                            fontSize = 20.sp
                        )
                    }

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "FIELD MARSHAL",
                                style = MaterialTheme.typography.titleMedium,
                                color = TacticalColors.TextPrimary,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .background(TacticalColors.NeonGreen, CircleShape)
                            )
                        }
                        Text(
                            text = "VALIDATE • LOG • ADVANCE",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.TextSecondary
                        )
                    }
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "GRID ZONE",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary
                    )
                    Text(
                        text = assignedZoneId ?: "NONE",
                        style = MaterialTheme.typography.titleMedium,
                        color = if (assignedZoneId != null) TacticalColors.NeonCyan else TacticalColors.RedGlow,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Quick Station Telemetry Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(TacticalColors.SurfaceLowest, RoundedCornerShape(8.dp))
                    .padding(vertical = 8.dp, horizontal = 12.dp),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = stringResource(R.string.station_telemetry_logged),
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary
                    )
                    Text(
                        text = "$loggedCount/$totalTeams",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TacticalColors.TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                }

                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(28.dp)
                        .background(TacticalColors.CardBorder)
                )

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = stringResource(R.string.station_telemetry_queue),
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary
                    )
                    Text(
                        text = "$queueCount Due",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TacticalColors.NeonGreen,
                        fontWeight = FontWeight.Bold
                    )
                }

                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(28.dp)
                        .background(TacticalColors.CardBorder)
                )

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = stringResource(R.string.station_telemetry_latency),
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary
                    )
                    Text(
                        text = "12ms",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TacticalColors.NeonCyan,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun Step1TeamCard(
    selectedTeam: Team?,
    arrivalStatus: TeamArrivalStatus,
    selectedEligibility: TeamEligibility?,
    onClickSelect: () -> Unit
) {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .background(TacticalColors.NeonCyan.copy(alpha = 0.2f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "01",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.NeonCyan,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.step_team_arrived),
                        style = MaterialTheme.typography.labelMedium,
                        color = TacticalColors.TextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(TacticalColors.NeonGreen, CircleShape)
                    )
                    Text(
                        text = stringResource(R.string.gps_locked),
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.NeonGreen
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Selector Button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(TacticalColors.SurfaceLowest)
                    .clickable { onClickSelect() }
                    .padding(horizontal = 14.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(text = "👥", fontSize = 16.sp)
                    Column {
                        Text(
                            text = selectedTeam?.name ?: stringResource(R.string.select_team_prompt),
                            style = MaterialTheme.typography.bodyLarge,
                            color = if (selectedTeam != null) TacticalColors.TextPrimary else TacticalColors.TextSecondary,
                            fontWeight = FontWeight.Medium
                        )
                        if (selectedTeam != null) {
                            Text(
                                text = "Score: ${selectedTeam.score} pts • Checkpoint: ${selectedTeam.currentClueIndex + 1}/${selectedTeam.clueOrder.size.coerceAtLeast(1)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TacticalColors.TextSecondary
                            )
                        }
                    }
                }

                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = "Expand",
                    tint = TacticalColors.TextSecondary
                )
            }

            // Status indication below selector
            if (selectedTeam != null) {
                Spacer(modifier = Modifier.height(8.dp))
                when (arrivalStatus) {
                    TeamArrivalStatus.READY -> {
                        Text(
                            text = "✓ " + stringResource(R.string.due_at_this_zone) + " — Clearance verified.",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.NeonGreen,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    TeamArrivalStatus.ALREADY_CHECKED_IN -> {
                        Text(
                            text = "⚠ " + stringResource(R.string.team_already_checked_in),
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.RedGlow,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    TeamArrivalStatus.FINISHED -> {
                        Text(
                            text = "⚠ " + stringResource(R.string.team_finished_all_clues),
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.GoldAlert,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    TeamArrivalStatus.NOT_DUE -> {
                        val target = selectedEligibility?.activeZoneTarget ?: "another zone"
                        Text(
                            text = "⚠ " + stringResource(R.string.targeting_zone, target) + " — Arrival rejected.",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.RedGlow,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    else -> {}
                }
            }
        }
    }
}

@Composable
private fun Step2ConeCard(
    selectedCone: ConeColor,
    onSelectCone: (ConeColor) -> Unit
) {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .background(TacticalColors.NeonCyan.copy(alpha = 0.2f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "02",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.NeonCyan,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.step_cone_verified),
                        style = MaterialTheme.typography.labelMedium,
                        color = TacticalColors.TextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Text(
                    text = "${selectedCone.name} SELECTED",
                    style = MaterialTheme.typography.labelSmall,
                    color = when (selectedCone) {
                        ConeColor.RED -> TacticalColors.RedGlow
                        ConeColor.YELLOW -> TacticalColors.GoldAlert
                        ConeColor.GREEN -> TacticalColors.NeonGreen
                    },
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 3-Cone Interactive Tiles
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ConeTile(
                    cone = ConeColor.RED,
                    isSelected = selectedCone == ConeColor.RED,
                    accentColor = TacticalColors.RedGlow,
                    pointsText = stringResource(R.string.pts_plus_10),
                    modifier = Modifier.weight(1f),
                    onClick = { onSelectCone(ConeColor.RED) }
                )

                ConeTile(
                    cone = ConeColor.YELLOW,
                    isSelected = selectedCone == ConeColor.YELLOW,
                    accentColor = TacticalColors.GoldAlert,
                    pointsText = stringResource(R.string.pts_plus_12),
                    modifier = Modifier.weight(1f),
                    onClick = { onSelectCone(ConeColor.YELLOW) }
                )

                ConeTile(
                    cone = ConeColor.GREEN,
                    isSelected = selectedCone == ConeColor.GREEN,
                    accentColor = TacticalColors.NeonGreen,
                    pointsText = stringResource(R.string.pts_plus_15),
                    modifier = Modifier.weight(1f),
                    onClick = { onSelectCone(ConeColor.GREEN) }
                )
            }
        }
    }
}

@Composable
private fun ConeTile(
    cone: ConeColor,
    isSelected: Boolean,
    accentColor: Color,
    pointsText: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(10.dp))
            .background(if (isSelected) TacticalColors.SurfaceHigh else TacticalColors.SurfaceLowest)
            .border(
                width = if (isSelected) 1.5.dp else 1.dp,
                color = if (isSelected) accentColor else TacticalColors.CardBorder,
                shape = RoundedCornerShape(10.dp)
            )
            .drawBehind {
                if (isSelected) {
                    drawRect(color = accentColor.copy(alpha = 0.08f))
                }
            }
            .clickable { onClick() }
            .padding(vertical = 12.dp, horizontal = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(accentColor.copy(alpha = 0.2f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "▲",
                    color = accentColor,
                    fontSize = 16.sp
                )
            }

            Text(
                text = cone.name.lowercase().replaceFirstChar { it.uppercase() },
                style = MaterialTheme.typography.bodyMedium,
                color = TacticalColors.TextPrimary,
                fontWeight = FontWeight.Medium
            )

            Text(
                text = pointsText,
                style = MaterialTheme.typography.labelSmall,
                color = accentColor,
                fontWeight = FontWeight.Bold
            )
        }

        if (isSelected) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(4.dp)
                    .size(16.dp)
                    .background(accentColor, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = null,
                    tint = TacticalColors.BackgroundDark,
                    modifier = Modifier.size(12.dp)
                )
            }
        }
    }
}

@Composable
private fun Step3CardMatrix(
    rank: Int,
    suit: String,
    onRankSelected: (Int) -> Unit,
    onSuitSelected: (String) -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val laserAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.9f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200),
            repeatMode = RepeatMode.Reverse
        ),
        label = "laserPulse"
    )

    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .background(TacticalColors.NeonCyan.copy(alpha = 0.2f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "03",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.NeonCyan,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.step_player_card),
                        style = MaterialTheme.typography.labelMedium,
                        color = TacticalColors.TextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier
                        .background(TacticalColors.SurfaceHighest, RoundedCornerShape(12.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(TacticalColors.NeonGreen, CircleShape)
                    )
                    Text(
                        text = stringResource(R.string.nfc_active),
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.NeonCyan,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Holographic Card Viewfinder
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(TacticalColors.SurfaceLowest, RoundedCornerShape(10.dp))
                    .border(1.dp, TacticalColors.CardBorder, RoundedCornerShape(10.dp))
                    .padding(12.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // HUD status
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "✓ " + stringResource(R.string.verified_locked),
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.NeonGreen,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = stringResource(R.string.dynamic_card_cycle, 18),
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.GoldAlert
                        )
                    }

                    // Central Holographic Card
                    Box(
                        modifier = Modifier
                            .width(140.dp)
                            .height(190.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(TacticalColors.SurfaceHigh)
                            .border(1.5.dp, TacticalColors.NeonCyan.copy(alpha = laserAlpha), RoundedCornerShape(12.dp))
                            .drawBehind {
                                drawRect(
                                    brush = Brush.verticalGradient(
                                        colors = listOf(
                                            TacticalColors.NeonCyan.copy(alpha = 0.15f),
                                            Color.Transparent,
                                            TacticalColors.NeonCyan.copy(alpha = 0.08f)
                                        )
                                    )
                                )
                            }
                            .padding(10.dp)
                    ) {
                        val rankDisplay = when (rank) {
                            1 -> "A"
                            11 -> "J"
                            12 -> "Q"
                            13 -> "K"
                            else -> rank.toString()
                        }
                        val suitColor = if (suit == "♥" || suit == "♦") TacticalColors.NeonMagenta else TacticalColors.NeonCyan

                        // Top pip
                        Column(modifier = Modifier.align(Alignment.TopStart)) {
                            Text(
                                text = rankDisplay,
                                style = MaterialTheme.typography.titleLarge,
                                color = suitColor,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = suit,
                                fontSize = 16.sp,
                                color = suitColor
                            )
                        }

                        // Top label
                        Text(
                            text = "DYNAMIC",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.NeonCyan,
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .background(TacticalColors.SurfaceLowest, RoundedCornerShape(4.dp))
                                .padding(horizontal = 4.dp, vertical = 2.dp)
                        )

                        // Center Emblem
                        Column(
                            modifier = Modifier.align(Alignment.Center),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(54.dp)
                                    .background(TacticalColors.SurfaceLowest, CircleShape)
                                    .border(1.dp, TacticalColors.CardBorder, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = suit,
                                    fontSize = 28.sp,
                                    color = suitColor
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = stringResource(R.string.value_pts, rank),
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.NeonCyan,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        // Bottom pip inverted
                        Column(
                            modifier = Modifier.align(Alignment.BottomEnd),
                            horizontalAlignment = Alignment.End
                        ) {
                            Text(
                                text = suit,
                                fontSize = 14.sp,
                                color = suitColor
                            )
                            Text(
                                text = rankDisplay,
                                style = MaterialTheme.typography.titleMedium,
                                color = suitColor,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // Progress track
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .background(TacticalColors.SurfaceHigh, CircleShape)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(0.6f)
                                .height(4.dp)
                                .background(TacticalColors.NeonGreen, CircleShape)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Suit Selector Row
            val suits = listOf("♠", "♥", "♦", "♣")
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                suits.forEach { s ->
                    val isSelected = suit == s
                    val isRed = s == "♥" || s == "♦"
                    val accent = if (isRed) TacticalColors.NeonMagenta else TacticalColors.NeonCyan

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelected) TacticalColors.SurfaceHighest else TacticalColors.SurfaceLowest)
                            .border(
                                width = if (isSelected) 1.5.dp else 1.dp,
                                color = if (isSelected) accent else TacticalColors.CardBorder,
                                shape = RoundedCornerShape(6.dp)
                            )
                            .clickable { onSuitSelected(s) }
                            .padding(vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = s,
                            fontSize = 18.sp,
                            color = if (isSelected) accent else TacticalColors.TextSecondary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Rank Selector Grid (2 rows for easy touch targets)
            val ranksRow1 = listOf(1, 2, 3, 4, 5, 6, 7)
            val ranksRow2 = listOf(8, 9, 10, 11, 12, 13)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                ranksRow1.forEach { r ->
                    RankButton(
                        rank = r,
                        isSelected = rank == r,
                        modifier = Modifier.weight(1f),
                        onClick = { onRankSelected(r) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                ranksRow2.forEach { r ->
                    RankButton(
                        rank = r,
                        isSelected = rank == r,
                        modifier = Modifier.weight(1f),
                        onClick = { onRankSelected(r) }
                    )
                }
            }
        }
    }
}

@Composable
private fun RankButton(
    rank: Int,
    isSelected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val display = when (rank) {
        1 -> "A"
        11 -> "J"
        12 -> "Q"
        13 -> "K"
        else -> rank.toString()
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(6.dp))
            .background(if (isSelected) TacticalColors.NeonCyan else TacticalColors.SurfaceLowest)
            .border(
                width = 1.dp,
                color = if (isSelected) TacticalColors.NeonCyan else TacticalColors.CardBorder,
                shape = RoundedCornerShape(6.dp)
            )
            .clickable { onClick() }
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = display,
            style = MaterialTheme.typography.labelSmall,
            color = if (isSelected) TacticalColors.BackgroundDark else TacticalColors.TextPrimary,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun PointsAwardSummaryCard(
    cone: ConeColor,
    cardRank: Int,
    totalPoints: Int,
    teamName: String,
    zoneId: String
) {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(text = "🏆", fontSize = 16.sp)
                Text(
                    text = stringResource(R.string.points_to_award).uppercase(),
                    style = MaterialTheme.typography.labelMedium,
                    color = TacticalColors.GoldAlert,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.5.sp
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "${cone.points} + $cardRank =",
                    style = MaterialTheme.typography.headlineMedium,
                    color = TacticalColors.TextPrimary,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "$totalPoints",
                    style = MaterialTheme.typography.headlineLarge,
                    color = TacticalColors.NeonGreen,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "PTS",
                    style = MaterialTheme.typography.labelMedium,
                    color = TacticalColors.NeonGreen,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = stringResource(R.string.allocating_summary, totalPoints, cone.points, cardRank, teamName),
                style = MaterialTheme.typography.bodySmall,
                color = TacticalColors.TextSecondary,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun RecentCheckinLogsSection(
    submissions: List<Checkin>,
    onRetry: (Checkin) -> Unit,
    onDismiss: (Checkin) -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stringResource(R.string.recent_checkpoint_logs).uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = TacticalColors.TextSecondary,
                letterSpacing = 1.sp
            )
            Text(
                text = stringResource(R.string.live_feed).uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = TacticalColors.NeonCyan,
                fontWeight = FontWeight.Bold
            )
        }

        if (submissions.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(TacticalColors.SurfaceLowest, RoundedCornerShape(8.dp))
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = stringResource(R.string.no_recent_logs),
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalColors.TextSecondary,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            submissions.take(10).forEach { item ->
                RecentSubmissionRow(
                    checkin = item,
                    onRetry = { onRetry(item) },
                    onDismiss = { onDismiss(item) }
                )
            }
        }
    }
}

@Composable
private fun RecentSubmissionRow(
    checkin: Checkin,
    onRetry: () -> Unit,
    onDismiss: () -> Unit
) {
    val rankDisplay = when (checkin.cardRank) {
        1 -> "A"
        11 -> "J"
        12 -> "Q"
        13 -> "K"
        else -> checkin.cardRank.toString()
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(TacticalColors.SurfaceLowest)
            .border(1.dp, TacticalColors.CardBorder, RoundedCornerShape(8.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                // Status dot
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .background(
                            when (checkin.syncStatus) {
                                SyncStatus.SYNCED -> TacticalColors.NeonGreen
                                SyncStatus.PENDING -> TacticalColors.NeonCyan
                                SyncStatus.FAILED -> TacticalColors.RedGlow
                            },
                            CircleShape
                        )
                )

                Column {
                    Text(
                        text = checkin.teamId,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TacticalColors.TextPrimary,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = "${checkin.cone} Cone + ${rankDisplay}${checkin.cardSuit}",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "+${checkin.points} PTS",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TacticalColors.NeonGreen,
                    fontWeight = FontWeight.Bold
                )

                // Sync badge
                when (checkin.syncStatus) {
                    SyncStatus.SYNCED -> {
                        Text(
                            text = "SYNCED",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.NeonGreen,
                            fontSize = 9.sp
                        )
                    }
                    SyncStatus.PENDING -> {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(10.dp),
                                strokeWidth = 1.5.dp,
                                color = TacticalColors.NeonCyan
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "QUEUE",
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.NeonCyan,
                                fontSize = 9.sp
                            )
                        }
                    }
                    SyncStatus.FAILED -> {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = "FAILED",
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.RedGlow,
                                fontSize = 9.sp
                            )
                            Text(
                                text = "↺",
                                color = TacticalColors.NeonCyan,
                                modifier = Modifier.clickable { onRetry() }
                            )
                            Text(
                                text = "✕",
                                color = TacticalColors.TextSecondary,
                                modifier = Modifier.clickable { onDismiss() }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TeamPickerDialog(
    teams: List<Team>,
    selectedTeamId: String?,
    uiState: MemberCheckinUiState,
    onSelect: (Team) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = TacticalColors.BackgroundDark,
            border = androidx.compose.foundation.BorderStroke(1.dp, TacticalColors.CardBorder),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "SELECT ARRIVED SQUAD",
                    style = MaterialTheme.typography.titleMedium,
                    color = TacticalColors.TextPrimary,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(12.dp))

                if (teams.isEmpty()) {
                    Text(
                        text = "No registered teams found.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TacticalColors.TextSecondary
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(teams) { team ->
                            val elig = uiState.evaluateTeam(team)
                            val isSelected = team.id == selectedTeamId

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(
                                        if (isSelected) TacticalColors.SurfaceHighest
                                        else if (elig.isDueHere) TacticalColors.SurfaceHigh
                                        else TacticalColors.SurfaceLowest
                                    )
                                    .border(
                                        1.dp,
                                        if (elig.isDueHere) TacticalColors.NeonGreen else TacticalColors.CardBorder,
                                        RoundedCornerShape(8.dp)
                                    )
                                    .clickable { onSelect(team) }
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = team.name,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = TacticalColors.TextPrimary,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = "Score: ${team.score} pts",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TacticalColors.TextSecondary
                                    )
                                }

                                if (elig.alreadyCheckedIn) {
                                    Text(
                                        text = "✓ COMPLETED",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TacticalColors.TextSecondary
                                    )
                                } else if (elig.isFinished) {
                                    Text(
                                        text = "FINISHED",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TacticalColors.GoldAlert
                                    )
                                } else if (elig.isDueHere) {
                                    Text(
                                        text = "★ DUE HERE",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TacticalColors.NeonGreen,
                                        fontWeight = FontWeight.Bold
                                    )
                                } else {
                                    Text(
                                        text = "Target: ${elig.activeZoneTarget}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TacticalColors.TextSecondary
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))
                NeonButton(
                    text = "Close",
                    onClick = onDismiss,
                    variant = NeonButtonVariant.SECONDARY,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
private fun AlertBanner(
    title: String,
    message: String,
    color: Color
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.12f))
            .border(1.dp, color, RoundedCornerShape(8.dp))
            .padding(12.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(20.dp)
            )
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = color,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalColors.TextPrimary
                )
            }
        }
    }
}

@Composable
private fun MessageBanner(
    message: String,
    isError: Boolean,
    onDismiss: () -> Unit
) {
    val color = if (isError) TacticalColors.RedGlow else TacticalColors.NeonGreen
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.12f))
            .border(1.dp, color, RoundedCornerShape(8.dp))
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = message,
                style = MaterialTheme.typography.bodySmall,
                color = color,
                modifier = Modifier.weight(1f)
            )
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "Dismiss",
                tint = color,
                modifier = Modifier
                    .size(16.dp)
                    .clickable { onDismiss() }
            )
        }
    }
}
