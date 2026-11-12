package com.yourname.territorygrid.domain.model

data class PlayingCard(
    val rank: Int, // 1 (Ace) .. 13 (King)
    val suit: String, // SPADES, HEARTS, DIAMONDS, CLUBS
    val zoneId: String = ""
) {
    val rankDisplay: String
        get() = when (rank) {
            1 -> "A"
            11 -> "J"
            12 -> "Q"
            13 -> "K"
            else -> rank.toString()
        }

    val suitSymbol: String
        get() = when (suit.uppercase()) {
            "SPADES", "♠" -> "♠"
            "HEARTS", "♥" -> "♥"
            "DIAMONDS", "♦" -> "♦"
            "CLUBS", "♣" -> "♣"
            else -> "♠"
        }

    fun toMap(): Map<String, Any> = mapOf(
        "rank" to rank,
        "suit" to suit,
        "zoneId" to zoneId
    )

    companion object {
        fun fromMap(map: Map<String, Any?>): PlayingCard {
            val rankNum = (map["rank"] as? Number)?.toInt() ?: 1
            val suitStr = (map["suit"] as? String) ?: "SPADES"
            val zoneStr = (map["zoneId"] as? String) ?: ""
            return PlayingCard(rank = rankNum, suit = suitStr, zoneId = zoneStr)
        }
    }
}
