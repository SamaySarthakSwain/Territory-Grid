# Territory Grid: System Architecture & Technical Specification

## 1. Package & File Hierarchy

```
com.yourname.territorygrid/
├── TerritoryGridApp.kt                  # Application class with @HiltAndroidApp, initializes offline cache
├── MainActivity.kt                      # Edge-to-edge root activity, sets Compose content & LockScreenOrientation
├── di/
│   ├── FirebaseModule.kt                # Provides FirebaseAuth, FirebaseFirestore, and SecondaryFirebaseApp
│   └── RepositoryModule.kt              # Binds repository implementations as singletons
├── domain/
│   ├── model/
│   │   ├── Role.kt                      # Enum: ADMIN, MEMBER, PLAYER
│   │   ├── GameState.kt                 # Game status enum, startedAt, endedAt, pausedAt, totalPausedMs
│   │   ├── UserProfile.kt               # Domain representation of users/{uid}
│   │   ├── Team.kt                      # Team entity with score, card deck, visited zones, and current clue
│   │   ├── Clue.kt                      # Clue entity (text, zoneId, zoneLabel)
│   │   ├── PlayingCard.kt               # Card model (rank 1..13, suit ♠ ♥ ♦ ♣, zoneId)
│   │   ├── ConeColor.kt                 # Cone enum: RED(10), YELLOW(12), GREEN(15)
│   │   ├── Checkin.kt                   # Recorded station check-in entity
│   │   └── SyncStatus.kt                # Submission sync state: PENDING, SYNCED, FAILED
│   └── usecase/
│       ├── CalculatePointsUseCase.kt    # Pure mathematical scoring logic: cardRank + coneValue
│       ├── ValidateCheckinUseCase.kt    # Validates team station matching, status, and duplicate barriers
│       └── DeriveGameClockUseCase.kt    # Server-timestamp resilient elapsed time derivation
├── data/
│   ├── mapper/
│   │   ├── UserMapper.kt                # Tolerant Firestore DocumentSnapshot -> UserProfile
│   │   ├── TeamMapper.kt                # Tolerant Firestore DocumentSnapshot -> Team
│   │   ├── ClueMapper.kt                # Tolerant Firestore DocumentSnapshot -> Clue
│   │   ├── GameStateMapper.kt           # Tolerant Firestore DocumentSnapshot -> GameState
│   │   └── CheckinMapper.kt             # Tolerant Firestore DocumentSnapshot -> Checkin
│   └── repository/
│       ├── AuthRepository.kt            # AuthRepository interface
│       ├── AuthRepositoryImpl.kt        # FirebaseAuth + users/{uid} listener with AuthState flow
│       ├── GameRepository.kt            # GameRepository interface
│       ├── GameRepositoryImpl.kt        # Real-time game/state listener and state transitions
│       ├── TeamRepository.kt            # TeamRepository interface
│       ├── TeamRepositoryImpl.kt        # Team CRUD, live leaderboard queries, and reset operations
│       ├── ClueRepository.kt            # ClueRepository interface
│       ├── ClueRepositoryImpl.kt        # Clue CRUD, clue ordering generation, and active clue fetch
│       ├── CheckinRepository.kt         # CheckinRepository interface
│       └── CheckinRepositoryImpl.kt     # Atomic WriteBatch scoring execution and recent submissions
├── ui/
│   ├── navigation/
│   │   ├── Screen.kt                    # Sealed route hierarchy with route names and argument keys
│   │   └── NavGraph.kt                  # NavHost declaration with role guards and startDestination
│   ├── theme/
│   │   ├── Color.kt                     # Tactical HUD palette tokens
│   │   ├── Type.kt                      # Space Grotesk and Inter typography definitions
│   │   ├── Shape.kt                     # Chamfered and rounded geometry
│   │   ├── Spacing.kt                   # 8pt layout spacing scale
│   │   └── Theme.kt                     # TerritoryGridTheme with LocalTacticalColors composition local
│   ├── components/
│   │   ├── NeonButton.kt                # Primary, Secondary, and Danger action buttons with glow
│   │   ├── GlassCard.kt                 # Translucent chamfered glassmorphic container
│   │   ├── GlowingScoreRing.kt          # Circular progress sweep and animated numerical counter
│   │   ├── HexGridBackground.kt         # Lightweight Canvas rendering cybernetic coordinate grid
│   │   ├── PlayingCardTile.kt           # Holographic playing card with 3D flip animation
│   │   ├── ConeChip.kt                  # Red, Yellow, Green beacon tiles with point badge
│   │   ├── StatusChip.kt                # Pulsing telemetry pill indicators
│   │   ├── NeonTextField.kt             # Tactical text input well with focus reticle
│   │   ├── TopHudBar.kt                 # Fixed status bar with role badge and connection telemetry
│   │   ├── BottomNavBar.kt              # Glowing multi-role bottom navigation dock
│   │   ├── OfflineBanner.kt             # Persistent offline mode indicator
│   │   ├── PendingSyncBadge.kt          # Badge showing count of uncommitted writes
│   │   ├── StateContainers.kt           # LoadingOverlay, ErrorState, EmptyState, ScanlineDivider
│   │   └── ConfirmDialog.kt             # Tactical modal dialog for critical actions
│   └── screens/
│       ├── splash/                      # Tactical initial gateway with auth state dispatch
│       ├── login/                       # Callsign & Access key authentication with role chips
│       ├── admin/                       # Control panel, Team management, User provisioning, Clues, Live
│       ├── member/                      # Field Marshal 3-step checkpoint validation and scoring
│       ├── player/                      # Hunt directive, Cards deck inventory, Live leaderboard
│       └── settings/                    # Sound, haptics, Lite mode toggle, and sign-out
└── util/
    ├── HapticFeedbackHelper.kt          # Vibration patterns for success, alert, and error
    ├── SoundFeedbackHelper.kt           # ToneGenerator audio cues
    └── CoroutineScopes.kt               # Application-scoped coroutine injection qualifier
```

---

## 2. Navigation Architecture & Role Routing

### 2.1 Route Definitions
- `Splash`: Initial routing destination. Evaluates `AuthRepository.authState`.
- `Login`: Credentials gateway. Supports tabbed role switching (`PLAYER`, `MEMBER`, `ADMIN`).
- `AdminRoot`: Nested graph containing `Control`, `Teams`, `People`, `Clues`, `Live`.
- `MemberRoot`: Field Marshal checkpoint logging and recent transmissions.
- `PlayerRoot`: Competitor dashboard containing `Hunt`, `Cards`, `Leaderboard`.
- `Settings`: Tactical preferences (Lite mode, sounds, haptics, sign out).

### 2.2 Route Guarding & Session Invalidation
```
                      ┌───────────────┐
                      │    Splash     │
                      └───────┬───────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
        [SignedOut / Error]            [SignedIn]
               │                             │
               ▼                             ▼
        ┌─────────────┐             Check users/{uid}.role
        │ LoginScreen │                      │
        └─────────────┘         ┌────────────┼────────────┐
                                ▼            ▼            ▼
                             [ADMIN]      [MEMBER]     [PLAYER]
                                │            │            │
                                ▼            ▼            ▼
                            AdminRoot    MemberRoot   PlayerRoot
```
- **Session Expired / Signed Out**: Auth listener immediately resets navigation back to `Login`, clearing backstack (`popUpTo(0)`).
- **Missing / Malformed User Document**: Triggers `AuthState.Error.NoUserDocument`, routing to an error screen with a clear prompt to contact the Game Master.
- **Role Elevation Tampering**: If `users/{uid}.role` changes dynamically, the app transitions automatically to the corresponding role root.

---

## 3. Screen UiState & ViewModel Architecture

| Screen | ViewModel | UiState Contract | User Actions / Events |
| :--- | :--- | :--- | :--- |
| **Login** | `LoginViewModel` | `LoginUiState(isLoading, email, password, selectedRole, errorMessage, isNetworkError)` | `OnEmailChanged`, `OnPasswordChanged`, `OnRoleSelected`, `OnSubmitLogin`, `OnJoinWithToken` |
| **Admin Control** | `AdminControlViewModel` | `AdminControlUiState(gameState, activeTeamsCount, totalPoints, activeZonesCount, liveClock, isPaused, isResetting)` | `OnPauseResumeClicked`, `OnResetTriggered`, `OnResetConfirmed`, `OnAdvancePhaseClicked`, `OnReshuffleClicked` |
| **Admin Teams & People** | `AdminPeopleViewModel` | `AdminPeopleUiState(teams, members, players, isRegistering, generatedPassword)` | `OnCreateTeam`, `OnCreateMember`, `OnCreatePlayer`, `OnDeleteUserDoc`, `OnShuffleClues` |
| **Member Check-in** | `MemberCheckinViewModel` | `MemberCheckinUiState(zoneId, zoneLabel, arrivedTeams, selectedTeam, selectedCone, selectedRank, selectedSuit, calculatedPoints, isSubmitting, recentSubmissions, validationError)` | `OnTeamSelected`, `OnConeSelected`, `OnRankSelected`, `OnSuitSelected`, `OnSubmitClicked`, `OnConfirmSubmit`, `OnRetrySubmission` |
| **Player Hunt** | `PlayerDashboardViewModel` | `PlayerUiState(team, rank, totalTeams, activeClue, nextConeColor, scoreDelta, recentCards, isGamePaused, isGameEnded)` | `OnRefreshClue`, `OnCardClicked`, `OnNavigateToMap` |
| **Live Leaderboard** | `LeaderboardViewModel` | `LeaderboardUiState(standings, filterTab, userTeamStanding, syncProgress, matchClock)` | `OnFilterTabChanged`, `OnTeamRowClicked` |

---

## 4. Repository Interfaces

```kotlin
interface AuthRepository {
    val authState: StateFlow<AuthState>
    suspend fun signIn(email: String, pass: String): Result<Unit>
    suspend fun signOut()
    suspend fun createAccountWithSecondaryApp(email: String, pass: String, role: Role, name: String, teamId: String?, zoneId: String?): Result<String>
}

interface GameRepository {
    val gameState: StateFlow<GameState>
    suspend fun updateGameStatus(status: GameStatus): Result<Unit>
    suspend fun pauseGame(): Result<Unit>
    suspend fun resumeGame(): Result<Unit>
    suspend fun resetGrid(): Result<Unit> // Batched deletes checkins and zeroes teams
}

interface TeamRepository {
    val teams: StateFlow<List<Team>>
    fun getTeam(teamId: String): Flow<Team?>
    suspend fun createTeam(name: String, clueOrder: List<String>): Result<String>
    suspend fun updateClueOrder(teamId: String, clueOrder: List<String>): Result<Unit>
}

interface ClueRepository {
    val clues: StateFlow<List<Clue>>
    fun getClue(clueId: String): Flow<Clue?>
    suspend fun createClue(text: String, zoneId: String, zoneLabel: String): Result<String>
    suspend fun updateClue(clue: Clue): Result<Unit>
    suspend fun deleteClue(clueId: String): Result<Unit>
}

interface CheckinRepository {
    val recentSubmissions: StateFlow<List<SubmissionRecord>>
    suspend fun submitCheckin(
        teamId: String,
        zoneId: String,
        memberId: String,
        cone: ConeColor,
        card: PlayingCard,
        points: Int
    ): Result<Unit>
    suspend fun undoCheckin(checkinId: String, teamId: String, points: Int, card: PlayingCard, zoneId: String): Result<Unit>
}
```

---

## 5. Firestore Listener Plan

To respect battery life, avoid excessive document reads on the Spark plan, and maintain strict role boundaries:
1. **Admin**:
   - Listens to `game/state` (always active in Admin).
   - Listens to `teams` collection (real-time leaderboard).
   - Listens to `clues` collection and `users` collection while in management tabs.
2. **Member (Field Marshal)**:
   - Listens to `game/state` (to verify game is in `PLAYER_PHASE`).
   - Listens to `teams` collection (to inspect arrived teams, check current clue index, and verify zone matching).
   - Listens to `checkins` created by own UID for the recent submissions feed.
3. **Player (Competitor)**:
   - Listens to `game/state` (to display waiting screen, paused overlay, or final game over).
   - Listens to own team document: `teams/{user.teamId}`.
   - Listens ONLY to active clue document: `clues/{team.clueOrder[team.currentClueIndex]}`. Detaches previous clue listener upon clue index change.
   - Listens to `teams` collection when on the Leaderboard tab.
4. **Lifecycle Scoping**:
   - Every repository flow is exposed to the UI via `stateIn(scope, SharingStarted.WhileSubscribed(5000), initialValue)`, ensuring snapshot listeners automatically detach 5 seconds after a screen goes to the background.

---

## 6. Offline-Safe Scoring Write Sequence

```
[Member taps Transmit]
       │
       ▼
[Validate locally: Game status == PLAYER_PHASE && Team is due at zoneId && Not already visited]
       │
       ▼
[Display Tactical Confirmation Dialog (Team, Zone, Cone, Card, Total Points)]
       │
       ▼
[Confirmed: Application-Scoped Coroutine initiates Firestore WriteBatch]
       │
       ├── 1. Set checkins/{teamId_zoneId} {
       │        teamId: "...",
       │        zoneId: "...",
       │        memberId: auth.uid,
       │        cone: "YELLOW",
       │        cardRank: 13,
       │        cardSuit: "SPADES",
       │        points: 25,
       │        timestamp: FieldValue.serverTimestamp()
       │      }
       │
       ├── 2. Update teams/{teamId} {
       │        score: FieldValue.increment(25),
       │        cards: FieldValue.arrayUnion({ rank: 13, suit: "SPADES", zoneId: "..." }),
       │        visitedZones: FieldValue.arrayUnion(zoneId),
       │        currentClueIndex: FieldValue.increment(1),
       │        updatedAt: FieldValue.serverTimestamp()
       │      }
       │
       ▼
[Commit WriteBatch]
       │
       ├─► [Network Connected]: Writes sync immediately to Firestore. Checkin snapshot marked SYNCED.
       │
       ├─► [Network Offline]: Firestore queues write in persistent local cache.
       │     - Checkin snapshot marked PENDING (hasPendingWrites = true).
       │     - UI shows PendingSyncBadge (+1).
       │     - Local optimistic UI updates immediately; player dashboard and leaderboard reflect new score locally.
       │
       └─► [Rejected by Security Rules / Server Error]:
             - Write batch rolls back.
             - Submission record updated to FAILED with error description.
             - UI displays Retry / Dismiss options.
```

---

## 7. Account Provisioning Without Admin Sign-Out

Because the Firebase Spark plan does not permit Cloud Functions, Admin account creation cannot rely on server triggers or Admin SDK service accounts on the device.
**Architectural Solution: Secondary `FirebaseApp`**:
1. When the Admin creates a Member or Player, initialize a secondary `FirebaseApp` instance in memory:
   ```kotlin
   val secondaryApp = FirebaseApp.initializeApp(context, FirebaseOptions.fromResource(context)!!, "SecondaryAdminAuth")
   val secondaryAuth = FirebaseAuth.getInstance(secondaryApp)
   ```
2. Call `secondaryAuth.createUserWithEmailAndPassword(email, tempPassword)`.
3. Capture the newly generated `uid`.
4. Immediately call `secondaryAuth.signOut()`, and delete the secondary instance:
   ```kotlin
   secondaryAuth.signOut()
   secondaryApp.delete()
   ```
5. Using the primary Admin session (`FirebaseFirestore.getInstance()`), create the document at `users/{newUid}` containing name, email, role, teamId, and zoneId.
6. The Admin remains continuously signed in without session disruption.

---

## 8. Edge-Case Matrix & System Defense

| Scenario | Risk | System Mitigation |
| :--- | :--- | :--- |
| **Duplicate Check-in** | Team attempts to scan at the same station twice | Deterministic document ID `checkins/{teamId_zoneId}`. If document already exists, the write batch fails, and UI displays *"Team has already logged this station."* |
| **Wrong Team / Out-of-Order** | Team arrives at Zone C while their active clue points to Zone B | Member UI inspects `team.clueOrder[team.currentClueIndex]`. If clue's `zoneId != member.zoneId`, dropdown highlights warning and blocks submit button. `firestore.rules` also rejects the batch. |
| **Game Paused Mid-Submit** | Admin pauses game while Member is entering card | Write batch submission checks `game/state.status == 'PLAYER_PHASE'`. If status is `PAUSED`, submission displays *"Game is currently paused by Game Master."* |
| **Team Finished All Clues** | Team completes final station in sequence | `currentClueIndex >= clueOrder.size`. Player screen transitions to *"All Objectives Cleared! Stand by for final standings."* Member UI blocks further check-ins. |
| **Member Without `zoneId`** | Misconfigured Field Marshal account | Member screen displays a full-screen blocking tactical alert: *"No Zone Assigned. Contact Game Master to assign a checkpoint sector."* |
| **User Without Role** | Uninitialized user document | Auth gate displays error state with immediate Sign-Out action. |
| **Concurrent Check-ins** | Two members attempt to score the same team simultaneously | Deterministic document ID prevents duplicate check-in. The second write batch encounters document collision or invalid index increment, rolling back safely. |
| **Incorrect Device Clock** | User's phone clock is skewed or manipulated | Game clock calculation uses **server timestamps exclusively** (`startedAt`, `totalPausedMs`, `pausedAt`). Device clock differences have zero effect on match timing. |
