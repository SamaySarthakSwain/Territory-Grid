package com.yourname.territorygrid.data.mapper

import com.google.firebase.firestore.DocumentSnapshot
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.domain.model.UserProfile

fun DocumentSnapshot.toUserProfile(): UserProfile {
    val roleStr = getString("role")
    val parsedRole = Role.fromString(roleStr) ?: Role.PLAYER

    return UserProfile(
        uid = id,
        name = getString("name").orEmpty(),
        email = getString("email").orEmpty(),
        role = parsedRole,
        teamId = getString("teamId"),
        zoneId = getString("zoneId"),
        createdAt = getTimestamp("createdAt")
    )
}
