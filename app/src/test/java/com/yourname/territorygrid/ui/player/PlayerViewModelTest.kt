package com.yourname.territorygrid.ui.player

import com.google.firebase.Timestamp
import com.yourname.territorygrid.data.repository.AuthState
import com.yourname.territorygrid.data.repository.FakeAuthRepository
import com.yourname.territorygrid.data.repository.FakeClueRepository
import com.yourname.territorygrid.data.repository.FakeGameRepository
import com.yourname.territorygrid.data.repository.FakeTeamRepository
import com.yourname.territorygrid.domain.model.Clue
import com.yourname.territorygrid.domain.model.GameStatus
import com.yourname.territorygrid.domain.model.PlayingCard
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.domain.model.Team
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
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.util.Date

@OptIn(ExperimentalCoroutinesApi::class)
class PlayerViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    private lateinit var fakeAuthRepo: FakeAuthRepository
    private lateinit var fakeGameRepo: FakeGameRepository
    private lateinit var fakeTeamRepo: FakeTeamRepository
    private lateinit var fakeClueRepo: FakeClueRepository

    private lateinit var viewModel: PlayerViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeAuthRepo = FakeAuthRepository()
        fakeGameRepo = FakeGameRepository()
        fakeTeamRepo = FakeTeamRepository()
        fakeClueRepo = FakeClueRepository()

        // Set game state to PLAYER_PHASE by default
        fakeGameRepo.setGameState(status = GameStatus.PLAYER_PHASE)

        // Set player signed in to team_alpha
        fakeAuthRepo.setAuthState(
            AuthState.SignedIn(
                UserProfile(
                    uid = "player_1",
                    email = "player@recon.grid",
                    name = "Operative Nova",
                    role = Role.PLAYER,
                    teamId = "team_alpha"
                )
            )
        )

        viewModel = PlayerViewModel(
            authRepository = fakeAuthRepo,
            gameRepository = fakeGameRepo,
            teamRepository = fakeTeamRepo,
            clueRepository = fakeClueRepo
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
    fun `initial state binds to user team and calculates live rank`() = runTest {
        startCollectingUiState()
        runCurrent()

        val teamAlpha = Team(
            id = "team_alpha",
            name = "Team Alpha",
            score = 150,
            clueOrder = listOf("clue_1"),
            currentClueIndex = 0
        )
        val teamBeta = Team(
            id = "team_beta",
            name = "Team Beta",
            score = 200,
            clueOrder = listOf("clue_1"),
            currentClueIndex = 0
        )
        fakeTeamRepo.setTeams(listOf(teamAlpha, teamBeta))
        runCurrent()

        val state = viewModel.uiState.value
        assertNotNull(state.team)
        assertEquals("Team Alpha", state.team!!.name)
        assertEquals(2, state.userRank) // Team Beta has 200, Alpha has 150 -> Alpha is #2
        assertEquals(2, state.totalTeamsCount)
        assertFalse(state.hasNoTeamAssigned)
    }

    @Test
    fun `tie breaking gives higher rank to earlier updatedAt`() = runTest {
        startCollectingUiState()
        runCurrent()

        val timeEarlier = Timestamp(Date(1000000L))
        val timeLater = Timestamp(Date(2000000L))

        // Both have 150 pts, but team Alpha updated earlier than Beta
        val teamAlpha = Team(
            id = "team_alpha",
            name = "Team Alpha",
            score = 150,
            updatedAt = timeEarlier
        )
        val teamBeta = Team(
            id = "team_beta",
            name = "Team Beta",
            score = 150,
            updatedAt = timeLater
        )
        fakeTeamRepo.setTeams(listOf(teamBeta, teamAlpha))
        runCurrent()

        val state = viewModel.uiState.value
        assertEquals(1, state.userRank) // Alpha was earlier, so it takes rank #1
        val sorted = state.sortedTeams
        assertEquals("team_alpha", sorted[0].id)
        assertEquals("team_beta", sorted[1].id)
    }

    @Test
    fun `unassigned player reports hasNoTeamAssigned`() = runTest {
        fakeAuthRepo.setAuthState(
            AuthState.SignedIn(
                UserProfile(
                    uid = "unassigned_player",
                    email = "lone@recon.grid",
                    name = "Lone Wolf",
                    role = Role.PLAYER,
                    teamId = null
                )
            )
        )
        startCollectingUiState()
        runCurrent()

        val state = viewModel.uiState.value
        assertTrue(state.hasNoTeamAssigned)
        assertNull(state.team)
        assertEquals(0, state.userRank)
    }

    @Test
    fun `rule 6 player listens only to active clue document`() = runTest {
        startCollectingUiState()
        runCurrent()

        fakeClueRepo.setClues(
            listOf(
                Clue(id = "clue_1", text = "Seek the ancient oak.", zoneId = "Z1", zoneLabel = "Zone 1"),
                Clue(id = "clue_2", text = "Descend to the catacombs.", zoneId = "Z2", zoneLabel = "Zone 2")
            )
        )

        val teamAlpha = Team(
            id = "team_alpha",
            name = "Team Alpha",
            score = 50,
            clueOrder = listOf("clue_1", "clue_2"),
            currentClueIndex = 0
        )
        fakeTeamRepo.setTeams(listOf(teamAlpha))
        runCurrent()

        // Active clue should be clue_1
        var state = viewModel.uiState.value
        assertNotNull(state.activeClue)
        assertEquals("clue_1", state.activeClue!!.id)
        assertEquals("Seek the ancient oak.", state.activeClue!!.text)

        // Advance squad to clue_2 (e.g. after successful checkpoint checkin)
        fakeTeamRepo.setTeams(listOf(teamAlpha.copy(currentClueIndex = 1)))
        runCurrent()

        // Active clue listener updates to clue_2
        state = viewModel.uiState.value
        assertNotNull(state.activeClue)
        assertEquals("clue_2", state.activeClue!!.id)
        assertEquals("Descend to the catacombs.", state.activeClue!!.text)
    }

    @Test
    fun `score increase triggers plus N points celebration banner`() = runTest {
        startCollectingUiState()
        runCurrent()

        val teamAlpha = Team(
            id = "team_alpha",
            name = "Team Alpha",
            score = 100,
            clueOrder = listOf("clue_1"),
            currentClueIndex = 0
        )
        fakeTeamRepo.setTeams(listOf(teamAlpha))
        runCurrent()

        assertFalse(viewModel.uiState.value.showPointsDeltaBanner)

        // Score increases from 100 to 122 (+22 PTS)
        fakeTeamRepo.setTeams(listOf(teamAlpha.copy(score = 122)))
        runCurrent()

        val state = viewModel.uiState.value
        assertTrue(state.showPointsDeltaBanner)
        assertEquals(22, state.recentPointsDelta)

        // Dismiss banner
        viewModel.dismissPointsDelta()
        runCurrent()
        assertFalse(viewModel.uiState.value.showPointsDeltaBanner)
    }

    @Test
    fun `team completing all clues is marked as isAllCluesFinished`() = runTest {
        startCollectingUiState()
        runCurrent()

        val teamAlpha = Team(
            id = "team_alpha",
            name = "Team Alpha",
            score = 300,
            clueOrder = listOf("clue_1", "clue_2"),
            currentClueIndex = 2 // finished both!
        )
        fakeTeamRepo.setTeams(listOf(teamAlpha))
        runCurrent()

        val state = viewModel.uiState.value
        assertTrue(state.isAllCluesFinished)
    }

    @Test
    fun `cardsCollected calculates inventory count and total card points`() = runTest {
        startCollectingUiState()
        runCurrent()

        val cards = listOf(
            PlayingCard(rank = 10, suit = "♠", zoneId = "Z1"),
            PlayingCard(rank = 13, suit = "♥", zoneId = "Z2")
        )
        val teamAlpha = Team(
            id = "team_alpha",
            name = "Team Alpha",
            score = 150,
            cards = cards
        )
        fakeTeamRepo.setTeams(listOf(teamAlpha))
        runCurrent()

        val state = viewModel.uiState.value
        assertEquals(2, state.cardsCollected.size)
        assertEquals(23, state.totalPointsFromCards) // 10 + 13 = 23
    }
}
