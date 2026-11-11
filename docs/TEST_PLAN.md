# Territory Grid // Tactical Verification & Test Plan (v1.0.0)

This comprehensive verification plan details the automated, manual, and security test matrices for **Territory Grid**, validating end-to-end functionality across all three operational roles (Admin, Field Marshal, Player) under live network and offline conditions.

---

## 1. Automated Test Suite Matrix

The automated test suite verifies core business logic, state machines, offline queuing, and data transformations without relying on live Firebase services or Android UI dependencies.

| Test Class | Focus Area | Key Invariants Verified |
| :--- | :--- | :--- |
| `CalculatePointsUseCaseTest` | Core Scoring Engine | • Cone values: RED = +10, YELLOW = +12, GREEN = +15<br>• Card ranks: ACE = 1 through KING = 13<br>• Combined scoring: Green + 7 = 22, Red + King = 23, Yellow + Ace = 13<br>• Boundary checks on invalid ranks / nulls |
| `LoginViewModelTest` | Auth Flow & Error Handling | • Form validation (email format, password min length)<br>• Error states for bad credentials, missing Firestore user docs, missing role<br>• Role-based routing triggers upon successful authentication |
| `AdminViewModelTest` | Game Master Control | • State transitions: `LOBBY` → `MEMBER_PHASE` → `PLAYER_PHASE` ↔ `PAUSED` → `ENDED`<br>• Reset Grid validation: rejects unless input string matches `"RESET"` exactly<br>• Mission clock calculation using server timestamps (`startedAt`, `totalPausedMs`, `pausedAt`)<br>• Clue order generator: rotates starting stations across teams to prevent clustering<br>• Live leaderboard ordering: score descending, tie-break by earliest `updatedAt`<br>• Undo check-in batch construction: decrements score, removes card & zone, decrements clue index |
| `MemberCheckinViewModelTest` | Field Marshal Station Operations | • Station assignment locking (`users.zoneId`)<br>• Team eligibility validation: marks teams due at this station (`isDueHere`), blocks duplicate check-ins, blocks finished teams<br>• Phase gating: blocks submission unless game is in `PLAYER_PHASE`<br>• Pre-flight confirm dialog state management<br>• Atomic `WriteBatch` creation with deterministic key `checkins/{teamId_zoneId}`<br>• Application-scoped coroutine submission lifecycle (`PENDING` → `SYNCED` / `FAILED`) |
| `PlayerViewModelTest` | Competitor Experience | • Rule 6 adherence: listens ONLY to active clue `clueOrder[currentClueIndex]`<br>• Score delta calculation: triggers `+N PTS` banner and haptics when score increases<br>• Phase overlay triggers: `LOBBY`, `MEMBER_PHASE`, `PAUSED`, `ENDED`, and Mission Completed<br>• Card deck breakdown (rank count, suit distribution, points from cards)<br>• Leaderboard rank calculation and current user team pinning |
| `SettingsViewModelTest` | Hardware & Preferences | • Toggle persistence (Lite Mode, Tactical Haptics, Audio Alerts)<br>• Sign-out invocation and session cleanup |

---

## 2. Role-Specific Manual Verification Matrix

### 2.1 Admin (Game Master) Verification

| Scenario | Steps to Execute | Expected Result |
| :--- | :--- | :--- |
| **Mission Phase Progression** | 1. From `LOBBY`, tap "ADVANCE TO MARSHAL PHASE"<br>2. Tap "LAUNCH LIVE HUNT (PLAYER PHASE)"<br>3. Tap "PAUSE OPS"<br>4. Tap "RESUME OPS"<br>5. Tap "END MISSION & FREEZE LEADERBOARD" | State transitions reflect instantly across all connected clients. Mission clock runs during `PLAYER_PHASE`, halts during `PAUSED`, and freezes at `ENDED`. |
| **Grid Reset Safety** | 1. Tap "RESET GRID"<br>2. Type "reset" (lowercase) or random characters<br>3. Type "RESET" (exact uppercase) and confirm | Dialog keeps confirm button disabled until exact string `"RESET"` is typed. Batched delete removes check-ins in chunks of ≤400 documents, zeroes team scores, resets clue indices, and reverts game state to `LOBBY`. |
| **Clue Order Generation** | 1. With ≥3 teams and ≥3 clues registered, tap "FORCE GLOBAL RESHUFFLE"<br>2. Inspect the preview dialog | Starting stations are rotated across teams so no two teams begin at the same station. Clue routes are randomized. |
| **Operative Provisioning** | 1. Navigate to People tab<br>2. Tap "Add User" → Select "FIELD MARSHAL"<br>3. Enter callsign, email, generate password, select Zone ID<br>4. Tap Save and verify Admin session | Field Marshal account is created in Firebase Auth using a secondary `FirebaseApp` instance (`SecondaryAdminAuth_*`). The Admin is **never** signed out. |
| **Check-in Undo Rollback** | 1. Navigate to Live tab<br>2. Locate an erroneous check-in submission in the feed<br>3. Tap the "UNDO" button and confirm dialog | In a single atomic batch: check-in document is deleted, team points are deducted, card is removed from inventory, zone is removed from visited list, and team's `currentClueIndex` is decremented. |
| **Standings Export** | 1. Navigate to Live tab<br>2. Tap "SHARE STANDINGS REPORT" | Android Sharesheet opens with formatted mission standings text, ready to broadcast via WhatsApp, Email, or Slack. |

---

### 2.2 Member (Field Marshal) Verification

| Scenario | Steps to Execute | Expected Result |
| :--- | :--- | :--- |
| **Zone Lockdown** | Sign in as a Member account without a `zoneId` assigned. | Screen displays full-screen warning: `"NO SECTOR ASSIGNED"`. All check-in controls are disabled until Admin assigns a `zoneId`. |
| **Team Eligibility Visuals** | Sign in as Member for `ZONE_01`. Open team dropdown. | • Teams whose active clue points to `ZONE_01` display a bright cyan `DUE HERE` indicator.<br>• Teams already checked in at `ZONE_01` display `COMPLETED` and submission is blocked.<br>• Teams that finished all clues display `FINISHED` and submission is blocked. |
| **Points Calculator Preview** | Select a team, choose Cone `YELLOW (+12)`, select Card `7 of Diamonds (+7)`. | Points readout dynamically displays: `"12 (YELLOW) + 7 (CARD) = 19 PTS"`. |
| **Phase Lockout** | Attempt to submit check-in while game is in `LOBBY`, `MEMBER_PHASE`, or `PAUSED`. | Submit button is disabled with tactical label: `"CHECK-IN LOCKED: [PHASE_NAME]"`. |
| **Pre-flight Confirmation** | Tap "CONFIRM CHECK-IN TRANSMISSION". | Dialog displays complete summary: Team name, Zone ID, Cone color, Card rank & suit, and Total Points. Submission requires explicit confirmation tap. |
| **Post-Submission Feedback** | Tap "EXECUTE TRANSMISSION" in confirmation dialog. | • Haptic tick and confirmation tone fire.<br>• Form resets immediately for the next arriving squad.<br>• Submission appears in Recent Submissions list with `PENDING` badge, transitioning to `SYNCED` upon server ack. |

---

### 2.3 Player (Competitor) Verification

| Scenario | Steps to Execute | Expected Result |
| :--- | :--- | :--- |
| **Pre-Game Lobby** | Sign in as Player while game is in `LOBBY` or `MEMBER_PHASE`. | Hunt screen shows `"PRE-MISSION BRIEFING"` with animated radar pulse. Clue directive is hidden until Game Master launches `PLAYER_PHASE`. |
| **Active Clue Isolation** | Inspect network traffic / Firestore listeners while viewing Hunt screen. | App attaches snapshot listener **only** to the active clue document ID (`clueOrder[currentClueIndex]`). It does **not** listen to the entire `clues` collection. |
| **Scoring Celebration** | Field Marshal submits check-in for the Player's team. | • `+N PTS` celebration banner animates into view.<br>• `GlowingScoreRing` sweeps to new score.<br>• Tactical victory haptic vibrates the device.<br>• Active clue transitions to the next assigned station in their route. |
| **Card Deck Presentation** | Navigate to Cards tab after receiving cards. | Collected playing cards are presented in a 3D tactical grid. Flipping animation reveals newly acquired cards. Breakdown displays total cards, suit distribution, and card point total. |
| **Podium & Sticky Rank** | Navigate to Leaderboard tab. | Top 3 teams appear on holographic Gold (#1), Silver (#2), and Bronze (#3) podiums. If user's team is outside top 3, a sticky bottom row displays their live position, score, and gap to first place. |

---

## 3. Offline & Network Resilience Matrix

| Scenario | Steps to Execute | Expected Result |
| :--- | :--- | :--- |
| **Connection Drop Detection** | Enable Airplane Mode while using the app. | `OfflineBanner` appears at top of screen: `"OFFLINE // CACHE ACTIVE"`. Data remains fully readable from Firestore persistent cache. |
| **Offline Check-in Queueing** | As Field Marshal in Airplane Mode, submit a valid check-in. | • Pre-flight dialog confirms normally.<br>• `WriteBatch` queues in local Firestore cache.<br>• Submission card shows amber `PENDING` badge with warning icon.<br>• Top HUD displays `PendingSyncBadge` with count `1`. |
| **Reconnection Auto-Sync** | Disable Airplane Mode and restore connectivity. | • Firestore background synchronization commits the queued `WriteBatch`.<br>• Status badge transitions from `PENDING` to green `SYNCED`.<br>• Team score and active clue update immediately on Player device. |
| **App Restart Offline** | Kill the app process while offline, then relaunch. | App boots seamlessly into cached session, displaying last-known standings, team score, and active clue without crashing or hanging on a white screen. |

---

## 4. Anti-Cheat & Firestore Security Rules Matrix

The `firestore.rules` file enforces least-privilege role-based access control and mathematical integrity on the Firebase server.

| Vulnerability / Attack Vector | Attack Simulation | Rules Defense Mechanism | Result |
| :--- | :--- | :--- | :--- |
| **Client Score Tampering** | Malicious client sends update to `teams/{teamId}` with `score = 99999` directly. | Rule requires that any update to `teams/{teamId}` must be accompanied by an atomic check-in write in the same batch, verified via `existsAfter(/databases/$(database)/documents/checkins/$(teamId_zoneId))` where points match `getAfter(...).data.points`. | **PERMISSION_DENIED** |
| **Premature Clue Peeking** | Player attempts to query `clues` collection or read clue documents other than their active index. | `match /clues/{clueId}` allows Player read **only** if `clueId == getTeam(playerTeamId).clueOrder[getTeam(playerTeamId).currentClueIndex]`. | **PERMISSION_DENIED** |
| **Double Scoring / Replay** | Member attempts to submit check-in for the same team at the same zone twice. | `checkins/{teamId_zoneId}` has deterministic document key. Rule specifies `allow create: if !exists(...)` and `allow update: if false`. Existing document cannot be overwritten. | **PERMISSION_DENIED** |
| **Role Escalation** | Signed-in Player attempts to write `role: "ADMIN"` to `users/{uid}`. | `match /users/{userId}` allows write only if `request.auth.token.role == 'ADMIN'` or user is Admin in Firestore. Non-admins cannot modify user documents. | **PERMISSION_DENIED** |
| **Phase Violation** | Member attempts to submit check-in while game status is `PAUSED` or `ENDED`. | Scoring rule enforces `get(/databases/$(database)/documents/game/state).data.status == 'PLAYER_PHASE'`. | **PERMISSION_DENIED** |
| **Impersonation** | Member assigned to `ZONE_01` attempts to score a check-in for `ZONE_02`. | Scoring rule verifies `checkin.zoneId == getUser(request.auth.uid).zoneId`. | **PERMISSION_DENIED** |

---

## 5. Build, Lint & Release Checklist

- [x] Version catalog dependencies up-to-date and mutually compatible.
- [x] Zero compilation warnings with all experimental Compose APIs opted in.
- [x] All 39+ unit tests passing (`./gradlew.bat test`).
- [x] ProGuard/R8 release minification verified (`./gradlew.bat assembleRelease`).
- [x] Zero hardcoded color literals; all tokens sourced from `TacticalColors`.
- [x] Zero hardcoded strings; all user-facing copy localized in `res/values/strings.xml`.
- [x] Strict portrait orientation locked via `AndroidManifest.xml`.
- [x] No `Modifier.blur` used anywhere in codebase (100% GPU-accelerated `drawBehind` neon glows).
