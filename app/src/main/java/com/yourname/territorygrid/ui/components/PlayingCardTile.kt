package com.yourname.territorygrid.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme

@Composable
fun PlayingCardTile(
    rank: String,
    suit: String, // ♠, ♥, ♦, ♣
    isFaceUp: Boolean = true,
    onClick: (() -> Unit)? = null,
    width: Dp = 64.dp,
    height: Dp = 96.dp,
    modifier: Modifier = Modifier
) {
    val rotation by animateFloatAsState(
        targetValue = if (isFaceUp) 0f else 180f,
        animationSpec = tween(durationMillis = 400, easing = FastOutSlowInEasing),
        label = "cardFlip"
    )

    val isFrontShowing = rotation <= 90f
    val suitColor = if (suit == "♥" || suit == "♦") TacticalColors.Secondary else TacticalColors.PrimaryContainer
    val cardShape = RoundedCornerShape(8.dp)

    Box(
        modifier = modifier
            .width(width)
            .height(height)
            .graphicsLayer {
                rotationY = rotation
                cameraDistance = 12f * density
            }
            .drawBehind {
                drawRoundRect(
                    color = suitColor.copy(alpha = 0.20f),
                    size = size,
                    style = Stroke(width = 6.dp.toPx())
                )
            }
            .clip(cardShape)
            .background(TacticalColors.SurfaceLow)
            .border(1.dp, suitColor.copy(alpha = 0.6f), cardShape)
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
            .padding(6.dp)
    ) {
        if (isFrontShowing) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                // Top Pip
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = rank,
                        style = MaterialTheme.typography.labelMedium,
                        color = TacticalColors.OnSurface
                    )
                    Text(
                        text = suit,
                        style = MaterialTheme.typography.labelSmall,
                        color = suitColor
                    )
                }

                // Center Emblem
                Box(
                    modifier = Modifier.align(Alignment.CenterHorizontally),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = suit,
                        fontSize = (width.value * 0.35f).sp,
                        color = suitColor
                    )
                }

                // Inverted Bottom Pip
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .graphicsLayer { rotationZ = 180f },
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = rank,
                        style = MaterialTheme.typography.labelMedium,
                        color = TacticalColors.OnSurface
                    )
                    Text(
                        text = suit,
                        style = MaterialTheme.typography.labelSmall,
                        color = suitColor
                    )
                }
            }
        } else {
            // Card Back - Holographic circuit pattern
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer { rotationY = 180f }
                    .background(TacticalColors.SurfaceLowest),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = null,
                    tint = TacticalColors.PrimaryFixedDim.copy(alpha = 0.5f)
                )
            }
        }
    }
}

@Preview
@Composable
fun PlayingCardTilePreview() {
    TerritoryGridTheme {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            PlayingCardTile(rank = "K", suit = "♠", isFaceUp = true)
            PlayingCardTile(rank = "A", suit = "♥", isFaceUp = true)
            PlayingCardTile(rank = "7", suit = "♦", isFaceUp = false)
        }
    }
}
