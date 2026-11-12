package com.yourname.territorygrid.data.mapper

import com.google.firebase.firestore.DocumentSnapshot
import com.yourname.territorygrid.domain.model.Clue

fun DocumentSnapshot.toClue(): Clue {
    return Clue(
        id = id,
        text = getString("text").orEmpty(),
        zoneId = getString("zoneId").orEmpty(),
        zoneLabel = getString("zoneLabel").orEmpty()
    )
}
