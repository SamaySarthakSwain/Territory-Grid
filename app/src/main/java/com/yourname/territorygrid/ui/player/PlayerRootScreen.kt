package com.yourname.territorygrid.ui.player

import android.view.HapticFeedbackConstants
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material.icons.filled.Radar
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.yourname.territorygrid.R
import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.PlayingCard
import com.yourname.territorygrid.domain.model.Team
import com.yourname.territorygrid.domain.model.UserProfile
import com.yourname.territorygrid.ui.components.BottomNavBar
import com.yourname.territorygrid.ui.components.BottomNavItem
import com.yourname.territorygrid.ui.components.GlassCard
import com.yourname.territorygrid.ui.components.GlowingScoreRing
import com.yourname.territorygrid.ui.components.HexGridBackground
import com.yourname.territorygrid.ui.components.NeonButton
import com.yourname.territorygrid.ui.components.NeonButtonVariant
import com.yourname.territorygrid.ui.components.PlayingCardTile
import com.yourname.territorygrid.ui.components.TopHudBar
import com.yourname.territorygrid.ui.theme.TacticalColors

private val PlayerBottomNavItems = listOf(
    BottomNavItem("hunt", "Hunt", Icons.Default.Radar),
    BottomNavItem("cards", "Cards", Icons.Default.Style),
    BottomNavItem("rank", "Rank", Icons.Default.EmojiEvents)
)

@Composable
fun PlayerRootScreen(
    user: UserProfile,
    onSignOut: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: PlayerViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val view = LocalView.current

    // Trigger tactical haptics on score increase
    LaunchedEffect(uiState.recentPointsDelta, uiState.showPointsDeltaBanner) {
        if (uiState.showPointsDeltaBanner && uiState.recentPointsDelta != null) {
            view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        HexGridBackground(modifier = Modifier.fillMaxSize())

        Column(modifier = Modifier.fillMaxSize()) {
            TopHudBar(
                title = stringResource(R.string.player_dashboard),
                subtitle = "Active Directives",
                roleLabel = "PLAYER",
                onProfileClick = onSignOut
            )

            // Sub-Header: Team Status & Live Standing
            PlayerSubHeader(
                teamName = uiState.team?.name ?: "Unassigned Squad",
                currentClueNumber = uiState.currentClueNumber,
                totalClues = uiState.totalCluesCount,
                userRank = uiState.userRank,
                totalTeams = uiState.totalTeamsCount
            )

            // Main Content Area based on Tab
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                when (uiState.currentTab) {
                    PlayerTab.HUNT -> {
                        HuntTabScreen(
                            uiState = uiState,
                            onNavigateToCards = { viewModel.selectTab(PlayerTab.CARDS) },
                            onNavigateToLeaderboard = { viewModel.selectTab(PlayerTab.LEADERBOARD) }
                        )
                    }
                    PlayerTab.CARDS -> {
                        CardsTabScreen(
                            cards = uiState.cardsCollected,
                            totalPoints = uiState.totalPointsFromCards
                        )
                    }
                    PlayerTab.LEADERBOARD -> {
                        LeaderboardTabScreen(
                            uiState = uiState,
                            onNavigateToHunt = { viewModel.selectTab(PlayerTab.HUNT) }
                        )
                    }
                }

                // Points celebration toast banner
                if (uiState.showPointsDeltaBanner && uiState.recentPointsDelta != null) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .padding(16.dp)
                    ) {
                        PointsDeltaBanner(
                            delta = uiState.recentPointsDelta ?: 0,
                            onDismiss = { viewModel.dismissPointsDelta() }
                        )
                    }
                }
            }

            // Bottom Navigation Dock
            val currentNavRoute = when (uiState.currentTab) {
                PlayerTab.HUNT -> "hunt"
                PlayerTab.CARDS -> "cards"
                PlayerTab.LEADERBOARD -> "rank"
            }

            BottomNavBar(
                items = PlayerBottomNavItems,
                currentRoute = currentNavRoute,
                onItemClick = { item ->
                    view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                    when (item.route) {
                        "hunt" -> viewModel.selectTab(PlayerTab.HUNT)
                        "cards" -> viewModel.selectTab(PlayerTab.CARDS)
                        "rank" -> viewModel.selectTab(PlayerTab.LEADERBOARD)
                    }
                }
            )
        }
    }
}

// -------------------------------------------------------------
// SUB-HEADER: Team Callsign & Live Rank Badge
// -------------------------------------------------------------

@Composable
private fun PlayerSubHeader(
    teamName: String,
    currentClueNumber: Int,
    totalClues: Int,
    userRank: Int,
    totalTeams: Int
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(TacticalColors.SurfaceLow.copy(alpha = 0.9f))
            .border(1.dp, TacticalColors.CardBorder, RoundedCornerShape(12.dp))
            .padding(horizontal = 14.dp, vertical = 8.dp)
    ) {
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
                        .size(8.dp)
                        .background(TacticalColors.NeonGreen, CircleShape)
                )
                Column {
                    Text(
                        text = teamName,
                        style = MaterialTheme.typography.titleMedium,
                        color = TacticalColors.NeonCyan,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (totalClues > 0) "Checkpoint #0$currentClueNumber / $totalClues" else "Grid Sync Active",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary
                    )
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(TacticalColors.SurfaceHighest)
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.EmojiEvents,
                    contentDescription = null,
                    tint = TacticalColors.GoldAlert,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = if (userRank > 0) "Rank #$userRank / $totalTeams" else "Unranked",
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalColors.TextPrimary,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 1: HUNT DASHBOARD
// -------------------------------------------------------------

@Composable
private fun HuntTabScreen(
    uiState: PlayerUiState,
    onNavigateToCards: () -> Unit,
    onNavigateToLeaderboard: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Telemetry Score & Inventory HUD
        item {
            TelemetryScoreHud(
                score = uiState.team?.score ?: 0,
                cardsCount = uiState.cardsCollected.size,
                maxCards = uiState.totalCluesCount.coerceAtLeast(1),
                cards = uiState.cardsCollected
            )
        }

        // Phase Gate State Overlays / Directive Card
        when {
            uiState.hasNoTeamAssigned -> {
                item {
                    PhaseWarningCard(
                        title = stringResource(R.string.no_team_assigned_title),
                        description = stringResource(R.string.no_team_assigned_desc),
                        accentColor = TacticalColors.RedGlow
                    )
                }
            }
            uiState.isGamePaused -> {
                item {
                    PhaseWarningCard(
                        title = stringResource(R.string.game_paused_banner),
                        description = "Grid operations are suspended by the Game Master. Directive timers and scanning are frozen.",
                        accentColor = TacticalColors.GoldAlert
                    )
                }
            }
            uiState.isLobbyPhase -> {
                item {
                    PhaseWarningCard(
                        title = stringResource(R.string.game_lobby_title),
                        description = stringResource(R.string.game_lobby_desc),
                        accentColor = TacticalColors.NeonCyan
                    )
                }
            }
            uiState.isMemberPhase -> {
                item {
                    PhaseWarningCard(
                        title = stringResource(R.string.game_member_phase_title),
                        description = stringResource(R.string.game_member_phase_desc),
                        accentColor = TacticalColors.GoldAlert
                    )
                }
            }
            uiState.isGameEnded -> {
                item {
                    PhaseWarningCard(
                        title = stringResource(R.string.game_ended_banner),
                        description = "The scavenger hunt match has concluded. Check the Leaderboard to view championship results!",
                        accentColor = TacticalColors.NeonGreen
                    )
                }
            }
            uiState.isAllCluesFinished -> {
                item {
                    PhaseWarningCard(
                        title = stringResource(R.string.all_clues_completed_title),
                        description = stringResource(R.string.all_clues_completed_desc),
                        accentColor = TacticalColors.NeonGreen
                    )
                }
            }
            uiState.activeClue != null -> {
                item {
                    ActiveMissionDirectiveCard(
                        clue = uiState.activeClue!!,
                        checkpointNumber = uiState.currentClueNumber
                    )
                }
            }
            else -> {
                item {
                    PhaseWarningCard(
                        title = "CONNECTING DIRECTIVE STREAM",
                        description = "Syncing next station coordinates with Field Marshal network...",
                        accentColor = TacticalColors.NeonCyan
                    )
                }
            }
        }

        // Active Card Cipher Ticker
        item {
            ActiveCardCipherSection()
        }

        // Collected Deck Mini Log Preview
        item {
            CollectedDeckMiniLog(
                cards = uiState.cardsCollected,
                onViewAll = onNavigateToCards
            )
        }

        // Standings Preview Strip
        item {
            LeaderboardTickerPreview(
                leaderboard = uiState.leaderboard.take(3),
                onViewAll = onNavigateToLeaderboard
            )
        }
    }
}

@Composable
private fun TelemetryScoreHud(
    score: Int,
    cardsCount: Int,
    maxCards: Int,
    cards: List<PlayingCard>
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // Score HUD Card (Left 3 cols equivalent)
        GlassCard(
            modifier = Modifier
                .weight(1.5f)
                .height(130.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = null,
                            tint = TacticalColors.NeonCyan,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "SCORE HUD",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.NeonCyan,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Text(
                        text = "LIVE",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.NeonGreen,
                        fontWeight = FontWeight.Bold,
                        fontSize = 9.sp
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    GlowingScoreRing(
                        score = score,
                        maxScore = 400,
                        size = 54.dp,
                        strokeWidth = 4.dp
                    )
                }

                // Micro scanline progress bar
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(3.dp)
                        .background(TacticalColors.SurfaceHighest, CircleShape)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.72f)
                            .height(3.dp)
                            .background(TacticalColors.NeonCyan, CircleShape)
                    )
                }
            }
        }

        // Inventory Counter Card (Right 2 cols equivalent)
        GlassCard(
            modifier = Modifier
                .weight(1f)
                .height(130.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(12.dp),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = stringResource(R.string.inventory).uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary
                    )
                    Icon(
                        imageVector = Icons.Default.Style,
                        contentDescription = null,
                        tint = TacticalColors.NeonMagenta,
                        modifier = Modifier.size(14.dp)
                    )
                }

                Row(
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = "$cardsCount",
                        style = MaterialTheme.typography.headlineMedium,
                        color = TacticalColors.NeonMagenta,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "/ $maxCards",
                        style = MaterialTheme.typography.bodySmall,
                        color = TacticalColors.TextSecondary,
                        modifier = Modifier.padding(bottom = 3.dp)
                    )
                }

                // Mini stack preview
                Row(
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    cards.take(3).forEach { card ->
                        Box(
                            modifier = Modifier
                                .size(width = 18.dp, height = 24.dp)
                                .clip(RoundedCornerShape(3.dp))
                                .background(TacticalColors.SurfaceHighest)
                                .border(0.5.dp, TacticalColors.CardBorder, RoundedCornerShape(3.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = card.suitSymbol,
                                fontSize = 10.sp,
                                color = if (card.suitSymbol == "♥" || card.suitSymbol == "♦") TacticalColors.NeonMagenta else TacticalColors.NeonCyan
                            )
                        }
                    }
                    if (cards.size > 3) {
                        Text(
                            text = "+${cards.size - 3}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.NeonGreen,
                            fontSize = 10.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ActiveMissionDirectiveCard(
    clue: Clue,
    checkpointNumber: Int
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val laserAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.8f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500),
            repeatMode = RepeatMode.Reverse
        ),
        label = "amberPulse"
    )

    GlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.5.dp, TacticalColors.GoldAlert.copy(alpha = laserAlpha), RoundedCornerShape(12.dp))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Amber strip header
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
                            .size(28.dp)
                            .background(TacticalColors.GoldAlert.copy(alpha = 0.2f), RoundedCornerShape(6.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Radar,
                            contentDescription = null,
                            tint = TacticalColors.GoldAlert,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    Column {
                        Text(
                            text = stringResource(R.string.active_mission_directive).uppercase(),
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.GoldAlert,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Beacon Checkpoint #0$checkpointNumber • ${clue.zoneLabel.ifBlank { clue.zoneId }}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TacticalColors.TextSecondary
                        )
                    }
                }

                Box(
                    modifier = Modifier
                        .background(TacticalColors.GoldAlert.copy(alpha = 0.15f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = "ACTIVE",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.GoldAlert,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Clue text prompt banner
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(TacticalColors.SurfaceHighest.copy(alpha = 0.7f))
                    .padding(12.dp)
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(
                        imageVector = Icons.Default.Lightbulb,
                        contentDescription = null,
                        tint = TacticalColors.GoldAlert,
                        modifier = Modifier
                            .size(20.dp)
                            .padding(top = 2.dp)
                    )
                    Text(
                        text = "“${clue.text}”",
                        style = MaterialTheme.typography.bodyLarge,
                        color = TacticalColors.TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        lineHeight = 22.sp
                    )
                }
            }

            // Tactical Waypoint Navigation Banner
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(60.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(TacticalColors.SurfaceLowest)
                    .border(1.dp, TacticalColors.CardBorder, RoundedCornerShape(8.dp))
                    .padding(horizontal = 12.dp),
                contentAlignment = Alignment.Center
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
                                .size(8.dp)
                                .background(TacticalColors.GoldAlert, CircleShape)
                        )
                        Column {
                            Text(
                                text = "TARGET BEACON: ${clue.zoneId}",
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.NeonCyan,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Stationed Marshal on site",
                                style = MaterialTheme.typography.bodySmall,
                                color = TacticalColors.TextSecondary
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(TacticalColors.NeonCyan)
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = stringResource(R.string.navigate).uppercase(),
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.BackgroundDark,
                                fontWeight = FontWeight.Bold
                            )
                            Icon(
                                imageVector = Icons.Default.Navigation,
                                contentDescription = null,
                                tint = TacticalColors.BackgroundDark,
                                modifier = Modifier.size(12.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ActiveCardCipherSection() {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Bolt,
                        contentDescription = null,
                        tint = TacticalColors.NeonCyan,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "ACTIVE CARD CIPHER",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.NeonCyan,
                        fontWeight = FontWeight.Bold
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
                        text = "LIVE BEACON",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.NeonGreen,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(TacticalColors.SurfaceLowest)
                    .border(1.dp, TacticalColors.CardBorder, RoundedCornerShape(8.dp))
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "FIELD TRANSMISSION PROTOCOL",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.TextSecondary
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Draw card at station cone to register points and unlock next directive.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TacticalColors.TextPrimary
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(TacticalColors.SurfaceHighest, RoundedCornerShape(6.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(text = "🎴", fontSize = 18.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun CollectedDeckMiniLog(
    cards: List<PlayingCard>,
    onViewAll: () -> Unit
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
                text = stringResource(R.string.collected_deck_log).uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = TacticalColors.TextSecondary
            )
            Text(
                text = stringResource(R.string.view_all_cards, cards.size).uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = TacticalColors.NeonCyan,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.clickable { onViewAll() }
            )
        }

        if (cards.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(TacticalColors.SurfaceLowest)
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = stringResource(R.string.no_cards_yet),
                    style = MaterialTheme.typography.bodySmall,
                    color = TacticalColors.TextSecondary,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(cards) { card ->
                    PlayingCardTile(
                        rank = card.rankDisplay,
                        suit = card.suitSymbol,
                        width = 54.dp,
                        height = 80.dp
                    )
                }
            }
        }
    }
}

@Composable
private fun LeaderboardTickerPreview(
    leaderboard: List<TeamLeaderboardItem>,
    onViewAll: () -> Unit
) {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "GRID STANDINGS",
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalColors.NeonCyan,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "● LIVE SYNCED",
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalColors.NeonGreen,
                    fontSize = 10.sp
                )
            }

            leaderboard.forEach { item ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(6.dp))
                        .background(
                            if (item.isUserTeam) TacticalColors.NeonCyan.copy(alpha = 0.15f)
                            else TacticalColors.SurfaceLowest
                        )
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "#${item.rank}",
                            style = MaterialTheme.typography.labelSmall,
                            color = when (item.rank) {
                                1 -> TacticalColors.GoldAlert
                                2 -> TacticalColors.TextPrimary
                                3 -> TacticalColors.Secondary
                                else -> TacticalColors.TextSecondary
                            },
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = item.team.name + if (item.isUserTeam) " (You)" else "",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (item.isUserTeam) TacticalColors.NeonCyan else TacticalColors.TextPrimary,
                            fontWeight = if (item.isUserTeam) FontWeight.Bold else FontWeight.Medium
                        )
                    }

                    Text(
                        text = "${item.team.score} pts",
                        style = MaterialTheme.typography.bodySmall,
                        color = TacticalColors.TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 2: CARDS INVENTORY
// -------------------------------------------------------------

@Composable
private fun CardsTabScreen(
    cards: List<PlayingCard>,
    totalPoints: Int
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Summary Header Card
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "CARDS COLLECTED",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary
                    )
                    Text(
                        text = "${cards.size}",
                        style = MaterialTheme.typography.headlineMedium,
                        color = TacticalColors.NeonMagenta,
                        fontWeight = FontWeight.Bold
                    )
                }

                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .height(36.dp)
                        .background(TacticalColors.CardBorder)
                )

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "CARD SCORE",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary
                    )
                    Text(
                        text = "$totalPoints PTS",
                        style = MaterialTheme.typography.headlineMedium,
                        color = TacticalColors.NeonGreen,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Text(
            text = stringResource(R.string.card_inventory_title),
            style = MaterialTheme.typography.labelSmall,
            color = TacticalColors.TextSecondary
        )

        if (cards.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = stringResource(R.string.no_cards_yet),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TacticalColors.TextSecondary,
                    textAlign = TextAlign.Center
                )
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Adaptive(minSize = 72.dp),
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(cards) { card ->
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        PlayingCardTile(
                            rank = card.rankDisplay,
                            suit = card.suitSymbol,
                            width = 72.dp,
                            height = 104.dp
                        )
                        if (card.zoneId.isNotBlank()) {
                            Text(
                                text = card.zoneId,
                                style = MaterialTheme.typography.labelSmall,
                                color = TacticalColors.TextSecondary,
                                fontSize = 9.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------
// TAB 3: LEADERBOARD SCREEN
// -------------------------------------------------------------

@Composable
private fun LeaderboardTabScreen(
    uiState: PlayerUiState,
    onNavigateToHunt: () -> Unit
) {
    val sorted = uiState.sortedTeams
    val top1 = sorted.getOrNull(0)
    val top2 = sorted.getOrNull(1)
    val top3 = sorted.getOrNull(2)
    val contenders = if (sorted.size > 3) sorted.drop(3) else emptyList()

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            contentPadding = PaddingValues(top = 10.dp, bottom = 80.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Header strip
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "ALPHA-7 LIVE STANDINGS",
                        style = MaterialTheme.typography.titleMedium,
                        color = TacticalColors.TextPrimary,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "SYNC: 100%",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.NeonGreen,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Top 3 Podium
            if (sorted.isNotEmpty()) {
                item {
                    PodiumSection(top1 = top1, top2 = top2, top3 = top3)
                }
            }

            // Contender list (Rank 4+)
            if (contenders.isNotEmpty()) {
                item {
                    Text(
                        text = stringResource(R.string.contender_grid).uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary
                    )
                }

                items(contenders) { team ->
                    val rank = sorted.indexOf(team) + 1
                    val isUserTeam = team.id == (uiState.team?.id ?: uiState.userProfile?.teamId)

                    LeaderboardRow(
                        rank = rank,
                        team = team,
                        isUserTeam = isUserTeam
                    )
                }
            }
        }

        // Pinned Bottom Sticky Row for User Team
        val userItem = uiState.userTeamItem
        if (userItem != null) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(TacticalColors.SurfaceHighest.copy(alpha = 0.95f))
                    .border(1.5.dp, TacticalColors.NeonCyan, RoundedCornerShape(12.dp))
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
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
                                .size(32.dp)
                                .background(TacticalColors.NeonCyan, RoundedCornerShape(6.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "#${userItem.rank}",
                                style = MaterialTheme.typography.labelMedium,
                                color = TacticalColors.BackgroundDark,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = userItem.team.name,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = TacticalColors.NeonCyan,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "YOU",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TacticalColors.NeonGreen,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text(
                                text = "${userItem.team.score} PTS • ${userItem.cardsCount} Cards",
                                style = MaterialTheme.typography.bodySmall,
                                color = TacticalColors.TextSecondary
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(TacticalColors.NeonGreen)
                            .clickable { onNavigateToHunt() }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "RADAR ▶",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.BackgroundDark,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PodiumSection(
    top1: Team?,
    top2: Team?,
    top3: Team?
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.Bottom
    ) {
        // #2 Silver Pedestal
        if (top2 != null) {
            PodiumColumn(
                team = top2,
                rank = 2,
                height = 110.dp,
                accentColor = TacticalColors.TextPrimary,
                modifier = Modifier.weight(1f)
            )
        }

        // #1 Gold Champion Pedestal
        if (top1 != null) {
            PodiumColumn(
                team = top1,
                rank = 1,
                height = 145.dp,
                accentColor = TacticalColors.GoldAlert,
                modifier = Modifier.weight(1.1f)
            )
        }

        // #3 Bronze Pedestal
        if (top3 != null) {
            PodiumColumn(
                team = top3,
                rank = 3,
                height = 95.dp,
                accentColor = TacticalColors.Secondary,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun PodiumColumn(
    team: Team,
    rank: Int,
    height: androidx.compose.ui.unit.Dp,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Badge & Callout
        Box(
            modifier = Modifier
                .size(if (rank == 1) 48.dp else 40.dp)
                .background(accentColor.copy(alpha = 0.2f), CircleShape)
                .border(1.5.dp, accentColor, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = if (rank == 1) "👑" else if (rank == 2) "🥈" else "🥉",
                fontSize = if (rank == 1) 22.sp else 18.sp
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = team.name,
            style = MaterialTheme.typography.bodySmall,
            color = TacticalColors.TextPrimary,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )

        Text(
            text = "${team.score} pts",
            style = MaterialTheme.typography.labelSmall,
            color = accentColor,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(6.dp))

        // Pedestal base block
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(height)
                .clip(RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp))
                .background(TacticalColors.SurfaceHighest)
                .border(
                    1.dp,
                    accentColor.copy(alpha = 0.5f),
                    RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "#$rank",
                style = MaterialTheme.typography.headlineLarge,
                color = accentColor.copy(alpha = 0.35f),
                fontWeight = FontWeight.Black
            )
        }
    }
}

@Composable
private fun LeaderboardRow(
    rank: Int,
    team: Team,
    isUserTeam: Boolean
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(
                if (isUserTeam) TacticalColors.NeonCyan.copy(alpha = 0.12f)
                else TacticalColors.SurfaceLowest
            )
            .border(
                1.dp,
                if (isUserTeam) TacticalColors.NeonCyan else TacticalColors.CardBorder,
                RoundedCornerShape(8.dp)
            )
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
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
                        .size(24.dp)
                        .background(TacticalColors.SurfaceHighest, RoundedCornerShape(4.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "0$rank".takeLast(2),
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary,
                        fontWeight = FontWeight.Bold
                    )
                }

                Column {
                    Text(
                        text = team.name + if (isUserTeam) " (You)" else "",
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (isUserTeam) TacticalColors.NeonCyan else TacticalColors.TextPrimary,
                        fontWeight = if (isUserTeam) FontWeight.Bold else FontWeight.SemiBold
                    )
                    Text(
                        text = "${team.cards.size} Cards collected",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.TextSecondary
                    )
                }
            }

            Text(
                text = "${team.score} PTS",
                style = MaterialTheme.typography.bodyMedium,
                color = TacticalColors.NeonGreen,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

// -------------------------------------------------------------
// HELPER BANNERS & OVERLAYS
// -------------------------------------------------------------

@Composable
private fun PhaseWarningCard(
    title: String,
    description: String,
    accentColor: Color
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(accentColor.copy(alpha = 0.12f))
            .border(1.dp, accentColor, RoundedCornerShape(10.dp))
            .padding(16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = null,
                tint = accentColor,
                modifier = Modifier.size(24.dp)
            )
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = accentColor,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TacticalColors.TextPrimary
                )
            }
        }
    }
}

@Composable
private fun PointsDeltaBanner(
    delta: Int,
    onDismiss: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(TacticalColors.NeonGreen)
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .clickable { onDismiss() }
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
                Text(text = "⚡", fontSize = 18.sp)
                Text(
                    text = stringResource(R.string.points_celebration, delta),
                    style = MaterialTheme.typography.titleMedium,
                    color = TacticalColors.BackgroundDark,
                    fontWeight = FontWeight.Bold
                )
            }

            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "Dismiss",
                tint = TacticalColors.BackgroundDark,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}
