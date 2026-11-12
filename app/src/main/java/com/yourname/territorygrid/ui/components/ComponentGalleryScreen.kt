package com.yourname.territorygrid.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme

@Composable
fun ComponentGalleryScreen() {
    var textInput by remember { mutableStateOf("Agent_Kestrel_09") }
    var selectedCone by remember { mutableStateOf(BeaconCone.YELLOW) }
    var isCardFaceUp by remember { mutableStateOf(true) }
    var currentNavRoute by remember { mutableStateOf("control") }
    var showDialog by remember { mutableStateOf(false) }
    var testScore by remember { mutableIntStateOf(148) }

    Scaffold(
        topBar = {
            TopHudBar(
                title = "Territory Grid",
                subtitle = "Component Matrix"
            )
        },
        bottomBar = {
            BottomNavBar(
                currentRoute = currentNavRoute,
                onItemClick = { currentNavRoute = it.route }
            )
        },
        containerColor = TacticalColors.Background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            HexGridBackground()

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OfflineBanner(isOffline = true)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    StatusChip(text = "SYS.ONLINE // TELEMETRY: ACTIVE")
                    PendingSyncBadge(pendingCount = 2)
                }

                ScanlineDivider()

                Text(
                    text = "RADIAL TELEMETRY RING",
                    style = MaterialTheme.typography.labelMedium,
                    color = TacticalColors.Primary
                )

                GlowingScoreRing(
                    score = testScore,
                    maxScore = 300,
                    modifier = Modifier.padding(vertical = 4.dp)
                )

                ScanlineDivider()

                Text(
                    text = "OBJECTIVE BEACON SELECTOR",
                    style = MaterialTheme.typography.labelMedium,
                    color = TacticalColors.Primary
                )

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    BeaconCone.entries.forEach { cone ->
                        ConeChip(
                            cone = cone,
                            isSelected = selectedCone == cone,
                            onSelect = { selectedCone = cone },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                ScanlineDivider()

                Text(
                    text = "HOLOGRAPHIC PLAYING CARDS (TAP TO FLIP)",
                    style = MaterialTheme.typography.labelMedium,
                    color = TacticalColors.Primary
                )

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    PlayingCardTile(
                        rank = "K",
                        suit = "♠",
                        isFaceUp = isCardFaceUp,
                        onClick = { isCardFaceUp = !isCardFaceUp }
                    )
                    PlayingCardTile(
                        rank = "Q",
                        suit = "♥",
                        isFaceUp = isCardFaceUp,
                        onClick = { isCardFaceUp = !isCardFaceUp }
                    )
                    PlayingCardTile(
                        rank = "10",
                        suit = "♦",
                        isFaceUp = isCardFaceUp,
                        onClick = { isCardFaceUp = !isCardFaceUp }
                    )
                }

                ScanlineDivider()

                Text(
                    text = "TACTICAL INPUT WELLS",
                    style = MaterialTheme.typography.labelMedium,
                    color = TacticalColors.Primary
                )

                NeonTextField(
                    value = textInput,
                    onValueChange = { textInput = it },
                    label = "Tactical Callsign / ID",
                    hint = "Enter callsign"
                )

                ScanlineDivider()

                Text(
                    text = "CHAMFERED GLASS PANELS",
                    style = MaterialTheme.typography.labelMedium,
                    color = TacticalColors.Primary
                )

                GlassCard(showCrosshairs = true) {
                    Column {
                        Text(
                            text = "MISSION DIRECTIVE // ALPHA-7",
                            style = MaterialTheme.typography.headlineSmall,
                            color = TacticalColors.Primary
                        )
                        Text(
                            text = "Locate the Yellow Beacon Cone nestled near the library plaza arch.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TacticalColors.OnSurfaceVariant,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }

                ScanlineDivider()

                Text(
                    text = "ACTION CONTROLS",
                    style = MaterialTheme.typography.labelMedium,
                    color = TacticalColors.Primary
                )

                NeonButton(
                    text = "TRANSMIT TELEMETRY (+${selectedCone.points} PTS)",
                    onClick = { testScore += selectedCone.points },
                    variant = NeonButtonVariant.SUCCESS,
                    modifier = Modifier.fillMaxWidth()
                )

                NeonButton(
                    text = "TRIGGER GRID RESET MODAL",
                    onClick = { showDialog = true },
                    variant = NeonButtonVariant.DANGER,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(32.dp))
            }

            if (showDialog) {
                ConfirmDialog(
                    title = "Authorize Grid Reset?",
                    message = "This will invalidate all checkpoint caches, recalculate delta scores to zero, and halt current team telemetry.",
                    confirmText = "Purge Grid",
                    onConfirm = {
                        testScore = 0
                        showDialog = false
                    },
                    onDismiss = { showDialog = false },
                    isDanger = true
                )
            }
        }
    }
}

@Preview
@Composable
fun ComponentGalleryScreenPreview() {
    TerritoryGridTheme {
        ComponentGalleryScreen()
    }
}
