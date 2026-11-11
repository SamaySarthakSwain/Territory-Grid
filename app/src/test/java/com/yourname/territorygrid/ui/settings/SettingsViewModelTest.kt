package com.yourname.territorygrid.ui.settings

import com.yourname.territorygrid.data.repository.AuthState
import com.yourname.territorygrid.data.repository.FakeAuthRepository
import com.yourname.territorygrid.data.settings.FakeSettingsManager
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.domain.model.UserProfile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SettingsViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var fakeAuthRepo: FakeAuthRepository
    private lateinit var fakeSettingsManager: FakeSettingsManager
    private lateinit var viewModel: SettingsViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeAuthRepo = FakeAuthRepository()
        fakeSettingsManager = FakeSettingsManager()

        fakeAuthRepo.setAuthState(
            AuthState.SignedIn(
                UserProfile(
                    uid = "admin_user",
                    email = "admin@recon.grid",
                    name = "Master Admin",
                    role = Role.ADMIN
                )
            )
        )

        viewModel = SettingsViewModel(
            settingsManager = fakeSettingsManager,
            authRepository = fakeAuthRepo
        )
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial state binds to user profile and defaults`() = runTest {
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect()
        }
        runCurrent()

        val state = viewModel.uiState.value
        assertNotNull(state.currentUser)
        assertEquals("Master Admin", state.currentUser!!.name)
        assertFalse(state.isLiteMode)
        assertTrue(state.isHapticsEnabled)
        assertTrue(state.isAudioEnabled)
    }

    @Test
    fun `toggle switches update state`() = runTest {
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect()
        }
        runCurrent()

        viewModel.toggleLiteMode(true)
        runCurrent()
        assertTrue(viewModel.uiState.value.isLiteMode)

        viewModel.toggleHaptics(false)
        runCurrent()
        assertFalse(viewModel.uiState.value.isHapticsEnabled)

        viewModel.toggleAudio(false)
        runCurrent()
        assertFalse(viewModel.uiState.value.isAudioEnabled)
    }

    @Test
    fun `signOut triggers auth signout and callback`() = runTest {
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect()
        }
        runCurrent()

        var callbackInvoked = false
        viewModel.signOut { callbackInvoked = true }
        runCurrent()

        assertTrue(callbackInvoked)
        assertEquals(AuthState.SignedOut, fakeAuthRepo.authState.value)
    }
}
