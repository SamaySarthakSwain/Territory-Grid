package com.yourname.territorygrid.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.yourname.territorygrid.data.repository.AuthRepository
import com.yourname.territorygrid.data.repository.AuthState
import com.yourname.territorygrid.data.settings.SettingsManager
import com.yourname.territorygrid.domain.model.UserProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val isLiteMode: Boolean = false,
    val isHapticsEnabled: Boolean = true,
    val isAudioEnabled: Boolean = true,
    val currentUser: UserProfile? = null,
    val version: String = "GRID PROTOCOL v1.0.0 // SPARKLIGHT"
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsManager: SettingsManager,
    private val authRepository: AuthRepository
) : ViewModel() {

    val uiState: StateFlow<SettingsUiState> = combine(
        settingsManager.isLiteMode,
        settingsManager.isHapticsEnabled,
        settingsManager.isAudioEnabled,
        authRepository.authState
    ) { lite, haptics, audio, authState ->
        val user = (authState as? AuthState.SignedIn)?.user
        SettingsUiState(
            isLiteMode = lite,
            isHapticsEnabled = haptics,
            isAudioEnabled = audio,
            currentUser = user
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = SettingsUiState()
    )

    fun toggleLiteMode(enabled: Boolean) {
        settingsManager.setLiteMode(enabled)
    }

    fun toggleHaptics(enabled: Boolean) {
        settingsManager.setHapticsEnabled(enabled)
    }

    fun toggleAudio(enabled: Boolean) {
        settingsManager.setAudioEnabled(enabled)
        if (enabled) {
            settingsManager.playTickTone()
        }
    }

    fun signOut(onComplete: () -> Unit) {
        viewModelScope.launch {
            authRepository.signOut()
            onComplete()
        }
    }
}
