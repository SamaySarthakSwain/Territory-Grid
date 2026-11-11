# Territory Grid: Project Rules for AI Agents

## Product
Territory Grid is a real-time, team-based mobile scavenger hunt. One Android app, three roles chosen at login from `users/{uid}.role`:
- **ADMIN (Game Master)**: manages the game state and clock, registers teams, members and players, manages clues, watches the live leaderboard, can pause, reset or end the game, and can undo a wrong check-in.
- **MEMBER (Field Marshal)**: stationed at one checkpoint (`users.zoneId`). Selects the arriving team, the station's cone color, and the playing card the team drew. Submitting awards points and unlocks the team's next clue.
- **PLAYER (Competitor)**: live dashboard with score, rank, collected card inventory and the active clue.

## Scoring Formula
$$\text{points} = \text{cardRank} (\text{Ace}=1 \dots \text{King}=13) + \text{coneValue} (\text{RED}=10, \text{YELLOW}=12, \text{GREEN}=15)$$
*Example:* Green Cone + 7 = $15 + 7 = 22$ points. Highest total when the Admin ends the game wins.

## 1. Strict Stack
- **Language**: Kotlin
- **UI**: Jetpack Compose + Material 3, Dark theme only, Portrait only
- **Architecture**: MVVM, Navigation Compose, Coroutines + StateFlow (snapshot listeners via `callbackFlow`)
- **Dependency Injection**: Hilt (`AuthRepository` and `GameRepository` are singletons)
- **Backend**: Firebase SPARK plan only (Firebase Auth, Cloud Firestore). NO Cloud Functions, NO Blaze features, NO other backend.
- **Build System**: Version catalog (`gradle/libs.versions.toml`) with current stable, mutually compatible versions. `minSdk 26`, `targetSdk 34`/`35`.

## 2. Firestore Data Model
- `users/{uid}`: `name`, `email`, `role` (`ADMIN`|`MEMBER`|`PLAYER`), `teamId` (nullable), `zoneId` (nullable, members only), `createdAt`
- `teams/{teamId}`: `name`, `score`, `cards` (array of `{rank, suit, zoneId}`), `clueOrder` (array of clue IDs), `currentClueIndex`, `visitedZones` (array of zone IDs), `updatedAt`
- `clues/{clueId}`: `text`, `zoneId`, `zoneLabel`
- `game/state`: `status` (`LOBBY`|`MEMBER_PHASE`|`PLAYER_PHASE`|`PAUSED`|`ENDED`), `startedAt`, `endedAt`, `pausedAt` (nullable), `totalPausedMs`
- `checkins/{teamId_zoneId}`: `teamId`, `zoneId`, `memberId`, `cone` (`RED`|`YELLOW`|`GREEN`), `cardRank` (1..13), `cardSuit`, `points`, `timestamp`

## 3. Non-Negotiable Engineering Rules
1. **Atomic Scoring Batch**: Scoring write is ONE Firestore `WriteBatch`, NOT `runTransaction` (so it queues offline):
   - Create `checkins/{teamId_zoneId}` (deterministic ID blocks double scoring)
   - `FieldValue.increment(points)` on `teams.score`
   - `FieldValue.arrayUnion(cardMap)` on `teams.cards`
   - `FieldValue.arrayUnion(zoneId)` on `teams.visitedZones`
   - `FieldValue.increment(1)` on `teams.currentClueIndex`
   - Set `updatedAt`
   - Commit from an application-scoped coroutine.
   - Track each submission as `PENDING` (`hasPendingWrites`), `SYNCED`, or `FAILED` (with reason) by listening with metadata changes.
2. **Confirmation Dialog**: Always show a confirmation dialog (team, zone, cone, card, points) before submit.
3. **Offline Resilience**: Enable Firestore persistent offline cache. Show an `OfflineBanner` when disconnected and a `PendingSyncBadge` with the queued count. Keep last-known data visible.
4. **Secondary FirebaseApp for Admin**: Admin creates Member and Player accounts WITHOUT being signed out by using a secondary `FirebaseApp` instance for `createUserWithEmailAndPassword`, then signing that instance out, and writing `users/{uid}` with the Admin session.
5. **Deterministic Game Clock**: Game clock is derived strictly from `startedAt`, `totalPausedMs`, and `pausedAt` (server timestamps), surviving app restarts and incorrect device clocks.
6. **Scoped Listeners**: Players listen ONLY to their own active clue document (`clueOrder[currentClueIndex]`), never the entire clues collection. Listeners attach only while a screen is visible (`stateIn(SharingStarted.WhileSubscribed(5000))`). No GPS, no battery-draining background services.
7. **Clean Composable Boundaries**: No Firebase calls inside composables. ViewModels expose immutable `UiState`. Every screen handles loading, empty, error, and offline states.
8. **Tokens & Resources Only**: No hardcoded strings or colors. Use `strings.xml` and Compose theme tokens exclusively.
9. **File Protection**: Never delete or overwrite `google-services.json`, `local.properties`, or keystores.
10. **Git Discipline**: Never run `git push`. Commit to a branch per phase (`phase-N-name`) with small, clear messages (`feat:`, `fix:`, `chore:`). Merge to `main` locally after verification.
