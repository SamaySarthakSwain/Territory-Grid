# Graph Report - Territory Grid  (2026-11-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1066 nodes · 2795 edges · 82 communities (31 shown, 51 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8d7927b9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 58
- Community 59
- Community 60
- Community 61
- Community 63
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70

## God Nodes (most connected - your core abstractions)
1. `AdminViewModel` - 63 edges
2. `Team` - 53 edges
3. `Clue` - 46 edges
4. `UserProfile` - 42 edges
5. `Checkin` - 36 edges
6. `Role` - 33 edges
7. `NeonButton()` - 33 edges
8. `TerritoryGridTheme()` - 33 edges
9. `GlassCard()` - 32 edges
10. `AuthRepository` - 29 edges

## Surprising Connections (you probably didn't know these)
- `SignedIn` --references--> `UserProfile`  [EXTRACTED]
  app/src/main/java/com/yourname/territorygrid/data/repository/AuthRepository.kt → app/src/main/java/com/yourname/territorygrid/domain/model/UserProfile.kt
- `CalculatePointsUseCaseTest` --calls--> `CalculatePointsUseCase`  [INFERRED]
  app/src/test/java/com/yourname/territorygrid/domain/usecase/CalculatePointsUseCaseTest.kt → app/src/main/java/com/yourname/territorygrid/domain/usecase/CalculatePointsUseCase.kt
- `TerritoryGridTheme()` --calls--> `Spacing`  [INFERRED]
  app/src/main/java/com/yourname/territorygrid/ui/theme/Theme.kt → app/src/main/java/com/yourname/territorygrid/ui/theme/Spacing.kt
- `ComponentGalleryScreen()` --calls--> `GlassCard()`  [INFERRED]
  app/src/main/java/com/yourname/territorygrid/ui/components/ComponentGalleryScreen.kt → app/src/main/java/com/yourname/territorygrid/ui/components/GlassCard.kt
- `ComponentGalleryScreen()` --calls--> `HexGridBackground()`  [INFERRED]
  app/src/main/java/com/yourname/territorygrid/ui/components/ComponentGalleryScreen.kt → app/src/main/java/com/yourname/territorygrid/ui/components/HexGridBackground.kt

## Import Cycles
- None detected.

## Communities (82 total, 51 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (5): NeonButtonVariant, DANGER, PRIMARY, SECONDARY, SUCCESS

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (24): LoginScreen(), PortalSelectionCard(), GlassCard(), GlassCardPreview(), HexGridBackground(), HexGridBackgroundPreview(), AlertBanner(), ConeTile() (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (5): ComponentGalleryScreen(), ComponentGalleryScreenPreview(), NeonTextField(), NeonTextFieldPreview(), TerritoryGridTheme()

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (3): SettingsManager, SettingsManagerImpl, SettingsModule

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (6): BeaconCone, GREEN, RED, YELLOW, ConeChip(), ConeChipPreview()

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (4): toClue(), ClueRepository, Clue, FakeClueRepository

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (9): toGameState(), GameState, GameStatus, ENDED, LOBBY, MEMBER_PHASE, PAUSED, PLAYER_PHASE (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (3): ConfirmDialog(), ConfirmDialogPreview(), ChamferedShape

### Community 10 - "Community 10"
Cohesion: 0.14
Nodes (16): PlayingCardTile(), PlayingCardTilePreview(), ActiveCardCipherSection(), ActiveMissionDirectiveCard(), CardsTabScreen(), CollectedDeckMiniLog(), HuntTabScreen(), LeaderboardRow() (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (22): author, bugs, url, dependencies, mongodb@^7.8.0, description, directories, doc (+14 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (3): NeonButtonPreview(), Quadruple, TacticalColors

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (7): toCheckin(), Checkin, SyncStatus, FAILED, PENDING, SYNCED, FakeCheckinRepository

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (9): AuthRepository, AuthState, Error, Loading, Network, NoRole, NoUserDocument, SignedIn (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (3): GlowingScoreRing(), GlowingScoreRingPreview(), TelemetryScoreHud()

### Community 25 - "Community 25"
Cohesion: 0.17
Nodes (3): toTeam(), CheckinRepository, PlayingCard

### Community 27 - "Community 27"
Cohesion: 0.39
Nodes (14): AddClueDialog(), AddTeamDialog(), AddUserDialog(), AdminRootScreen(), ClueOrderPreviewDialog(), CluesTabContent(), ControlTabContent(), FilterRoleChip() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (3): BottomNavBar(), BottomNavBarPreview(), BottomNavItem

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (9): toUserProfile(), Role, ADMIN, MEMBER, PLAYER, LoginScreenMode, PORTAL_CHOOSER, PORTAL_LOGIN (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (10): Team, MemberCheckinUiState, TeamArrivalStatus, ALREADY_CHECKED_IN, FINISHED, NONE_SELECTED, NOT_APPROVED, NOT_DUE (+2 more)

### Community 34 - "Community 34"
Cohesion: 0.16
Nodes (12): DATA_DIR, db, DB_FILE, fs, http, MIME_TYPES, parseBody(), path (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.24
Nodes (3): OfflineBanner(), OfflineBannerPreview(), PendingSyncBadge()

### Community 40 - "Community 40"
Cohesion: 0.36
Nodes (5): EmptyState(), ErrorState(), LoadingOverlay(), ScanlineDivider(), StateContainersPreview()

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (11): dependencies, description, devDependencies, @firebase/rules-unit-testing@^3.0.3, mocha@^10.7.3, name, scripts, test (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (6): DEFAULT_ADMIN, DEFAULT_CLUES, fs, memoryStore, path, url

### Community 47 - "Community 47"
Cohesion: 0.20
Nodes (9): author, description, keywords, license, main, name, scripts, start (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.25
Nodes (5): ConeColor, GREEN, RED, YELLOW, CalculatePointsUseCase

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (8): AdminRoot, Gallery, Login, MemberRoot, PlayerRoot, Screen, Settings, Splash

### Community 53 - "Community 53"
Cohesion: 0.25
Nodes (6): AdminTab, CLUES, CONTROL, LIVE, PEOPLE, TEAMS

### Community 54 - "Community 54"
Cohesion: 0.32
Nodes (6): PlayerTab, CARDS, HUNT, LEADERBOARD, PlayerUiState, TeamLeaderboardItem

### Community 56 - "Community 56"
Cohesion: 0.29
Nodes (4): fs, {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
}, path, RULES_PATH

### Community 63 - "Community 63"
Cohesion: 0.50
Nodes (3): cleanUrls, rewrites, version

## Knowledge Gaps
- **44 isolated node(s):** `Loading`, `Network`, `NoRole`, `NoUserDocument`, `SignedOut` (+39 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 309 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AdminViewModel` connect `Community 2` to `Community 64`, `Community 6`, `Community 72`, `Community 73`, `Community 12`, `Community 44`, `Community 15`, `Community 17`, `Community 51`, `Community 53`, `Community 25`, `Community 27`, `Community 29`, `Community 30`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **What connects `Loading`, `Network`, `NoRole` to the rest of the system?**
  _44 weakly-connected nodes found - possible missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04807017543859649 - nodes in this community are weakly interconnected._
- **Why does `UserProfile` connect `Community 21` to `Community 0`, `Community 1`, `Community 2`, `Community 10`, `Community 11`, `Community 12`, `Community 17`, `Community 18`, `Community 23`, `Community 24`, `Community 26`, `Community 27`, `Community 30`, `Community 31`, `Community 33`, `Community 46`, `Community 53`, `Community 54`, `Community 57`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0783744557329463 - nodes in this community are weakly interconnected._
- **Why does `Role` connect `Community 30` to `Community 0`, `Community 1`, `Community 2`, `Community 7`, `Community 11`, `Community 12`, `Community 17`, `Community 53`, `Community 21`, `Community 57`, `Community 26`, `Community 27`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05873015873015873 - nodes in this community are weakly interconnected._