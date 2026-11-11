package com.yourname.territorygrid.ui.member

import com.yourname.territorygrid.data.repository.AuthState
import com.yourname.territorygrid.data.repository.FakeAuthRepository
import com.yourname.territorygrid.data.repository.FakeCheckinRepository
import com.yourname.territorygrid.data.repository.FakeClueRepository
import com.yourname.territorygrid.data.repository.FakeGameRepository
import com.yourname.territorygrid.data.repository.FakeTeamRepository
import com.yourname.territorygrid.domain.model.Checkin
import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.ConeColor
import com.yourname.territorygrid.domain.model.GameStatus
import com.yourname.territorygrid.domain.model.PlayingCard
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.domain.model.SyncStatus
import com.yourname.territorygrid.domain.model.Team
import com.yourname.territorygrid.domain.model.UserProfile
import com.yourname.territorygrid.domain.usecase.CalculatePointsUseCase
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
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class MemberCheckinViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    private lateinit var fakeAuthRepo: FakeAuthRepository
    private lateinit var fakeGameRepo: FakeGameRepository
    private lateinit var fakeTeamRepo: FakeTeamRepository
    private lateinit var fakeClueRepo: FakeClueRepository
    private lateinit var fakeCheckinRepo: FakeCheckinRepository
    private lateinit var calculatePointsUseCase: CalculatePointsUseCase

    private lateinit var viewModel: MemberCheckinViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeAuthRepo = FakeAuthRepository()
        fakeGameRepo = FakeGameRepository()
        fakeTeamRepo = FakeTeamRepository()
        fakeClueRepo = FakeClueRepository()
        fakeCheckinRepo = FakeCheckinRepository()
        calculatePointsUseCase = CalculatePointsUseCase()

        // Set default game state to PLAYER_PHASE for testing scoring
        fakeGameRepo.setGameState(status = GameStatus.PLAYER_PHASE)

        // Set marshal user assigned to ZONE_02
        fakeAuthRepo.setAuthState(
            AuthState.SignedIn(
                UserProfile(
                    uid = "marshal_1",
                    email = "marshal@recon.grid",
                    name = "Marshal Alpha",
                    role = Role.MEMBER,
                    zoneId = "ZONE_02"
                )
            )
        )

        viewModel = MemberCheckinViewModel(
            authRepository = fakeAuthRepo,
            gameRepository = fakeGameRepo,
            teamRepository = fakeTeamRepo,
            clueRepository = fakeClueRepo,
            checkinRepository = fakeCheckinRepo,
            calculatePointsUseCase = calculatePointsUseCase
        )
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun kotlinx.coroutines.test.TestScope.startCollectingUiState() {
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect()
        }
    }

    @Test
    fun `initial state binds to assigned zone and calculates default points`() = runTest {
        startCollectingUiState()
        runCurrent()

        val state = viewModel.uiState.value
        assertEquals("ZONE_02", state.assignedZoneId)
        assertFalse(state.hasNoZoneAssigned)
        assertTrue(state.isPhaseAllowed)
        assertEquals(ConeColor.YELLOW, state.selectedCone)
        assertEquals(13, state.selectedCardRank)
        assertEquals(25, state.totalPointsToAward) // Yellow(12) + King(13) = 25
    }

    @Test
    fun `unassigned marshal blocks submission with clear reason`() = runTest {
        fakeAuthRepo.setAuthState(
            AuthState.SignedIn(
                UserProfile(
                    uid = "unassigned_marshal",
                    email = "lost@recon.grid",
                    name = "Lost Marshal",
                    role = Role.MEMBER,
                    zoneId = null
                )
            )
        )

        startCollectingUiState()
        runCurrent()

        val state = viewModel.uiState.value
        assertTrue(state.hasNoZoneAssigned)
        assertFalse(state.canSubmit)
        assertTrue(state.blockingReason!!.contains("No checkpoint zone assigned"))
    }

    @Test
    fun `game status outside PLAYER_PHASE blocks submission`() = runTest {
        fakeGameRepo.setGameState(status = GameStatus.MEMBER_PHASE)
        startCollectingUiState()
        runCurrent()

        val state = viewModel.uiState.value
        assertFalse(state.isPhaseAllowed)
        assertFalse(state.canSubmit)
        assertTrue(state.blockingReason!!.contains("Check-ins locked"))
    }

    @Test
    fun `team due at zone is validated and eligible for submission`() = runTest {
        startCollectingUiState()
        runCurrent()

        // Define clues: c1 -> ZONE_01, c2 -> ZONE_02
        fakeClueRepo.setClues(
            listOf(
                Clue(id = "c1", text = "Go to zone 1", zoneId = "ZONE_01", zoneLabel = "Zone 1"),
                Clue(id = "c2", text = "Go to zone 2", zoneId = "ZONE_02", zoneLabel = "Zone 2")
            )
        )

        // Team 1 is on clue index 1 which targets ZONE_02 (marshal's zone)
        val team1 = Team(
            id = "t1",
            name = "Team Alpha",
            score = 100,
            clueOrder = listOf("c1", "c2"),
            currentClueIndex = 1,
            visitedZones = listOf("ZONE_01"),
            isApproved = true
        )
        fakeTeamRepo.setTeams(listOf(team1))
        runCurrent()

        viewModel.onTeamSelected("t1")
        runCurrent()

        val state = viewModel.uiState.value
        assertEquals(TeamArrivalStatus.READY, state.arrivalStatus)
        assertTrue(state.canSubmit)
        assertNull(state.blockingReason)
    }

    @Test
    fun `team targeting different zone is marked NOT_DUE and blocks submission`() = runTest {
        startCollectingUiState()
        runCurrent()

        fakeClueRepo.setClues(
            listOf(
                Clue(id = "c1", text = "Go to zone 1", zoneId = "ZONE_01", zoneLabel = "Zone 1"),
                Clue(id = "c2", text = "Go to zone 2", zoneId = "ZONE_02", zoneLabel = "Zone 2")
            )
        )

        // Team 1 is on clue index 0 which targets ZONE_01 (NOT marshal's ZONE_02)
        val team1 = Team(
            id = "t1",
            name = "Team Beta",
            score = 0,
            clueOrder = listOf("c1", "c2"),
            currentClueIndex = 0,
            visitedZones = emptyList(),
            isApproved = true
        )
        fakeTeamRepo.setTeams(listOf(team1))
        runCurrent()

        viewModel.onTeamSelected("t1")
        runCurrent()

        val state = viewModel.uiState.value
        assertEquals(TeamArrivalStatus.NOT_DUE, state.arrivalStatus)
        assertFalse(state.canSubmit)
        assertTrue(state.blockingReason!!.contains("Arrival rejected"))
    }

    @Test
    fun `team already checked in at this zone is marked ALREADY_CHECKED_IN and blocks submission`() = runTest {
        startCollectingUiState()
        runCurrent()

        fakeClueRepo.setClues(
            listOf(
                Clue(id = "c2", text = "Go to zone 2", zoneId = "ZONE_02", zoneLabel = "Zone 2")
            )
        )

        val team1 = Team(
            id = "t1",
            name = "Team Gamma",
            score = 25,
            clueOrder = listOf("c2"),
            currentClueIndex = 0,
            visitedZones = listOf("ZONE_02"), // already visited!
            isApproved = true
        )
        fakeTeamRepo.setTeams(listOf(team1))
        runCurrent()

        viewModel.onTeamSelected("t1")
        runCurrent()

        val state = viewModel.uiState.value
        assertEquals(TeamArrivalStatus.ALREADY_CHECKED_IN, state.arrivalStatus)
        assertFalse(state.canSubmit)
        assertTrue(state.blockingReason!!.contains("already completed checkpoint"))
    }

    @Test
    fun `team finished all clues is marked FINISHED and blocks submission`() = runTest {
        startCollectingUiState()
        runCurrent()

        val team1 = Team(
            id = "t1",
            name = "Team Delta",
            score = 300,
            clueOrder = listOf("c1", "c2"),
            currentClueIndex = 2, // finished both
            visitedZones = listOf("ZONE_01", "ZONE_02"),
            isApproved = true
        )
        fakeTeamRepo.setTeams(listOf(team1))
        runCurrent()

        viewModel.onTeamSelected("t1")
        runCurrent()

        val state = viewModel.uiState.value
        assertEquals(TeamArrivalStatus.FINISHED, state.arrivalStatus)
        assertFalse(state.canSubmit)
        assertTrue(state.blockingReason!!.contains("completed all grid directives"))
    }

    @Test
    fun `team not approved by Game Master is marked NOT_APPROVED and blocks submission`() = runTest {
        startCollectingUiState()
        runCurrent()

        fakeClueRepo.setClues(
            listOf(
                Clue(id = "c2", text = "Go to zone 2", zoneId = "ZONE_02", zoneLabel = "Zone 2")
            )
        )

        val unapprovedTeam = Team(
            id = "t_pending",
            name = "Pending Squad",
            score = 0,
            clueOrder = listOf("c2"),
            currentClueIndex = 0,
            visitedZones = emptyList(),
            isApproved = false
        )
        fakeTeamRepo.setTeams(listOf(unapprovedTeam))
        runCurrent()

        viewModel.onTeamSelected("t_pending")
        runCurrent()

        val state = viewModel.uiState.value
        assertEquals(TeamArrivalStatus.NOT_APPROVED, state.arrivalStatus)
        assertFalse(state.canSubmit)
        assertTrue(state.blockingReason!!.contains("not yet approved"))
    }

    @Test
    fun `executeCheckin submits batch write and records points correctly`() = runTest {
        startCollectingUiState()
        runCurrent()

        fakeClueRepo.setClues(
            listOf(
                Clue(id = "c2", text = "Go to zone 2", zoneId = "ZONE_02", zoneLabel = "Zone 2")
            )
        )
        val team1 = Team(
            id = "t1",
            name = "Team Omega",
            score = 0,
            clueOrder = listOf("c2"),
            currentClueIndex = 0,
            visitedZones = emptyList(),
            isApproved = true
        )
        fakeTeamRepo.setTeams(listOf(team1))
        runCurrent()

        viewModel.onTeamSelected("t1")
        viewModel.onConeSelected(ConeColor.GREEN) // 15 pts
        viewModel.onCardRankSelected(7) // 7 pts (total 22 pts)
        viewModel.onCardSuitSelected("♦")
        runCurrent()

        assertEquals(22, viewModel.uiState.value.totalPointsToAward)

        viewModel.onRequestSubmit()
        runCurrent()
        assertTrue(viewModel.uiState.value.showConfirmDialog)

        viewModel.executeCheckin()
        runCurrent()

        assertFalse(viewModel.uiState.value.showConfirmDialog)
        assertTrue(viewModel.uiState.value.submissionSuccess)
        assertNotNull(viewModel.uiState.value.infoMessage)
        assertTrue(viewModel.uiState.value.infoMessage!!.contains("+22 PTS"))

        // Check repository recorded the submission
        val all = fakeCheckinRepo.allCheckins.value
        assertEquals(1, all.size)
        val recorded = all.first()
        assertEquals("t1", recorded.teamId)
        assertEquals("ZONE_02", recorded.zoneId)
        assertEquals(22, recorded.points)
        assertEquals("GREEN", recorded.cone)
        assertEquals(7, recorded.cardRank)
        assertEquals("♦", recorded.cardSuit)
    }

    @Test
    fun `dismissSubmission removes checkin from recent list`() = runTest {
        startCollectingUiState()
        runCurrent()

        val checkin = Checkin(
            teamId = "t1",
            zoneId = "ZONE_02",
            memberId = "mem1",
            cone = "RED",
            cardRank = 10,
            cardSuit = "♠",
            points = 20,
            syncStatus = SyncStatus.FAILED,
            failureReason = "Network offline"
        )
        fakeCheckinRepo.setCheckins(listOf(checkin))
        runCurrent()

        assertEquals(1, viewModel.uiState.value.recentSubmissions.size)

        viewModel.dismissSubmission(checkin.documentId)
        runCurrent()

        assertEquals(0, viewModel.uiState.value.recentSubmissions.size)
    }
}
