package com.yourname.territorygrid.ui.components

import android.view.HapticFeedbackConstants
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PaintingStyle.Companion.Stroke
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.yourname.territorygrid.ui.theme.ChamferedShape
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme

enum class NeonButtonVariant {
    PRIMARY,
    SUCCESS,
    SECONDARY,
    DANGER
}

@Composable
fun NeonButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: NeonButtonVariant = NeonButtonVariant.PRIMARY,
    enabled: Boolean = true,
    leadingIcon: (@Composable () -> Unit)? = null
) {
    val view = LocalView.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val glowAlpha by animateFloatAsState(
        targetValue = if (!enabled) 0f else if (isPressed) 0.65f else 0.35f,
        animationSpec = tween(durationMillis = 150),
        label = "glowAlpha"
    )

    val (containerColor, contentColor, strokeColor, glowColor) = when (variant) {
        NeonButtonVariant.PRIMARY -> Quadruple(
            TacticalColors.PrimaryContainer,
            TacticalColors.OnPrimary,
            TacticalColors.PrimaryContainer,
            TacticalColors.PrimaryContainer
        )
        NeonButtonVariant.SUCCESS -> Quadruple(
            TacticalColors.TertiaryContainer,
            TacticalColors.OnTertiary,
            TacticalColors.TertiaryContainer,
            TacticalColors.TacticalGreen
        )
        NeonButtonVariant.SECONDARY -> Quadruple(
            TacticalColors.SurfaceLow,
            TacticalColors.Primary,
            TacticalColors.PrimaryContainer.copy(alpha = 0.5f),
            TacticalColors.PrimaryFixedDim
        )
        NeonButtonVariant.DANGER -> Quadruple(
            TacticalColors.ErrorContainer.copy(alpha = 0.35f),
            TacticalColors.Error,
            TacticalColors.Error,
            TacticalColors.Error
        )
    }

    val shape = remember { ChamferedShape(cutSize = 8.dp) }

    Button(
        onClick = {
            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            onClick()
        },
        modifier = modifier
            .height(52.dp)
            .drawBehind {
                if (enabled && glowAlpha > 0f) {
                    // Multi-layer translucent glow per Rule: zero Modifier.blur
                    drawRoundRect(
                        color = glowColor.copy(alpha = glowAlpha * 0.20f),
                        size = size,
                        style = Stroke(width = 12.dp.toPx())
                    )
                    drawRoundRect(
                        color = glowColor.copy(alpha = glowAlpha * 0.45f),
                        size = size,
                        style = Stroke(width = 4.dp.toPx())
                    )
                }
            },
        enabled = enabled,
        shape = shape,
        colors = ButtonDefaults.buttonColors(
            containerColor = containerColor,
            contentColor = contentColor,
            disabledContainerColor = TacticalColors.SurfaceHighest,
            disabledContentColor = TacticalColors.Outline
        ),
        border = if (enabled) BorderStroke(1.5.dp, strokeColor) else null,
        interactionSource = interactionSource,
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            leadingIcon?.let {
                it()
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge
            )
        }
    }
}

private data class Quadruple<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)

@Preview
@Composable
fun NeonButtonPreview() {
    TerritoryGridTheme {
        NeonButton(
            text = "TRANSMIT TELEMETRY",
            onClick = {},
            variant = NeonButtonVariant.SUCCESS,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
