package com.yourname.territorygrid.domain.usecase

import com.yourname.territorygrid.domain.model.ConeColor
import javax.inject.Inject

/**
 * Pure mathematical scoring function per Non-Negotiable Rules:
 * points = cardRank (Ace=1 ... King=13) + coneValue (RED=10, YELLOW=12, GREEN=15)
 */
class CalculatePointsUseCase @Inject constructor() {
    operator fun invoke(cardRank: Int, coneColor: ConeColor): Int {
        val clampedRank = cardRank.coerceIn(1, 13)
        return clampedRank + coneColor.points
    }
}
