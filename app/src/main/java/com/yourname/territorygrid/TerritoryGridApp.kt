package com.yourname.territorygrid

import android.app.Application
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreSettings
import com.google.firebase.firestore.PersistentCacheSettings
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class TerritoryGridApp : Application() {
    override fun onCreate() {
        super.onCreate()

        // Enable Firestore persistent offline cache per Non-Negotiable Rule 3
        try {
            val firestore = FirebaseFirestore.getInstance()
            val settings = FirebaseFirestoreSettings.Builder()
                .setLocalCacheSettings(PersistentCacheSettings.newBuilder().build())
                .build()
            firestore.firestoreSettings = settings
        } catch (_: Exception) {
            // Already initialized or running in test harness
        }
    }
}
