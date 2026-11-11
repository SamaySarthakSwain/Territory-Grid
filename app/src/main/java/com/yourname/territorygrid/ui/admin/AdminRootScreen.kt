package com.yourname.territorygrid.ui.admin

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.MilitaryTech
import androidx.compose.material.icons.filled.PauseCircle
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.RestartAlt
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Shuffle
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.Undo
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.yourname.territorygrid.R
import com.yourname.territorygrid.domain.model.Checkin
import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.GameStatus
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.domain.model.Team
import com.yourname.territorygrid.domain.model.UserProfile
import com.yourname.territorygrid.ui.components.BottomNavBar
import com.yourname.territorygrid.ui.components.BottomNavItem
import com.yourname.territorygrid.ui.components.ConfirmDialog
import com.yourname.territorygrid.ui.components.GlassCard
import com.yourname.territorygrid.ui.components.HexGridBackground
import com.yourname.territorygrid.ui.components.NeonButton
import com.yourname.territorygrid.ui.components.NeonButtonVariant
import com.yourname.territorygrid.ui.components.NeonTextField
import com.yourname.territorygrid.ui.components.ScanlineDivider
import com.yourname.territorygrid.ui.components.TopHudBar
import com.yourname.territorygrid.ui.theme.TacticalColors

@Composable
fun AdminRootScreen(
    user: UserProfile,
    onSignOut: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: AdminViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.startMissionClock()
    }

    val adminTabs = remember {
        listOf(
            BottomNavItem("control", "Control", Icons.Default.Tune),
            BottomNavItem("teams", "Teams", Icons.Default.Groups),
            BottomNavItem("people", "People", Icons.Default.Badge),
            BottomNavItem("clues", "Clues", Icons.Default.Explore),
            BottomNavItem("live", "Live", Icons.Default.EmojiEvents)
        )
    }

    Box(modifier = modifier.fillMaxSize()) {
        HexGridBackground(modifier = Modifier.fillMaxSize())

        Column(modifier = Modifier.fillMaxSize()) {
            // Top HUD Bar
            TopHudBar(
                title = stringResource(R.string.admin_control_panel),
                subtitle = "Master Telemetry",
                roleLabel = "ADMIN",
                onProfileClick = onSignOut
            )

            // Info or Error Banners
            AnimatedVisibility(visible = state.errorMessage != null) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(TacticalColors.ErrorContainer.copy(alpha = 0.85f))
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = TacticalColors.Error)
                        Text(
                            text = state.errorMessage.orEmpty(),
                            style = MaterialTheme.typography.bodySmall,
                            color = TacticalColors.TextPrimary
                        )
                    }
                    IconButton(onClick = { viewModel.dismissMessage() }) {
                        Icon(Icons.Default.Close, contentDescription = null, tint = TacticalColors.TextPrimary)
                    }
                }
            }

            AnimatedVisibility(visible = state.infoMessage != null) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(TacticalColors.PrimaryContainer.copy(alpha = 0.2f))
                        .border(1.dp, TacticalColors.PrimaryContainer.copy(alpha = 0.5f))
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = TacticalColors.PrimaryContainer)
                        Text(
                            text = state.infoMessage.orEmpty(),
                            style = MaterialTheme.typography.bodySmall,
                            color = TacticalColors.PrimaryContainer
                        )
                    }
                    IconButton(onClick = { viewModel.dismissMessage() }) {
                        Icon(Icons.Default.Close, contentDescription = null, tint = TacticalColors.PrimaryContainer)
                    }
                }
            }

            // Tab Content Body
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                when (state.currentTab) {
                    AdminTab.CONTROL -> ControlTabContent(state = state, viewModel = viewModel)
                    AdminTab.TEAMS -> TeamsTabContent(state = state, viewModel = viewModel)
                    AdminTab.PEOPLE -> PeopleTabContent(state = state, viewModel = viewModel)
                    AdminTab.CLUES -> CluesTabContent(state = state, viewModel = viewModel)
                    AdminTab.LIVE -> LiveTabContent(state = state, viewModel = viewModel)
                }
            }

            // Bottom Navigation Bar
            BottomNavBar(
                items = adminTabs,
                currentRoute = state.currentTab.name.lowercase(),
                onItemClick = { item ->
                    when (item.route) {
                        "control" -> viewModel.selectTab(AdminTab.CONTROL)
                        "teams" -> viewModel.selectTab(AdminTab.TEAMS)
                        "people" -> viewModel.selectTab(AdminTab.PEOPLE)
                        "clues" -> viewModel.selectTab(AdminTab.CLUES)
                        "live" -> viewModel.selectTab(AdminTab.LIVE)
                    }
                }
            )
        }

        // --- Dialogs ---
        if (state.showResetDialog) {
            ResetGridConfirmDialog(
                inputText = state.resetInputText,
                onInputChanged = viewModel::onResetInputChanged,
                onConfirm = viewModel::executeResetGrid,
                onDismiss = { viewModel.showResetDialog(false) }
            )
        }

        if (state.showClueOrderPreviewDialog) {
            ClueOrderPreviewDialog(
                previewMap = state.generatedClueOrdersPreview,
                onConfirm = viewModel::commitClueOrderGeneration,
                onDismiss = viewModel::dismissClueOrderPreview
            )
        }

        if (state.showAddTeamDialog) {
            AddTeamDialog(
                name = state.newTeamName,
                onNameChanged = viewModel::onTeamNameChanged,
                onConfirm = viewModel::saveNewTeam,
                onDismiss = { viewModel.openAddTeamDialog(false) }
            )
        }

        if (state.teamToDelete != null) {
            ConfirmDialog(
                title = "Delete Team '${state.teamToDelete?.name}'?",
                message = "This removes the squad and all its registered points.",
                onConfirm = viewModel::executeDeleteTeam,
                onDismiss = { viewModel.confirmDeleteTeam(null) }
            )
        }

        if (state.showAddUserDialog) {
            AddUserDialog(
                state = state,
                viewModel = viewModel,
                onDismiss = { viewModel.openAddUserDialog(false) }
            )
        }

        if (state.userToDelete != null) {
            ConfirmDialog(
                title = "Remove User '${state.userToDelete?.name}'?",
                message = "Deletes database profile. Note: Credentials must be deleted in Firebase Console.",
                onConfirm = viewModel::executeDeleteUser,
                onDismiss = { viewModel.confirmDeleteUser(null) }
            )
        }

        if (state.showAddClueDialog) {
            AddClueDialog(
                state = state,
                viewModel = viewModel,
                onDismiss = { viewModel.openAddClueDialog(false) }
            )
        }

        if (state.clueToDelete != null) {
            ConfirmDialog(
                title = "Delete Clue for '${state.clueToDelete?.zoneId}'?",
                message = "This will remove the clue from future generation pools.",
                onConfirm = viewModel::executeDeleteClue,
                onDismiss = { viewModel.confirmDeleteClue(null) }
            )
        }

        if (state.checkinToUndo != null) {
            val checkin = state.checkinToUndo!!
            ConfirmDialog(
                title = "Undo Check-in for ${checkin.teamId}?",
                message = "Deduct ${checkin.points} PTS (${checkin.cone} + Rank ${checkin.cardRank}) at ${checkin.zoneId} and remove card.",
                onConfirm = viewModel::executeUndoCheckin,
                onDismiss = { viewModel.confirmUndoCheckin(null) }
            )
        }
    }
}

// ==========================================
// 1. CONTROL TAB
// ==========================================
@Composable
private fun ControlTabContent(
    state: AdminUiState,
    viewModel: AdminViewModel
) {
    val scrollState = rememberScrollState()

    val pulseTransition = rememberInfiniteTransition(label = "LiveBeaconPulse")
    val beaconAlpha by pulseTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "BeaconPulse"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Master Tactical Timer Card
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Status Pill
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(TacticalColors.SurfaceLowest)
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    val statusColor = when (state.gameState.status) {
                        GameStatus.PLAYER_PHASE -> TacticalColors.ConeGreen
                        GameStatus.PAUSED -> TacticalColors.ConeYellow
                        GameStatus.ENDED -> TacticalColors.Error
                        GameStatus.MEMBER_PHASE -> TacticalColors.PrimaryContainer
                        GameStatus.LOBBY -> TacticalColors.TextSecondary
                    }
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .background(
                                color = statusColor.copy(
                                    alpha = if (state.gameState.status == GameStatus.PLAYER_PHASE) beaconAlpha else 1f
                                ),
                                shape = CircleShape
                            )
                    )
                    Text(
                        text = "STATUS: ${state.gameState.status.name}",
                        style = MaterialTheme.typography.labelSmall,
                        color = statusColor,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Timer,
                        contentDescription = null,
                        tint = TacticalColors.PrimaryContainer,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = stringResource(R.string.mission_elapsed_time),
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary,
                        letterSpacing = 1.sp
                    )
                }

                // Digital Clock
                Text(
                    text = state.formattedElapsedTime,
                    style = MaterialTheme.typography.headlineLarge,
                    color = TacticalColors.PrimaryContainer,
                    fontWeight = FontWeight.Bold,
                    fontSize = 38.sp,
                    letterSpacing = 2.sp,
                    modifier = Modifier
                        .padding(vertical = 4.dp)
                        .drawBehind {
                            drawCircle(
                                brush = Brush.radialGradient(
                                    colors = listOf(
                                        TacticalColors.PrimaryContainer.copy(alpha = 0.25f),
                                        Color.Transparent
                                    )
                                ),
                                radius = size.width * 0.7f
                            )
                        }
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Pause / Reset Action Grid
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (state.gameState.status == GameStatus.PAUSED) {
                        NeonButton(
                            text = stringResource(R.string.resume_ops),
                            onClick = viewModel::resumeGame,
                            variant = NeonButtonVariant.PRIMARY,
                            leadingIcon = { Icon(Icons.Default.PlayCircle, contentDescription = null) },
                            modifier = Modifier.weight(1f)
                        )
                    } else {
                        NeonButton(
                            text = stringResource(R.string.pause_ops),
                            onClick = viewModel::pauseGame,
                            variant = NeonButtonVariant.SECONDARY,
                            enabled = state.gameState.status == GameStatus.PLAYER_PHASE,
                            leadingIcon = { Icon(Icons.Default.PauseCircle, contentDescription = null) },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    NeonButton(
                        text = stringResource(R.string.reset_grid),
                        onClick = { viewModel.showResetDialog(true) },
                        variant = NeonButtonVariant.DANGER,
                        leadingIcon = { Icon(Icons.Default.RestartAlt, contentDescription = null) },
                        modifier = Modifier.weight(1f)
                    )
                }

                // Global Reshuffle Banner
                Spacer(modifier = Modifier.height(14.dp))
                ScanlineDivider()
                Spacer(modifier = Modifier.height(14.dp))

                NeonButton(
                    text = stringResource(R.string.force_global_reshuffle),
                    onClick = viewModel::previewClueOrderGeneration,
                    variant = NeonButtonVariant.SECONDARY,
                    leadingIcon = { Icon(Icons.Default.Shuffle, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        // 3 Stat Pods
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            StatPod(
                title = stringResource(R.string.teams_registered),
                value = "${state.teams.size}",
                valueColor = TacticalColors.TextPrimary,
                icon = Icons.Default.Groups,
                modifier = Modifier.weight(1f)
            )
            StatPod(
                title = stringResource(R.string.total_points),
                value = "${state.totalPoints}",
                valueColor = TacticalColors.Tertiary,
                icon = Icons.Default.Bolt,
                modifier = Modifier.weight(1f)
            )
            StatPod(
                title = stringResource(R.string.active_zones),
                value = "${state.activeZonesCount}",
                valueColor = TacticalColors.Secondary,
                icon = Icons.Default.Explore,
                modifier = Modifier.weight(1f)
            )
        }

        // Advance Phase Broadcast Action
        if (state.gameState.status == GameStatus.LOBBY || state.gameState.status == GameStatus.MEMBER_PHASE) {
            NeonButton(
                text = if (state.gameState.status == GameStatus.LOBBY) "ADVANCE TO MARSHAL PHASE" else "LAUNCH LIVE HUNT (PLAYER PHASE)",
                onClick = viewModel::advanceGamePhase,
                variant = NeonButtonVariant.PRIMARY,
                leadingIcon = { Icon(Icons.Default.ArrowForward, contentDescription = null) },
                modifier = Modifier.fillMaxWidth()
            )
        } else if (state.gameState.status == GameStatus.PLAYER_PHASE) {
            NeonButton(
                text = "END MISSION & FREEZE LEADERBOARD",
                onClick = viewModel::endGame,
                variant = NeonButtonVariant.DANGER,
                leadingIcon = { Icon(Icons.Default.Close, contentDescription = null) },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

// ==========================================
// 2. TEAMS TAB
// ==========================================
@Composable
private fun TeamsTabContent(
    state: AdminUiState,
    viewModel: AdminViewModel
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "SQUAD REGISTRY (${state.teams.size})",
                style = MaterialTheme.typography.labelMedium,
                color = TacticalColors.TextPrimary,
                fontWeight = FontWeight.Bold
            )

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                NeonButton(
                    text = "Add Team",
                    onClick = { viewModel.openAddTeamDialog(true) },
                    variant = NeonButtonVariant.PRIMARY,
                    leadingIcon = { Icon(Icons.Default.Add, contentDescription = null) }
                )
            }
        }

        if (state.teams.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No squads registered yet.\nTap 'Add Team' to register competitors.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalColors.TextSecondary,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                items(state.teams, key = { it.id }) { team ->
                    GlassCard(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = team.name,
                                        style = MaterialTheme.typography.labelMedium,
                                        color = TacticalColors.TextPrimary,
                                        fontWeight = FontWeight.Bold
                                    )
                                    // Approval badge
                                    if (team.isApproved) {
                                        Text(
                                            text = "✓ APPROVED",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = TacticalColors.TacticalGreen,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier
                                                .background(
                                                    TacticalColors.TacticalGreen.copy(alpha = 0.15f),
                                                    RoundedCornerShape(4.dp)
                                                )
                                                .padding(horizontal = 4.dp, vertical = 2.dp)
                                        )
                                    } else {
                                        Text(
                                            text = "⏳ PENDING",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = TacticalColors.WarningAmber,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier
                                                .background(
                                                    TacticalColors.WarningAmber.copy(alpha = 0.15f),
                                                    RoundedCornerShape(4.dp)
                                                )
                                                .padding(horizontal = 4.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Score: ${team.score} PTS • Cards: ${team.cards.size} • Progress: Step ${team.currentClueIndex}/${team.clueOrder.size}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TacticalColors.TextSecondary,
                                    fontSize = 11.sp
                                )
                                if (team.clueOrder.isNotEmpty()) {
                                    Text(
                                        text = "Route: ${team.clueOrder.joinToString(" → ")}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TacticalColors.PrimaryFixed,
                                        fontSize = 9.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }

                            // Action buttons column
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                // Approve button — only show if not yet approved
                                if (!team.isApproved) {
                                    NeonButton(
                                        text = "APPROVE",
                                        onClick = { viewModel.approveTeam(team.id) },
                                        variant = NeonButtonVariant.SUCCESS,
                                        modifier = Modifier.height(32.dp)
                                    )
                                }
                                IconButton(onClick = { viewModel.confirmDeleteTeam(team) }) {
                                    Icon(
                                        imageVector = Icons.Default.Delete,
                                        contentDescription = "Delete squad",
                                        tint = TacticalColors.Error
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// 3. PEOPLE TAB
// ==========================================
@Composable
private fun PeopleTabContent(
    state: AdminUiState,
    viewModel: AdminViewModel
) {
    var roleFilter by remember { mutableStateOf<Role?>(null) }
    val clipboardManager = LocalClipboardManager.current

    val filteredUsers = remember(state.users, roleFilter) {
        if (roleFilter == null) state.users else state.users.filter { it.role == roleFilter }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "PERSONNEL CLEARANCE (${filteredUsers.size})",
                style = MaterialTheme.typography.labelMedium,
                color = TacticalColors.TextPrimary,
                fontWeight = FontWeight.Bold
            )

            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                NeonButton(
                    text = "+ Marshal",
                    onClick = { viewModel.openAddUserDialog(true, Role.MEMBER) },
                    variant = NeonButtonVariant.SUCCESS
                )
                NeonButton(
                    text = "+ Player",
                    onClick = { viewModel.openAddUserDialog(true, Role.PLAYER) },
                    variant = NeonButtonVariant.PRIMARY
                )
            }
        }

        // Filter chips
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            FilterRoleChip("ALL", roleFilter == null) { roleFilter = null }
            FilterRoleChip("MARSHALS", roleFilter == Role.MEMBER) { roleFilter = Role.MEMBER }
            FilterRoleChip("PLAYERS", roleFilter == Role.PLAYER) { roleFilter = Role.PLAYER }
            FilterRoleChip("ADMINS", roleFilter == Role.ADMIN) { roleFilter = Role.ADMIN }
        }

        if (filteredUsers.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No operatives found under selected filter.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalColors.TextSecondary
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                items(filteredUsers, key = { it.uid }) { user ->
                    GlassCard(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    val roleColor = when (user.role) {
                                        Role.ADMIN -> TacticalColors.SecondaryContainer
                                        Role.MEMBER -> TacticalColors.ConeGreen
                                        Role.PLAYER -> TacticalColors.PrimaryContainer
                                    }
                                    Box(
                                        modifier = Modifier
                                            .background(roleColor.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = user.role.name,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = roleColor,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }

                                    Text(
                                        text = user.name.ifBlank { user.email },
                                        style = MaterialTheme.typography.labelMedium,
                                        color = TacticalColors.TextPrimary,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = user.email,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TacticalColors.TextSecondary,
                                    fontSize = 11.sp
                                )

                                val detail = when (user.role) {
                                    Role.MEMBER -> "Station: ${user.zoneId ?: "UNASSIGNED"}"
                                    Role.PLAYER -> "Squad: ${state.teams.find { it.id == user.teamId }?.name ?: user.teamId ?: "NO SQUAD"}"
                                    Role.ADMIN -> "Master Command Clearance"
                                }
                                Text(
                                    text = detail,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TacticalColors.PrimaryFixed,
                                    fontSize = 10.sp
                                )
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(onClick = {
                                    clipboardManager.setText(AnnotatedString(user.email))
                                }) {
                                    Icon(
                                        imageVector = Icons.Default.ContentCopy,
                                        contentDescription = "Copy Comms ID",
                                        tint = TacticalColors.PrimaryContainer,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }

                                IconButton(onClick = { viewModel.confirmDeleteUser(user) }) {
                                    Icon(
                                        imageVector = Icons.Default.Delete,
                                        contentDescription = "Remove User",
                                        tint = TacticalColors.Error,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// 4. CLUES TAB
// ==========================================
@Composable
private fun CluesTabContent(
    state: AdminUiState,
    viewModel: AdminViewModel
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "CLUE INVENTORY (${state.clues.size})",
                style = MaterialTheme.typography.labelMedium,
                color = TacticalColors.TextPrimary,
                fontWeight = FontWeight.Bold
            )

            NeonButton(
                text = "Add Clue",
                onClick = { viewModel.openAddClueDialog(true) },
                variant = NeonButtonVariant.PRIMARY,
                leadingIcon = { Icon(Icons.Default.Add, contentDescription = null) }
            )
        }

        // Duplicate-zone Warnings
        if (state.duplicateZoneWarnings.isNotEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                state.duplicateZoneWarnings.forEach { warning ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(TacticalColors.WarningAmber.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                            .border(1.dp, TacticalColors.WarningAmber, RoundedCornerShape(4.dp))
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = TacticalColors.WarningAmber, modifier = Modifier.size(16.dp))
                        Text(text = warning, style = MaterialTheme.typography.labelSmall, color = TacticalColors.WarningAmber)
                    }
                }
            }
        }

        if (state.clues.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No mission clues configured.\nTap 'Add Clue' to register scavenger checkpoints.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalColors.TextSecondary,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                items(state.clues, key = { it.id }) { clue ->
                    GlassCard(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .background(TacticalColors.PrimaryContainer.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = clue.zoneId,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = TacticalColors.PrimaryContainer,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 10.sp
                                        )
                                    }
                                    if (clue.zoneLabel.isNotBlank()) {
                                        Text(
                                            text = clue.zoneLabel,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = TacticalColors.TextSecondary,
                                            fontSize = 10.sp
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = clue.text,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TacticalColors.TextPrimary
                                )
                            }

                            IconButton(onClick = { viewModel.confirmDeleteClue(clue) }) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Delete clue",
                                    tint = TacticalColors.Error
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// 5. LIVE TAB (LEADERBOARD & CHECKINS)
// ==========================================
@Composable
private fun LiveTabContent(
    state: AdminUiState,
    viewModel: AdminViewModel
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Live Leaderboard Section
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Default.MilitaryTech, contentDescription = null, tint = TacticalColors.PrimaryContainer)
                        Text(
                            text = stringResource(R.string.live_grid_standings),
                            style = MaterialTheme.typography.labelMedium,
                            color = TacticalColors.TextPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Text(
                        text = "LIVE TELEMETRY",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.ConeGreen,
                        fontWeight = FontWeight.Bold,
                        fontSize = 9.sp
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (state.teams.isEmpty()) {
                    Text(
                        text = "No squads currently scored.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TacticalColors.TextSecondary
                    )
                } else {
                    val maxScore = (state.teams.maxOfOrNull { it.score } ?: 1).coerceAtLeast(1)
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        state.teams.forEachIndexed { index, team ->
                            val rank = index + 1
                            val rankColor = when (rank) {
                                1 -> TacticalColors.ConeYellow
                                2 -> TacticalColors.OnSurface
                                3 -> TacticalColors.SecondaryContainer
                                else -> TacticalColors.SurfaceContainerHighest
                            }

                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(TacticalColors.SurfaceLowest, RoundedCornerShape(6.dp))
                                    .padding(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(22.dp)
                                                .background(rankColor, CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = "$rank",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = TacticalColors.Background,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 11.sp
                                            )
                                        }
                                        Text(
                                            text = team.name,
                                            style = MaterialTheme.typography.labelMedium,
                                            color = TacticalColors.TextPrimary,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }

                                    Text(
                                        text = "${team.score} PTS",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = TacticalColors.PrimaryContainer,
                                        fontWeight = FontWeight.Bold
                                    )
                                }

                                // Score progress bar
                                Spacer(modifier = Modifier.height(6.dp))
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(4.dp)
                                        .background(TacticalColors.SurfaceHighest, RoundedCornerShape(2.dp))
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth((team.score.toFloat() / maxScore).coerceIn(0.05f, 1f))
                                            .height(4.dp)
                                            .background(
                                                brush = Brush.horizontalGradient(
                                                    listOf(TacticalColors.PrimaryContainer, TacticalColors.ConeGreen)
                                                ),
                                                shape = RoundedCornerShape(2.dp)
                                            )
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    val context = LocalContext.current
                    NeonButton(
                        text = "SHARE STANDINGS REPORT",
                        onClick = {
                            val report = viewModel.exportLeaderboardText()
                            val sendIntent = android.content.Intent().apply {
                                action = android.content.Intent.ACTION_SEND
                                putExtra(android.content.Intent.EXTRA_TEXT, report)
                                type = "text/plain"
                            }
                            context.startActivity(
                                android.content.Intent.createChooser(sendIntent, "Share Mission Standings")
                            )
                        },
                        variant = NeonButtonVariant.PRIMARY,
                        leadingIcon = { Icon(Icons.Default.Share, contentDescription = null) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        // Check-ins History Feed with Undo
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "CHECK-IN TRANSMISSIONS (${state.checkins.size})",
                    style = MaterialTheme.typography.labelMedium,
                    color = TacticalColors.TextPrimary,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(8.dp))

                if (state.checkins.isEmpty()) {
                    Text(
                        text = "No field check-ins submitted yet.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TacticalColors.TextSecondary
                    )
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        state.checkins.forEach { checkin ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(TacticalColors.SurfaceLowest, RoundedCornerShape(6.dp))
                                    .padding(8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "${checkin.teamId} @ ${checkin.zoneId}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TacticalColors.TextPrimary,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "${checkin.cone} Cone + Rank ${checkin.cardRank}${checkin.cardSuit} = +${checkin.points} PTS",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TacticalColors.ConeGreen,
                                        fontSize = 11.sp
                                    )
                                }

                                NeonButton(
                                    text = "Undo",
                                    onClick = { viewModel.confirmUndoCheckin(checkin) },
                                    variant = NeonButtonVariant.DANGER,
                                    leadingIcon = { Icon(Icons.Default.Undo, contentDescription = null, modifier = Modifier.size(14.dp)) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// HELPER COMPONENTS & DIALOGS
// ==========================================
@Composable
private fun StatPod(
    title: String,
    value: String,
    valueColor: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(TacticalColors.SurfaceContainerLow.copy(alpha = 0.8f))
            .border(1.dp, TacticalColors.BorderSubtle, RoundedCornerShape(8.dp))
            .padding(10.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = valueColor, modifier = Modifier.size(18.dp))
            Text(text = value, style = MaterialTheme.typography.headlineSmall, color = valueColor, fontWeight = FontWeight.Bold)
            Text(text = title, style = MaterialTheme.typography.labelSmall, color = TacticalColors.TextSecondary, fontSize = 9.sp, textAlign = TextAlign.Center)
        }
    }
}

@Composable
private fun FilterRoleChip(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(4.dp))
            .background(if (isSelected) TacticalColors.PrimaryContainer else TacticalColors.SurfaceContainerHigh)
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = if (isSelected) TacticalColors.Background else TacticalColors.TextSecondary,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
            fontSize = 10.sp
        )
    }
}

@Composable
private fun ResetGridConfirmDialog(
    inputText: String,
    onInputChanged: (String) -> Unit,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Default.Warning, contentDescription = null, tint = TacticalColors.Error)
                Text(
                    text = stringResource(R.string.authorize_grid_reset),
                    style = MaterialTheme.typography.headlineSmall,
                    color = TacticalColors.Error
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = stringResource(R.string.reset_warning_message),
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalColors.TextSecondary
                )
                NeonTextField(
                    value = inputText,
                    onValueChange = onInputChanged,
                    label = "CONFIRMATION PHRASE",
                    hint = "Type RESET here"
                )
            }
        },
        confirmButton = {
            NeonButton(
                text = stringResource(R.string.purge_grid),
                onClick = onConfirm,
                variant = NeonButtonVariant.DANGER,
                enabled = inputText.trim() == "RESET"
            )
        },
        dismissButton = {
            NeonButton(
                text = stringResource(R.string.cancel),
                onClick = onDismiss,
                variant = NeonButtonVariant.SECONDARY
            )
        },
        containerColor = TacticalColors.Surface,
        shape = RoundedCornerShape(8.dp)
    )
}

@Composable
private fun ClueOrderPreviewDialog(
    previewMap: Map<String, List<String>>,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "CLUE ROTATION PREVIEW",
                style = MaterialTheme.typography.headlineSmall,
                color = TacticalColors.PrimaryContainer
            )
        },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Teams start at different rotating checkpoints to prevent collisions:",
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalColors.TextSecondary
                )
                previewMap.forEach { (team, order) ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(TacticalColors.SurfaceLowest, RoundedCornerShape(4.dp))
                            .padding(8.dp)
                    ) {
                        Text(text = team, style = MaterialTheme.typography.labelSmall, color = TacticalColors.PrimaryContainer, fontWeight = FontWeight.Bold)
                        Text(text = order.joinToString(" → "), style = MaterialTheme.typography.bodySmall, color = TacticalColors.TextSecondary, fontSize = 10.sp)
                    }
                }
            }
        },
        confirmButton = {
            NeonButton(
                text = "SAVE CLUE ORDERS",
                onClick = onConfirm,
                variant = NeonButtonVariant.PRIMARY
            )
        },
        dismissButton = {
            NeonButton(
                text = "CANCEL",
                onClick = onDismiss,
                variant = NeonButtonVariant.SECONDARY
            )
        },
        containerColor = TacticalColors.Surface,
        shape = RoundedCornerShape(8.dp)
    )
}

@Composable
private fun AddTeamDialog(
    name: String,
    onNameChanged: (String) -> Unit,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "REGISTER SQUAD",
                style = MaterialTheme.typography.headlineSmall,
                color = TacticalColors.PrimaryContainer
            )
        },
        text = {
            NeonTextField(
                value = name,
                onValueChange = onNameChanged,
                label = "SQUAD NAME",
                hint = "e.g. Delta Recon"
            )
        },
        confirmButton = {
            NeonButton(
                text = "CREATE TEAM",
                onClick = onConfirm,
                variant = NeonButtonVariant.PRIMARY,
                enabled = name.isNotBlank()
            )
        },
        dismissButton = {
            NeonButton(
                text = "CANCEL",
                onClick = onDismiss,
                variant = NeonButtonVariant.SECONDARY
            )
        },
        containerColor = TacticalColors.Surface,
        shape = RoundedCornerShape(8.dp)
    )
}

@Composable
private fun AddUserDialog(
    state: AdminUiState,
    viewModel: AdminViewModel,
    onDismiss: () -> Unit
) {
    val clipboardManager = LocalClipboardManager.current

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "PROVISION OPERATIVE",
                style = MaterialTheme.typography.headlineSmall,
                color = TacticalColors.PrimaryContainer
            )
        },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Role Selector
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    FilterRoleChip("MARSHAL", state.newUserRole == Role.MEMBER) {
                        viewModel.onNewUserRoleChanged(Role.MEMBER)
                    }
                    FilterRoleChip("PLAYER", state.newUserRole == Role.PLAYER) {
                        viewModel.onNewUserRoleChanged(Role.PLAYER)
                    }
                }

                NeonTextField(
                    value = state.newUserName,
                    onValueChange = viewModel::onNewUserNameChanged,
                    label = "CALLSIGN / NAME",
                    hint = "e.g. Field Marshal Jack"
                )

                NeonTextField(
                    value = state.newUserEmail,
                    onValueChange = viewModel::onNewUserEmailChanged,
                    label = "EMAIL / COMMS ID",
                    hint = "e.g. marshal1@recon.grid"
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        NeonTextField(
                            value = state.newUserPass,
                            onValueChange = viewModel::onNewUserPassChanged,
                            label = "ACCESS KEY",
                            hint = "Generated password"
                        )
                    }
                    IconButton(onClick = viewModel::generateNewPassword) {
                        Icon(Icons.Default.Refresh, contentDescription = "Generate Key", tint = TacticalColors.PrimaryContainer)
                    }
                    IconButton(onClick = {
                        clipboardManager.setText(
                            AnnotatedString("Email: ${state.newUserEmail}\nAccess Key: ${state.newUserPass}")
                        )
                    }) {
                        Icon(Icons.Default.ContentCopy, contentDescription = "Copy Credentials", tint = TacticalColors.ConeGreen)
                    }
                }

                if (state.newUserRole == Role.MEMBER) {
                    NeonTextField(
                        value = state.newUserZoneId,
                        onValueChange = viewModel::onNewUserZoneChanged,
                        label = "ASSIGNED CHECKPOINT ZONE",
                        hint = "e.g. ZONE_01"
                    )
                } else if (state.newUserRole == Role.PLAYER) {
                    NeonTextField(
                        value = state.newUserTeamId,
                        onValueChange = viewModel::onNewUserTeamChanged,
                        label = "ASSIGNED SQUAD ID",
                        hint = "e.g. ${state.teams.firstOrNull()?.id ?: "teamId"}"
                    )
                }
            }
        },
        confirmButton = {
            NeonButton(
                text = "PROVISION USER",
                onClick = viewModel::saveNewUser,
                variant = NeonButtonVariant.PRIMARY,
                isLoading = state.isLoading
            )
        },
        dismissButton = {
            NeonButton(
                text = "CANCEL",
                onClick = onDismiss,
                variant = NeonButtonVariant.SECONDARY
            )
        },
        containerColor = TacticalColors.Surface,
        shape = RoundedCornerShape(8.dp)
    )
}

@Composable
private fun AddClueDialog(
    state: AdminUiState,
    viewModel: AdminViewModel,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "ADD MISSION DIRECTIVE",
                style = MaterialTheme.typography.headlineSmall,
                color = TacticalColors.PrimaryContainer
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                NeonTextField(
                    value = state.newClueZoneId,
                    onValueChange = viewModel::onNewClueZoneIdChanged,
                    label = "ZONE ID",
                    hint = "e.g. ZONE_01"
                )

                NeonTextField(
                    value = state.newClueZoneLabel,
                    onValueChange = viewModel::onNewClueZoneLabelChanged,
                    label = "ZONE CODENAME / LABEL",
                    hint = "e.g. Ancient Bell Tower"
                )

                NeonTextField(
                    value = state.newClueText,
                    onValueChange = viewModel::onNewClueTextChanged,
                    label = "CLUE DIRECTIVE TEXT",
                    hint = "Search beneath the eastern archway..."
                )
            }
        },
        confirmButton = {
            NeonButton(
                text = "SAVE CLUE",
                onClick = viewModel::saveNewClue,
                variant = NeonButtonVariant.PRIMARY
            )
        },
        dismissButton = {
            NeonButton(
                text = "CANCEL",
                onClick = onDismiss,
                variant = NeonButtonVariant.SECONDARY
            )
        },
        containerColor = TacticalColors.Surface,
        shape = RoundedCornerShape(8.dp)
    )
}
