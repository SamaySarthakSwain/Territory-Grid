package com.yourname.territorygrid.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme

@Composable
fun TopHudBar(
    title: String = "Territory Grid",
    subtitle: String = "Checkpoint Log",
    roleLabel: String = "Marshal",
    onProfileClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(TacticalColors.Surface.copy(alpha = 0.92f))
            .drawBehind {
                // Bottom cyan laser line
                drawLine(
                    color = TacticalColors.PrimaryContainer.copy(alpha = 0.25f),
                    start = Offset(0f, size.height),
                    end = Offset(size.width, size.height),
                    strokeWidth = 1.dp.toPx()
                )
            }
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Brand & Subtitle
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(TacticalColors.PrimaryContainer.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "TG",
                        style = MaterialTheme.typography.labelSmall,
                        color = TacticalColors.PrimaryContainer
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                Column {
                    Text(
                        text = title.uppercase(),
                        style = MaterialTheme.typography.headlineSmall,
                        color = TacticalColors.Primary
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(TacticalColors.TertiaryContainer)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = subtitle.uppercase(),
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.OnSurfaceVariant
                        )
                    }
                }
            }

            // Status Telemetry & Role Pill
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Role Badge
                Box(
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(TacticalColors.SurfaceHigh)
                        .padding(horizontal = 10.dp, vertical = 3.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(TacticalColors.PrimaryContainer)
                        )
                        Spacer(modifier = Modifier.width(5.dp))
                        Text(
                            text = roleLabel.uppercase(),
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.Primary
                        )
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Wifi & Battery telemetry
                Icon(
                    imageVector = Icons.Default.Wifi,
                    contentDescription = null,
                    tint = TacticalColors.Tertiary,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Icon(
                    imageVector = Icons.Default.BatteryChargingFull,
                    contentDescription = null,
                    tint = TacticalColors.PrimaryContainer,
                    modifier = Modifier.size(16.dp)
                )

                Spacer(modifier = Modifier.width(8.dp))

                // Profile action
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(TacticalColors.Primary)
                        .then(if (onProfileClick != null) Modifier.clickable { onProfileClick() } else Modifier),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = "Profile",
                        tint = TacticalColors.OnPrimary,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Preview
@Composable
fun TopHudBarPreview() {
    TerritoryGridTheme {
        TopHudBar()
    }
}
