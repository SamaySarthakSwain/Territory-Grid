package com.yourname.territorygrid.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme

@Composable
fun HexGridBackground(
    modifier: Modifier = Modifier,
    isLiteMode: Boolean = false,
    color: Color = TacticalColors.PrimaryFixedDim.copy(alpha = 0.08f)
) {
    val infiniteTransition = rememberInfiniteTransition(label = "hexDrift")
    val offsetY by if (isLiteMode) {
        androidx.compose.runtime.remember { androidx.compose.runtime.mutableFloatStateOf(0f) }
    } else {
        infiniteTransition.animateFloat(
            initialValue = 0f,
            targetValue = 62.35f,
            animationSpec = infiniteRepeatable(
                animation = tween(durationMillis = 14000, easing = LinearEasing),
                repeatMode = RepeatMode.Restart
            ),
            label = "offsetY"
        )
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        val hexWidth = 36.dp.toPx()
        val hexHeight = 62.35f * (hexWidth / 36f)
        val strokeWidth = 1.dp.toPx()
        val pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 8f), 0f)

        val cols = (size.width / hexWidth).toInt() + 2
        val rows = (size.height / hexHeight).toInt() + 3

        for (r in -1..rows) {
            val yShift = r * hexHeight + (offsetY % hexHeight)
            for (c in -1..cols) {
                val xShift = c * hexWidth + if (r % 2 != 0) hexWidth / 2f else 0f

                val hexPath = Path().apply {
                    val halfW = hexWidth / 2f
                    val quarterH = hexHeight / 4f
                    val threeQuarterH = hexHeight * 0.75f

                    moveTo(xShift + halfW, yShift)
                    lineTo(xShift + hexWidth, yShift + quarterH)
                    lineTo(xShift + hexWidth, yShift + threeQuarterH)
                    lineTo(xShift + halfW, yShift + hexHeight)
                    lineTo(xShift, yShift + threeQuarterH)
                    lineTo(xShift, yShift + quarterH)
                    close()
                }

                drawPath(
                    path = hexPath,
                    color = color,
                    style = Stroke(width = strokeWidth, pathEffect = pathEffect)
                )
            }
        }
    }
}

@Preview
@Composable
fun HexGridBackgroundPreview() {
    TerritoryGridTheme {
        HexGridBackground()
    }
}
