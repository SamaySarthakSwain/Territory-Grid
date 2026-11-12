package com.yourname.territorygrid.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp

val TacticalShapes = Shapes(
    small = RoundedCornerShape(4.dp),
    medium = RoundedCornerShape(8.dp),
    large = RoundedCornerShape(12.dp)
)

/**
 * Creates a tactical 45-degree chamfered polygon cut on the specified corners.
 */
class ChamferedShape(
    private val cutSize: Dp = 10.dp,
    private val cutTopRight: Boolean = true,
    private val cutBottomLeft: Boolean = true,
    private val cutTopLeft: Boolean = false,
    private val cutBottomRight: Boolean = false
) : Shape {
    override fun createOutline(
        size: Size,
        layoutDirection: LayoutDirection,
        density: Density
    ): Outline {
        val cutPx = with(density) { cutSize.toPx() }
        val path = Path().apply {
            val w = size.width
            val h = size.height

            // Start at top-left
            if (cutTopLeft) {
                moveTo(cutPx, 0f)
            } else {
                moveTo(0f, 0f)
            }

            // Top edge to top-right
            if (cutTopRight) {
                lineTo(w - cutPx, 0f)
                lineTo(w, cutPx)
            } else {
                lineTo(w, 0f)
            }

            // Right edge to bottom-right
            if (cutBottomRight) {
                lineTo(w, h - cutPx)
                lineTo(w - cutPx, h)
            } else {
                lineTo(w, h)
            }

            // Bottom edge to bottom-left
            if (cutBottomLeft) {
                lineTo(cutPx, h)
                lineTo(0f, h - cutPx)
            } else {
                lineTo(0f, h)
            }

            // Left edge back to top-left
            if (cutTopLeft) {
                lineTo(0f, cutPx)
                close()
            } else {
                close()
            }
        }
        return Outline.Generic(path)
    }
}
