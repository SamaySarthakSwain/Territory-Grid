package com.yourname.territorygrid.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme

@Composable
fun GlowingScoreRing(
    score: Int,
    maxScore: Int = 500,
    size: Dp = 68.dp,
    strokeWidth: Dp = 5.dp,
    ringColor: Color = TacticalColors.PrimaryContainer,
    modifier: Modifier = Modifier
) {
    val animatedScore by animateIntAsState(
        targetValue = score,
        animationSpec = tween(durationMillis = 600, easing = FastOutSlowInEasing),
        label = "scoreCounter"
    )

    val targetSweep = (score.toFloat() / maxScore.coerceAtLeast(1).toFloat()).coerceIn(0f, 1f) * 360f
    val animatedSweep by animateFloatAsState(
        targetValue = targetSweep,
        animationSpec = tween(durationMillis = 600, easing = FastOutSlowInEasing),
        label = "sweepProgress"
    )

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.size(size)
        ) {
            Canvas(modifier = Modifier.size(size)) {
                val strokePx = strokeWidth.toPx()
                val radius = (this.size.minDimension - strokePx) / 2f
                val centerOffset = center

                // Inactive track
                drawCircle(
                    color = TacticalColors.Surface,
                    radius = radius,
                    style = Stroke(width = strokePx)
                )

                // Outer layered glow stroke
                drawArc(
                    color = ringColor.copy(alpha = 0.25f),
                    startAngle = -90f,
                    sweepAngle = animatedSweep,
                    useCenter = false,
                    style = Stroke(width = strokePx * 2.2f, cap = StrokeCap.Round)
                )

                // Core active laser arc
                drawArc(
                    color = ringColor,
                    startAngle = -90f,
                    sweepAngle = animatedSweep,
                    useCenter = false,
                    style = Stroke(width = strokePx, cap = StrokeCap.Round)
                )
            }

            Icon(
                imageVector = Icons.Default.Bolt,
                contentDescription = null,
                tint = ringColor,
                modifier = Modifier.size(size * 0.35f)
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column {
            Text(
                text = "$animatedScore",
                style = MaterialTheme.typography.displayMedium,
                color = TacticalColors.Primary
            )
            Text(
                text = "TOTAL POINTS",
                style = MaterialTheme.typography.labelSmall,
                color = TacticalColors.OnSurfaceVariant
            )
        }
    }
}

@Preview
@Composable
fun GlowingScoreRingPreview() {
    TerritoryGridTheme {
        GlowingScoreRing(score = 148, maxScore = 300)
    }
}
