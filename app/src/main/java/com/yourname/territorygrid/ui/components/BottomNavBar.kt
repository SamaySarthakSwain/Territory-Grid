package com.yourname.territorygrid.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Radar
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme

data class BottomNavItem(
    val route: String,
    val label: String,
    val icon: ImageVector
)

val DefaultBottomNavItems = listOf(
    BottomNavItem("hunt", "Hunt", Icons.Default.Radar),
    BottomNavItem("cards", "Cards", Icons.Default.Style),
    BottomNavItem("rank", "Rank", Icons.Default.EmojiEvents),
    BottomNavItem("control", "Control", Icons.Default.Tune)
)

@Composable
fun BottomNavBar(
    items: List<BottomNavItem> = DefaultBottomNavItems,
    currentRoute: String = "control",
    onItemClick: (BottomNavItem) -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(TacticalColors.Surface.copy(alpha = 0.94f))
            .drawBehind {
                // Top laser divider
                drawLine(
                    color = TacticalColors.PrimaryContainer.copy(alpha = 0.20f),
                    start = Offset(0f, 0f),
                    end = Offset(size.width, 0f),
                    strokeWidth = 1.dp.toPx()
                )
            }
            .navigationBarsPadding()
            .height(64.dp)
            .padding(horizontal = 8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            items.forEach { item ->
                val isSelected = item.route == currentRoute
                val itemColor by animateColorAsState(
                    targetValue = if (isSelected) TacticalColors.PrimaryContainer else TacticalColors.OnSurfaceVariant,
                    label = "navColor"
                )

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier
                        .weight(1f)
                        .clickable { onItemClick(item) }
                        .padding(vertical = 6.dp)
                ) {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label,
                        tint = itemColor,
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        text = item.label.uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = itemColor,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                    if (isSelected) {
                        Box(
                            modifier = Modifier
                                .padding(top = 3.dp)
                                .size(4.dp)
                                .clip(CircleShape)
                                .background(TacticalColors.PrimaryContainer)
                        )
                    }
                }
            }
        }
    }
}

@Preview
@Composable
fun BottomNavBarPreview() {
    TerritoryGridTheme {
        BottomNavBar(currentRoute = "control", onItemClick = {})
    }
}
