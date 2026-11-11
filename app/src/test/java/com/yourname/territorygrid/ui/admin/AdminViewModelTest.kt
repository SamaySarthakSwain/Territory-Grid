package com.yourname.territorygrid.ui.admin

import com.yourname.territorygrid.data.repository.FakeAuthRepository
import com.yourname.territorygrid.data.repository.FakeCheckinRepository
import com.yourname.territorygrid.data.repository.FakeClueRepository
import com.yourname.territorygrid.data.repository.FakeGameRepository
import com.yourname.territorygrid.data.repository.FakeTeamRepository
import com.yourname.territorygrid.domain.model.Checkin
import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.GameStatus
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.domain.model.Team
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
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
class AdminViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    private lateinit var fakeGameRepository: FakeGameRepository
    private lateinit var fakeTeamRepository: FakeTeamRepository
    private lateinit var fakeAuthRepository: FakeAuthRepository
    private lateinit var fakeClueRepository: FakeClueRepository
    private lateinit var fakeCheckinRepository: FakeCheckinRepository
    private lateinit var viewModel: AdminViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeGameRepository = FakeGameRepository()
        fakeTeamRepository = FakeTeamRepository()
        fakeAuthRepository = FakeAuthRepository()
        fakeClueRepository = FakeClueRepository()
        fakeCheckinRepository = FakeCheckinRepository()

        viewModel = AdminViewModel(
            gameRepository = fakeGameRepository,
            teamRepository = fakeTeamRepository,
            authRepository = fakeAuthRepository,
            clueRepository = fakeClueRepository,
            checkinRepository = fakeCheckinRepository
        )
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun TestScope.startCollectingUiState() {
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) { viewModel.uiState.collect() }
    }

    @Test
    fun `initial state starts in LOBBY with CONTROL tab`() = runTest {
        startCollectingUiState()
        runCurrent()
        val state = viewModel.uiState.value
        assertEquals(AdminTab.CONTROL, state.currentTab)
        assertEquals(GameStatus.LOBBY, state.gameState.status)
        assertEquals(0, state.teams.size)
        assertEquals(0, state.totalPoints)
    }

    @Test
    fun `advanceGamePhase transitions LOBBY to MEMBER_PHASE to PLAYER_PHASE`() = runTest {
        startCollectingUiState()
        runCurrent()
        assertEquals(GameStatus.LOBBY, viewModel.uiState.value.gameState.status)

        viewModel.advanceGamePhase()
        runCurrent()
        assertEquals(GameStatus.MEMBER_PHASE, viewModel.uiState.value.gameState.status)

        viewModel.advanceGamePhase()
        runCurrent()
        assertEquals(GameStatus.PLAYER_PHASE, viewModel.uiState.value.gameState.status)
    }

    @Test
    fun `pause and resume game transitions state correctly`() = runTest {
        startCollectingUiState()
        runCurrent()

        viewModel.advanceGamePhase()
        runCurrent()
        viewModel.advanceGamePhase()
        runCurrent()
        assertEquals(GameStatus.PLAYER_PHASE, viewModel.uiState.value.gameState.status)

        viewModel.pauseGame()
        runCurrent()
        assertEquals(GameStatus.PAUSED, viewModel.uiState.value.gameState.status)

        viewModel.resumeGame()
        runCurrent()
        assertEquals(GameStatus.PLAYER_PHASE, viewModel.uiState.value.gameState.status)
    }

    @Test
    fun `reset grid requires typing RESET exactly`() = runTest {
        startCollectingUiState()
        runCurrent()

        viewModel.onResetInputChanged("WRONG")
        viewModel.executeResetGrid()
        runCurrent()

        assertNotNull(viewModel.uiState.value.errorMessage)
        assertTrue(viewModel.uiState.value.errorMessage!!.contains("Type RESET exactly"))

        viewModel.onResetInputChanged("RESET")
        viewModel.executeResetGrid()
        runCurrent()

        assertEquals(GameStatus.LOBBY, viewModel.uiState.value.gameState.status)
        assertNull(viewModel.uiState.value.errorMessage)
    }

    @Test
    fun `saveNewTeam registers team in repository`() = runTest {
        startCollectingUiState()
        runCurrent()

        viewModel.openAddTeamDialog(true)
        viewModel.onTeamNameChanged("Alpha Titans")
        viewModel.saveNewTeam()
        runCurrent()

        assertFalse(viewModel.uiState.value.showAddTeamDialog)
        val teams = fakeTeamRepository.teams.value
        assertEquals(1, teams.size)
        assertEquals("Alpha Titans", teams.first().name)
    }

    @Test
    fun `clue order generation previews rotated starting station per team`() = runTest {
        startCollectingUiState()
        runCurrent()

        fakeClueRepository.setClues(
            listOf(
                Clue(id = "c1", text = "Clue 1", zoneId = "Z1", zoneLabel = "Zone 1"),
                Clue(id = "c2", text = "Clue 2", zoneId = "Z2", zoneLabel = "Zone 2"),
                Clue(id = "c3", text = "Clue 3", zoneId = "Z3", zoneLabel = "Zone 3")
            )
        )
        fakeTeamRepository.setTeams(
            listOf(
                Team(id = "t1", name = "Team 1", score = 0, cards = emptyList(), clueOrder = emptyList(), currentClueIndex = 0, visitedZones = emptyList(), updatedAt = null),
                Team(id = "t2", name = "Team 2", score = 0, cards = emptyList(), clueOrder = emptyList(), currentClueIndex = 0, visitedZones = emptyList(), updatedAt = null)
            )
        )
        runCurrent()

        viewModel.previewClueOrderGeneration()
        runCurrent()

        val state = viewModel.uiState.value
        assertTrue(state.showClueOrderPreviewDialog)
        assertEquals(2, state.generatedClueOrdersPreview.size)

        viewModel.commitClueOrderGeneration()
        runCurrent()

        assertFalse(viewModel.uiState.value.showClueOrderPreviewDialog)
        assertEquals(2, fakeTeamRepository.teams.value.size)
        assertEquals(3, fakeTeamRepository.teams.value.first().clueOrder.size)
    }

    @Test
    fun `saveNewUser provisions operative via secondary app auth`() = runTest {
        startCollectingUiState()
        runCurrent()

        viewModel.openAddUserDialog(true, Role.MEMBER)
        viewModel.onNewUserNameChanged("Marshal Bob")
        viewModel.onNewUserEmailChanged("marshal.bob@recon.grid")
        viewModel.onNewUserPassChanged("SecurePass99#")
        viewModel.onNewUserZoneChanged("ZONE_04")
        viewModel.saveNewUser()
        runCurrent()

        assertFalse(viewModel.uiState.value.showAddUserDialog)
        assertNotNull(viewModel.uiState.value.infoMessage)
        assertTrue(viewModel.uiState.value.infoMessage!!.contains("provisioned successfully"))
    }

    @Test
    fun `undo checkin removes checkin from feed`() = runTest {
        startCollectingUiState()
        runCurrent()

        val checkin = Checkin(
            teamId = "team1",
            zoneId = "zone1",
            memberId = "mem1",
            cone = "GREEN",
            cardRank = 10,
            cardSuit = "♠",
            points = 25
        )
        fakeCheckinRepository.setCheckins(listOf(checkin))
        runCurrent()

        assertEquals(1, viewModel.uiState.value.checkins.size)

        viewModel.confirmUndoCheckin(checkin)
        viewModel.executeUndoCheckin()
        runCurrent()

        assertEquals(0, viewModel.uiState.value.checkins.size)
        assertNotNull(viewModel.uiState.value.infoMessage)
        assertTrue(viewModel.uiState.value.infoMessage!!.contains("Check-in undone"))
    }
}
