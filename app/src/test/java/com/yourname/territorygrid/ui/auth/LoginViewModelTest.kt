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
    fun `initial state is empty and default role is PLAYER`() {
        val state = viewModel.uiState.value
        assertEquals("", state.email)
        assertEquals("", state.pass)
        assertFalse(state.isPasswordVisible)
        assertEquals(Role.PLAYER, state.selectedRoleHint)
        assertEquals("HUNTER_FIELD", state.roleDescriptor)
        assertEquals("ENTER THE GRID", state.actionButtonLabel)
        assertFalse(state.isLoading)
        assertNull(state.errorMessage)
    }

    @Test
    fun `changing role updates descriptor and action label`() {
        viewModel.onRoleHintSelected(Role.MEMBER)
        assertEquals(Role.MEMBER, viewModel.uiState.value.selectedRoleHint)
        assertEquals("MARSHAL_LOG", viewModel.uiState.value.roleDescriptor)
        assertEquals("FIELD MARSHAL STATION", viewModel.uiState.value.actionButtonLabel)

        viewModel.onRoleHintSelected(Role.ADMIN)
        assertEquals(Role.ADMIN, viewModel.uiState.value.selectedRoleHint)
        assertEquals("CMD_OPERATOR", viewModel.uiState.value.roleDescriptor)
        assertEquals("COMMAND CONTROL ACCESS", viewModel.uiState.value.actionButtonLabel)
    }

    @Test
    fun `empty email or password shows validation error`() = runTest {
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
        viewModel.onEmailChanged("agent@recon.grid")
        viewModel.onPasswordChanged("12345")
        viewModel.submitLogin()

        val state = viewModel.uiState.value
        assertNotNull(state.errorMessage)
        assertTrue(state.errorMessage!!.contains("at least 6 characters"))
    }

    @Test
    fun `callsign alias without at symbol resolves to recon grid domain`() = runTest {
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
}
