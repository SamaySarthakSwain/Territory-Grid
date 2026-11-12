package com.yourname.territorygrid.domain.model

import com.google.firebase.Timestamp

data class UserProfile(
    val uid: String = "",
    val name: String = "",
    val email: String = "",
    val role: Role = Role.PLAYER,
    val teamId: String? = null,
    val zoneId: String? = null,
    val createdAt: Timestamp? = null
)
