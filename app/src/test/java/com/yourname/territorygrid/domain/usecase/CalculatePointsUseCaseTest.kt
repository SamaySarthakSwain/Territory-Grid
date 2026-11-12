package com.yourname.territorygrid.domain.usecase

import com.yourname.territorygrid.domain.model.ConeColor
import org.junit.Assert.assertEquals
import org.junit.Test

class CalculatePointsUseCaseTest {

    private val calculatePoints = CalculatePointsUseCase()

    @Test
    fun `scoring matches specification example Green plus 7 equals 22`() {
        val points = calculatePoints(cardRank = 7, coneColor = ConeColor.GREEN)
        assertEquals(22, points)
    }

    @Test
    fun `scoring calculates Ace with Red cone correctly`() {
        val points = calculatePoints(cardRank = 1, coneColor = ConeColor.RED)
        assertEquals(11, points) // 1 + 10
    }

    @Test
    fun `scoring calculates King with Yellow cone correctly`() {
        val points = calculatePoints(cardRank = 13, coneColor = ConeColor.YELLOW)
        assertEquals(25, points) // 13 + 12
    }

    @Test
    fun `scoring calculates King with Green cone correctly`() {
        val points = calculatePoints(cardRank = 13, coneColor = ConeColor.GREEN)
        assertEquals(28, points) // 13 + 15
    }

    @Test
    fun `scoring clamps out of range rank safely`() {
        val lowerClamped = calculatePoints(cardRank = -5, coneColor = ConeColor.RED)
        assertEquals(11, lowerClamped) // Clamped to 1 + 10

        val upperClamped = calculatePoints(cardRank = 20, coneColor = ConeColor.GREEN)
        assertEquals(28, upperClamped) // Clamped to 13 + 15
    }
}
