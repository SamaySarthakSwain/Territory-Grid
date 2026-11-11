# Territory Grid: Implementation Progress Tracker

## Setup Checklist
- [x] Create `AGENTS.md` with complete stack, data model, scoring, and 10 non-negotiable rules
- [x] Create `docs/PROGRESS.md` checklist
- [x] Extract and organize Stitch design assets into `design_refs/` and `assets/`
- [x] Verify toolchain (`java`, `gradlew`, `adb`, `git`, `node`, `firebase-tools`)
- [x] Create helper scripts in `scripts/` (`build`, `install_run`, `logs`, `shot`, `reset_app`) and `docs/DEV_LOOP.md`
- [x] Produce `docs/DESIGN_SPEC.md` from all PNGs, HTML, and design tokens
- [x] Produce `docs/ARCHITECTURE.md` with package tree, navigation, UiState, repositories, and edge cases
- [x] Present comprehensive plan and receive user approval

---

## Phase 1: Foundation
Branch: `phase-1-foundation`
- [x] Version catalog (`gradle/libs.versions.toml`) configuration
- [x] Root `build.gradle.kts` and `app/build.gradle.kts` setup with Hilt, Compose, Firebase, Navigation
- [x] Application class (`TerritoryGridApp`) with `@HiltAndroidApp`
- [x] `MainActivity` with edge-to-edge support and portrait lock
- [x] Tactical Dark Theme (`Color.kt`, `Type.kt`, `Shape.kt`, `Spacing.kt`, `Theme.kt`)
- [x] Typography bundling (Space Grotesk & Inter) in `res/font`
- [x] Core component library with `@Preview`:
  - [x] `NeonButton` (Primary, Secondary, Danger with haptic feedback)
  - [x] `GlassCard` (Luminescent glassmorphism, chamfered corners, subtle border stroke)
  - [x] `GlowingScoreRing` (Animated sweep and numeric counter)
  - [x] `HexGridBackground` (Lightweight Canvas, subtle coordinate motion)
  - [x] `PlayingCardTile` (Front, back, 3D flip animation)
  - [x] `ConeChip` (Red, Yellow, Green with score badge)
  - [x] `StatusChip` (Tactical telemetry status indicators)
  - [x] `NeonTextField` (Tactical cyber well with focus reticle)
  - [x] `TopHudBar` (Status telemetry, battery/wifi, role pill, profile)
  - [x] `BottomNavBar` (Hunt, Cards, Rank, Control with cyan neon indicator)
  - [x] `OfflineBanner` & `PendingSyncBadge`
  - [x] `LoadingOverlay`, `ErrorState`, `EmptyState`
  - [x] `ScanlineDivider`
  - [x] `ConfirmDialog`
- [x] Debug-only `ComponentGalleryScreen`
- [x] Build & preview verification (`./gradlew assembleDebug`)

---

## Phase 2: Data and Authentication
Branch: `phase-2-data-auth`
- [x] Domain models (`User`, `Team`, `Clue`, `GameState`, `Checkin`, `PlayingCard`, `ConeColor`, `Role`)
- [x] Pure `calculatePoints(cardRank, coneColor)` with comprehensive unit tests
- [x] Tolerant Firestore mappers (resilient to missing/null fields)
- [x] `FirebaseModule` (Hilt injection for FirebaseAuth, FirebaseFirestore with offline cache, secondary FirebaseApp)
- [x] `AuthRepository` with `AuthState` (`Loading`, `SignedOut`, `SignedIn`, `Error`) & live role change flow
- [x] `GameRepository` with StateFlow snapshot listeners
- [x] Role-based navigation graph with route guards and session invalidation handling
- [x] Tactical Splash screen with auto-routing
- [x] Login screen matching `design_refs/screens/login.png` with validation and cybernetic error messages
- [x] Unit tests for mappers and auth state logic

---

## Phase 3: Admin Panel
Branch: `phase-3-admin-control`
- [x] State machine transitions (`LOBBY` -> `MEMBER_PHASE` -> `PLAYER_PHASE` <-> `PAUSED` -> `ENDED`, Reset to `LOBBY`)
- [x] Server-timestamp driven mission clock with pause duration calculation
- [x] Reset Grid modal requiring typing `RESET`, batch deletes check-ins (≤400 per batch), zeroes team scores
- [x] Team CRUD operations
- [x] Clue order generator (randomized shuffle per team, starting station rotation, preview modal)
- [x] Account management via secondary `FirebaseApp` (create Member with `zoneId`, Player with `teamId`, strong password generator, clipboard copy)
- [x] Clue CRUD with duplicate zone warning
- [x] Live Leaderboard with score descending and tie-break by earliest `updatedAt`
- [x] Check-in history list with atomic Undo batch
- [x] Bottom navigation: Control, Teams, People, Clues, Live
- [x] Visual verification against `admin_panel.png`

---

## Phase 4: Member Check-in & Scoring
Branch: `phase-4-member-checkin`
- [x] Zone validation from `users.zoneId` (protective blocking banner if missing)
- [x] Step 1: Arrived team dropdown highlighting teams due at this zone; blocks invalid/finished/duplicate teams
- [x] Step 2: Cone color selector (Red +10, Yellow +12, Green +15)
- [x] Step 3: Card rank grid (A..K) + Suit selector (♠ ♥ ♦ ♣)
- [x] Dynamic points breakdown preview: `POINTS = CONE + CARD = TOTAL`
- [x] Submission allowed only in `PLAYER_PHASE`
- [x] Mandatory pre-flight Confirmation Dialog
- [x] Non-negotiable atomic WriteBatch execution
- [x] Application-scoped coroutine submission tracking (`PENDING`, `SYNCED`, `FAILED`)
- [x] Success burst animation, haptic confirmation, form auto-reset
- [x] Recent submissions feed with retry/dismiss actions
- [x] Unit tests for check-in validator and batch builder

---

## Phase 5: Player Experience
Branch: `phase-5-player-dashboard`
- [x] Player bottom navigation: Hunt, Cards, Leaderboard
- [x] **Hunt Screen**:
  - [x] Team header, live rank, active hunt zone
  - [x] `GlowingScoreRing` with animated score transitions
  - [x] Pulsing `Active Mission Directive` clue card
  - [x] Phase states: Lobby waiting, Member phase waiting, Paused overlay, Game ended screen, All clues completed
  - [x] `+N Points` celebration banner with haptic feedback
- [x] **Cards Screen**:
  - [x] Collected card deck grid with 3D flip-in presentation
- [x] **Leaderboard Screen**:
  - [x] Holographic podium (Gold #1, Silver #2, Bronze #3)
  - [x] Contender grid with delta trackers
  - [x] Pinned sticky bottom row highlighting user's team
- [x] Unit tests for rank calculations, tie breaks, and score deltas

---

## Phase 6: Firestore Security Rules & Hardening
Branch: `phase-6-security-rules`
- [x] Author strict `firestore.rules` enforcing least-privilege role boundaries
- [x] Atomic batch validation with `getAfter` verifying exact score and clue index increments
- [x] Anti-cheat protections: client score tampering, role escalation, premature check-ins, out-of-order clues
- [x] Automated security rules test suite (`@firebase/rules-unit-testing`)
- [x] Verification on Firebase Local Emulator Suite
- [x] Deployment configuration

---

## Phase 7: Polish, Performance & Accessibility
Branch: `phase-7-polish`
- [x] Smooth screen transitions and micro-interactions (<600ms)
- [x] GPU-efficient glow using `drawBehind` and layered translucent paths (zero `Modifier.blur`)
- [x] Haptic feedback and `ToneGenerator` audio cues gated by settings
- [x] Settings screen (Lite mode toggle, audio toggle, haptics toggle, sign-out, version display)
- [x] Lite mode (static background, disabled canvas animation for battery preservation)
- [x] Accessibility: WCAG AA color contrast, 48dp touch targets, dynamic type scaling up to 130%, explicit content descriptions
- [x] Portrait orientation lock and configuration change resilience (`rememberSaveable` / ViewModel state)
- [x] ProGuard / R8 rules for Hilt and Firebase serialization
- [x] Pixel-perfect visual comparison against Stitch PNGs

---

## Phase 8: QA & Release
Branch: `phase-8-qa-release`
- [x] Comprehensive test documentation (`docs/TEST_PLAN.md`)
- [x] Debug-only "Seed Demo Data" utility (4 teams, 10 clues, test accounts)
- [x] Game Master event execution manual (`docs/EVENT_SETUP.md`)
- [x] Admin Leaderboard text export via Android Sharesheet
- [x] End-to-end lint, static analysis, and test pass
- [x] Release APK assembly
