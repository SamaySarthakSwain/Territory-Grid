package com.yourname.territorygrid.ui.auth

import com.yourname.territorygrid.data.repository.FakeAuthRepository
import com.yourname.territorygrid.domain.model.Role
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var fakeAuthRepository: FakeAuthRepository
    private lateinit var viewModel: LoginViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeAuthRepository = FakeAuthRepository()
        viewModel = LoginViewModel(fakeAuthRepository)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial state is PORTAL_CHOOSER with no role selected`() {
        val state = viewModel.uiState.value
        assertEquals(LoginScreenMode.PORTAL_CHOOSER, state.mode)
        assertNull(state.selectedRole)
        assertEquals("", state.email)
        assertEquals("", state.pass)
        assertFalse(state.isPasswordVisible)
        assertFalse(state.isLoading)
        assertNull(state.errorMessage)
    }

    @Test
    fun `selectPortal transitions to PORTAL_LOGIN mode`() {
        viewModel.selectPortal(Role.PLAYER)
        val state = viewModel.uiState.value
        assertEquals(LoginScreenMode.PORTAL_LOGIN, state.mode)
        assertEquals(Role.PLAYER, state.selectedRole)
    }

    @Test
    fun `selectPortal ADMIN pre-fills samay credentials`() {
        viewModel.selectPortal(Role.ADMIN)
        val state = viewModel.uiState.value
        assertEquals(LoginScreenMode.PORTAL_LOGIN, state.mode)
        assertEquals(Role.ADMIN, state.selectedRole)
        assertEquals("samay", state.email)
        assertEquals("samay", state.pass)
    }

    @Test
    fun `selectPortal MEMBER does not pre-fill credentials`() {
        viewModel.selectPortal(Role.MEMBER)
        val state = viewModel.uiState.value
        assertEquals(Role.MEMBER, state.selectedRole)
        assertEquals("", state.email)
        assertEquals("", state.pass)
    }

    @Test
    fun `returnToPortalChooser transitions back to PORTAL_CHOOSER`() {
        viewModel.selectPortal(Role.PLAYER)
        viewModel.returnToPortalChooser()
        val state = viewModel.uiState.value
        assertEquals(LoginScreenMode.PORTAL_CHOOSER, state.mode)
        assertNull(state.selectedRole)
    }

    @Test
    fun `roleDescriptor reflects selected role`() {
        viewModel.selectPortal(Role.PLAYER)
        assertTrue(viewModel.uiState.value.roleDescriptor.contains("HUNTER"))

        viewModel.selectPortal(Role.MEMBER)
        assertTrue(viewModel.uiState.value.roleDescriptor.contains("MARSHAL"))

        viewModel.selectPortal(Role.ADMIN)
        assertTrue(viewModel.uiState.value.roleDescriptor.contains("CMD"))
    }

    @Test
    fun `empty email or password shows validation error`() = runTest {
        viewModel.selectPortal(Role.PLAYER)
        viewModel.onEmailChanged("")
        viewModel.onPasswordChanged("")
        viewModel.submitLogin()

        val state = viewModel.uiState.value
        assertNotNull(state.errorMessage)
        assertTrue(state.errorMessage!!.contains("Please enter both callsign and access key"))
        assertFalse(state.isLoading)
    }

    @Test
    fun `password less than 6 chars shows security error`() = runTest {
        viewModel.selectPortal(Role.PLAYER)
        viewModel.onEmailChanged("agent@recon.grid")
        viewModel.onPasswordChanged("12345")
        viewModel.submitLogin()

        val state = viewModel.uiState.value
        assertNotNull(state.errorMessage)
        assertTrue(state.errorMessage!!.contains("at least 6 characters"))
    }

    @Test
    fun `samay admin login skips password length check`() = runTest {
        viewModel.selectPortal(Role.ADMIN)
        // samay/samay are pre-filled by selectPortal, only 5 chars but allowed for admin
        viewModel.submitLogin()
        advanceUntilIdle()
        // Should attempt sign-in, not reject for password length
        // errorMessage should NOT be about "6 characters"
        val errorMsg = viewModel.uiState.value.errorMessage
        assertTrue(errorMsg == null || !errorMsg.contains("at least 6 characters"))
    }

    @Test
    fun `callsign alias without at symbol resolves to recon grid domain`() = runTest {
        viewModel.selectPortal(Role.PLAYER)
        viewModel.onEmailChanged("Agent_Kestrel")
        viewModel.onPasswordChanged("securePassword123")
        viewModel.submitLogin()

        advanceUntilIdle()

        assertEquals("Agent_Kestrel@recon.grid", fakeAuthRepository.lastSignedInEmail)
        assertEquals("securePassword123", fakeAuthRepository.lastSignedInPass)
        assertNull(viewModel.uiState.value.errorMessage)
        assertFalse(viewModel.uiState.value.isLoading)
    }

    @Test
    fun `failed login surfaces error message`() = runTest {
        fakeAuthRepository.signInResult = Result.failure(Exception("Custom auth failure"))

        viewModel.selectPortal(Role.PLAYER)
        viewModel.onEmailChanged("fail@grid.com")
        viewModel.onPasswordChanged("password123")
        viewModel.submitLogin()

        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertNotNull(state.errorMessage)
        assertTrue(state.errorMessage!!.contains("Custom auth failure"))
    }

    @Test
    fun `toggle password visibility flips boolean`() {
        assertFalse(viewModel.uiState.value.isPasswordVisible)
        viewModel.onTogglePasswordVisibility()
        assertTrue(viewModel.uiState.value.isPasswordVisible)
        viewModel.onTogglePasswordVisibility()
        assertFalse(viewModel.uiState.value.isPasswordVisible)
    }

    @Test
    fun `samay on non-admin portal shows access restriction error`() = runTest {
        viewModel.selectPortal(Role.PLAYER)
        viewModel.onEmailChanged("samay")
        viewModel.onPasswordChanged("samay")
        viewModel.submitLogin()

        val state = viewModel.uiState.value
        assertNotNull(state.errorMessage)
        assertTrue(state.errorMessage!!.contains("Admin Portal"))
    }
}
