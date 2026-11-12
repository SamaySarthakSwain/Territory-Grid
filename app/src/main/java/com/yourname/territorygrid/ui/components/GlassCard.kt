package com.yourname.territorygrid.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.yourname.territorygrid.ui.theme.ChamferedShape
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    borderColor: Color = TacticalColors.PrimaryContainer.copy(alpha = 0.35f),
    containerColor: Color = TacticalColors.SurfaceHigh.copy(alpha = 0.85f),
    cutSize: Dp = 10.dp,
    showCrosshairs: Boolean = false,
    content: @Composable BoxScope.() -> Unit
) {
    val shape = remember(cutSize) { ChamferedShape(cutSize = cutSize) }

    Box(
        modifier = modifier
            .drawBehind {
                // Layered translucent glow outline
                drawRoundRect(
                    color = borderColor.copy(alpha = 0.12f),
                    size = size,
                    style = Stroke(width = 8.dp.toPx())
                )
                if (showCrosshairs) {
                    val chLen = 14.dp.toPx()
                    val strokeW = 1.5.dp.toPx()
                    val reticleColor = TacticalColors.PrimaryFixedDim.copy(alpha = 0.7f)
                    // Top-left
                    drawLine(reticleColor, Offset(-4f, -4f), Offset(-4f + chLen, -4f), strokeW)
                    drawLine(reticleColor, Offset(-4f, -4f), Offset(-4f, -4f + chLen), strokeW)
                    // Top-right
                    drawLine(reticleColor, Offset(size.width + 4f, -4f), Offset(size.width + 4f - chLen, -4f), strokeW)
                    drawLine(reticleColor, Offset(size.width + 4f, -4f), Offset(size.width + 4f, -4f + chLen), strokeW)
                    // Bottom-left
                    drawLine(reticleColor, Offset(-4f, size.height + 4f), Offset(-4f + chLen, size.height + 4f), strokeW)
                    drawLine(reticleColor, Offset(-4f, size.height + 4f), Offset(-4f, size.height + 4f - chLen), strokeW)
                    // Bottom-right
                    drawLine(reticleColor, Offset(size.width + 4f, size.height + 4f), Offset(size.width + 4f - chLen, size.height + 4f), strokeW)
                    drawLine(reticleColor, Offset(size.width + 4f, size.height + 4f), Offset(size.width + 4f, size.height + 4f - chLen), strokeW)
                }
            }
            .clip(shape)
            .background(containerColor)
            .border(BorderStroke(1.dp, borderColor), shape)
            .padding(16.dp),
        content = content
    )
}

@Preview
@Composable
fun GlassCardPreview() {
    TerritoryGridTheme {
        GlassCard(showCrosshairs = true) {
            androidx.compose.material3.Text(
                text = "HOLOGRAPHIC TELEMETRY CARD",
                color = TacticalColors.Primary
            )
        }
    }
}
