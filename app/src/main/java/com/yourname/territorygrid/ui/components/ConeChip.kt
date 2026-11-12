package com.yourname.territorygrid.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChangeHistory
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme

enum class BeaconCone(val label: String, val points: Int, val color: Color, val glowColor: Color) {
    RED("Red", 10, TacticalColors.ConeRed, TacticalColors.ConeRedGlow),
    YELLOW("Yellow", 12, TacticalColors.ConeYellow, TacticalColors.ConeYellowGlow),
    GREEN("Green", 15, TacticalColors.ConeGreen, TacticalColors.ConeGreenGlow)
}

@Composable
fun ConeChip(
    cone: BeaconCone,
    isSelected: Boolean,
    onSelect: () -> Unit,
    modifier: Modifier = Modifier
) {
    val chipShape = RoundedCornerShape(12.dp)
    val animatedBg by animateColorAsState(
        targetValue = if (isSelected) TacticalColors.SurfaceHigh else TacticalColors.SurfaceLowest,
        label = "coneChipBg"
    )
    val animatedBorder by animateColorAsState(
        targetValue = if (isSelected) cone.color else TacticalColors.OutlineVariant.copy(alpha = 0.4f),
        label = "coneChipBorder"
    )

    Box(
        modifier = modifier
            .drawBehind {
                if (isSelected) {
                    drawRoundRect(
                        color = cone.glowColor.copy(alpha = 0.35f),
                        size = size,
                        style = Stroke(width = 8.dp.toPx())
                    )
                }
            }
            .clip(chipShape)
            .background(animatedBg)
            .border(if (isSelected) 2.dp else 1.dp, animatedBorder, chipShape)
            .clickable { onSelect() }
            .padding(vertical = 12.dp, horizontal = 8.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(cone.color.copy(alpha = if (isSelected) 0.25f else 0.12f))
            ) {
                Icon(
                    imageVector = Icons.Default.ChangeHistory,
                    contentDescription = cone.label,
                    tint = cone.color,
                    modifier = Modifier.size(22.dp)
                )
            }

            Text(
                text = cone.label,
                style = MaterialTheme.typography.headlineSmall,
                color = if (isSelected) cone.color else TacticalColors.OnSurface,
                modifier = Modifier.padding(top = 4.dp)
            )

            Text(
                text = "+${cone.points} PTS",
                style = MaterialTheme.typography.labelSmall,
                color = cone.color
            )
        }

        if (isSelected) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(18.dp)
                    .align(Alignment.TopEnd)
                    .offset(x = 2.dp, y = (-2).dp)
                    .clip(CircleShape)
                    .background(cone.color)
            ) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = null,
                    tint = TacticalColors.SurfaceLowest,
                    modifier = Modifier.size(12.dp)
                )
            }
        }
    }
}

@Preview
@Composable
fun ConeChipPreview() {
    TerritoryGridTheme {
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            ConeChip(cone = BeaconCone.RED, isSelected = false, onSelect = {}, modifier = Modifier.weight(1f))
            ConeChip(cone = BeaconCone.YELLOW, isSelected = true, onSelect = {}, modifier = Modifier.weight(1f))
            ConeChip(cone = BeaconCone.GREEN, isSelected = false, onSelect = {}, modifier = Modifier.weight(1f))
        }
    }
}
