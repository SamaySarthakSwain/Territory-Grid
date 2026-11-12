package com.yourname.territorygrid.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme

@Composable
fun OfflineBanner(
    isOffline: Boolean,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(
        visible = isOffline,
        enter = expandVertically(),
        exit = shrinkVertically(),
        modifier = modifier
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(TacticalColors.WarningAmber)
                .padding(horizontal = 16.dp, vertical = 6.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.align(Alignment.Center)
            ) {
                Icon(
                    imageVector = Icons.Default.CloudOff,
                    contentDescription = null,
                    tint = TacticalColors.SurfaceLowest,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "OFFLINE CACHE ACTIVE — Submissions queued locally",
                    style = MaterialTheme.typography.labelSmall,
                    color = TacticalColors.SurfaceLowest
                )
            }
        }
    }
}

@Composable
fun PendingSyncBadge(
    pendingCount: Int,
    modifier: Modifier = Modifier
) {
    if (pendingCount <= 0) return

    Box(
        modifier = modifier
            .clip(CircleShape)
            .background(TacticalColors.WarningAmber.copy(alpha = 0.20f))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = Icons.Default.Sync,
                contentDescription = null,
                tint = TacticalColors.WarningAmber,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "$pendingCount PENDING",
                style = MaterialTheme.typography.labelSmall,
                color = TacticalColors.WarningAmber
            )
        }
    }
}

@Preview
@Composable
fun OfflineBannerPreview() {
    TerritoryGridTheme {
        OfflineBanner(isOffline = true)
    }
}
