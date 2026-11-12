package com.yourname.territorygrid.domain.model

enum class Role {
    ADMIN,
    MEMBER,
    PLAYER;

    companion object {
        fun fromString(value: String?): Role? = when (value?.uppercase()) {
            "ADMIN" -> ADMIN
            "MEMBER" -> MEMBER
            "PLAYER" -> PLAYER
            else -> null
        }
    }
}
