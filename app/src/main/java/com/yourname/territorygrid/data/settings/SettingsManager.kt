package com.yourname.territorygrid.data.settings

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

interface SettingsManager {
    val isLiteMode: StateFlow<Boolean>
    val isHapticsEnabled: StateFlow<Boolean>
    val isAudioEnabled: StateFlow<Boolean>
    fun setLiteMode(enabled: Boolean)
    fun setHapticsEnabled(enabled: Boolean)
    fun setAudioEnabled(enabled: Boolean)
    fun playSuccessTone()
    fun playAlertTone()
    fun playTickTone()
}

@Singleton
class SettingsManagerImpl @Inject constructor(
    @ApplicationContext private val context: Context
) : SettingsManager {
    private val prefs = context.getSharedPreferences("territory_grid_settings", Context.MODE_PRIVATE)

    private val _isLiteMode = MutableStateFlow(prefs.getBoolean(KEY_LITE_MODE, false))
    override val isLiteMode: StateFlow<Boolean> = _isLiteMode.asStateFlow()

    private val _isHapticsEnabled = MutableStateFlow(prefs.getBoolean(KEY_HAPTICS, true))
    override val isHapticsEnabled: StateFlow<Boolean> = _isHapticsEnabled.asStateFlow()

    private val _isAudioEnabled = MutableStateFlow(prefs.getBoolean(KEY_AUDIO, true))
    override val isAudioEnabled: StateFlow<Boolean> = _isAudioEnabled.asStateFlow()

    private var toneGenerator: ToneGenerator? = null

    init {
        try {
            toneGenerator = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
        } catch (_: Exception) {
            toneGenerator = null
        }
    }

    override fun setLiteMode(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_LITE_MODE, enabled).apply()
        _isLiteMode.value = enabled
    }

    override fun setHapticsEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_HAPTICS, enabled).apply()
        _isHapticsEnabled.value = enabled
    }

    override fun setAudioEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_AUDIO, enabled).apply()
        _isAudioEnabled.value = enabled
    }

    override fun playSuccessTone() {
        if (!_isAudioEnabled.value) return
        try {
            toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP2, 180)
        } catch (_: Exception) {}
    }

    override fun playAlertTone() {
        if (!_isAudioEnabled.value) return
        try {
            toneGenerator?.startTone(ToneGenerator.TONE_CDMA_ALERT_NETWORK_LITE, 250)
        } catch (_: Exception) {}
    }

    override fun playTickTone() {
        if (!_isAudioEnabled.value) return
        try {
            toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 80)
        } catch (_: Exception) {}
    }

    companion object {
        private const val KEY_LITE_MODE = "pref_lite_mode"
        private const val KEY_HAPTICS = "pref_haptics"
        private const val KEY_AUDIO = "pref_audio"
    }
}

@Module
@InstallIn(SingletonComponent::class)
abstract class SettingsModule {
    @Binds
    @Singleton
    abstract fun bindSettingsManager(impl: SettingsManagerImpl): SettingsManager
}
