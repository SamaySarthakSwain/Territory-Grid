package com.yourname.territorygrid.domain.model

enum class ConeColor(val points: Int) {
    RED(10),
    YELLOW(12),
    GREEN(15);

    companion object {
        fun fromString(value: String?): ConeColor = when (value?.uppercase()) {
            "RED" -> RED
            "YELLOW" -> YELLOW
            "GREEN" -> GREEN
            else -> YELLOW
        }
    }
}
