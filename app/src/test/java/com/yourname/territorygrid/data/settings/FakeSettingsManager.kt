package com.yourname.territorygrid.data.settings

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class FakeSettingsManager : SettingsManager {
    private val _isLiteMode = MutableStateFlow(false)
    override val isLiteMode: StateFlow<Boolean> = _isLiteMode.asStateFlow()

    private val _isHapticsEnabled = MutableStateFlow(true)
    override val isHapticsEnabled: StateFlow<Boolean> = _isHapticsEnabled.asStateFlow()

    private val _isAudioEnabled = MutableStateFlow(true)
    override val isAudioEnabled: StateFlow<Boolean> = _isAudioEnabled.asStateFlow()

    var lastPlayedTone: String? = null

    override fun setLiteMode(enabled: Boolean) {
        _isLiteMode.value = enabled
    }

    override fun setHapticsEnabled(enabled: Boolean) {
        _isHapticsEnabled.value = enabled
    }

    override fun setAudioEnabled(enabled: Boolean) {
        _isAudioEnabled.value = enabled
    }

    override fun playSuccessTone() {
        lastPlayedTone = "SUCCESS"
    }

    override fun playAlertTone() {
        lastPlayedTone = "ALERT"
    }

    override fun playTickTone() {
        lastPlayedTone = "TICK"
    }
}
