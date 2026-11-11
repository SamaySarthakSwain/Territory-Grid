# Territory Grid: Design Specification

This document is the definitive design system reference extracted from the Stitch HTML templates, CSS specifications, and visual assets (`design_refs/`).

---

## 1. Tactical Color Palette & Compose Tokens

The aesthetic is **Dark Neon Tactical HUD** (Cyberpunk Glassmorphism with Futuristic Tactical Brutalism). The environment is strictly dark mode.

### 1.1 Base Surfaces & Backgrounds
| Token Name | Hex Code | Compose Token | Description / Usage |
| :--- | :--- | :--- | :--- |
| `surface-lowest` | `#0A0E17` | `TacticalColors.SurfaceLowest` | Deepest recessed wells, input fields, terminal bg |
| `surface-dim` / `background` | `#0F131D` | `TacticalColors.Background` | Main application canvas backdrop |
| `surface-low` | `#171C25` | `TacticalColors.SurfaceLow` | Tier 1 container, sub-cards, list items |
| `surface-container` | `#1B2029` | `TacticalColors.Surface` | Standard panel background, modal containers |
| `surface-high` | `#262A34` | `TacticalColors.SurfaceHigh` | Tier 2 elevated mission card, active card deck |
| `surface-highest` | `#31353F` | `TacticalColors.SurfaceHighest` | Chip backgrounds, inactive tabs, borders |
| `surface-bright` | `#353944` | `TacticalColors.SurfaceBright` | Highlights, hover/pressed state overlays |

### 1.2 Neon Accent & Brand Tones
| Token Name | Hex Code | Compose Token | Description / Usage |
| :--- | :--- | :--- | :--- |
| `primary` | `#C3F5FF` | `TacticalColors.Primary` | High-contrast cyan text, hero display numbers |
| `primary-container` | `#00E5FF` | `TacticalColors.PrimaryContainer` | Electric cyan action buttons, glowing telemetry |
| `primary-fixed-dim` | `#00DAF3` | `TacticalColors.PrimaryFixedDim` | Ambient cyan glows, reticle accents, progress tracks |
| `on-primary` | `#00363D` | `TacticalColors.OnPrimary` | Dark text on cyan surfaces |
| `on-primary-container` | `#00626E` | `TacticalColors.OnPrimaryContainer` | Deep cyan icon fills |
| `secondary` | `#FFB0C9` | `TacticalColors.Secondary` | Hearts / Diamonds card suits, secondary badges |
| `secondary-container` | `#E1037D` | `TacticalColors.SecondaryContainer` | Magenta tactical alerts, cipher reshuffle trigger |
| `alert-magenta` | `#FF2E93` | `TacticalColors.AlertMagenta` | Contested territory, warning borders, join token btn |
| `on-secondary` | `#640034` | `TacticalColors.OnSecondary` | Dark text on magenta elements |
| `tertiary` | `#BAFFA2` | `TacticalColors.Tertiary` | Mission success text, verified indicators |
| `tertiary-container` | `#2CF100` | `TacticalColors.TertiaryContainer` | Neon tactical green submit button, pulse indicators |
| `tactical-green` | `#39FF14` | `TacticalColors.TacticalGreen` | Positive score deltas, live telemetry pings |
| `on-tertiary` | `#053900` | `TacticalColors.OnTertiary` | Dark text on green action buttons |
| `warning-amber` | `#FFD600` | `TacticalColors.WarningAmber` | Yellow cone, Active Clue mission cards, gold medal |
| `error` | `#FFB4AB` | `TacticalColors.Error` | Error text, danger badges |
| `error-container` | `#93000A` | `TacticalColors.ErrorContainer` | Reset Grid danger zone background |

### 1.3 Field Objective Beacon (Cone) Tones
| Beacon / Cone | Value | Base Hex | Core Glow Hex | Text/Pill Token |
| :--- | :--- | :--- | :--- | :--- |
| **RED CONE** | `+10 PTS` | `#FF3B3B` | `#FF8A8A` | `TacticalColors.ConeRed` |
| **YELLOW CONE** | `+12 PTS` | `#FFD600` | `#FFF176` | `TacticalColors.ConeYellow` |
| **GREEN CONE** | `+15 PTS` | `#00E676` | `#B9F6CA` | `TacticalColors.ConeGreen` |

### 1.4 Text & Telemetry Contrast
| Token Name | Hex Code | Compose Token | Description / Usage |
| :--- | :--- | :--- | :--- |
| `on-surface` | `#DFE2F0` | `TacticalColors.OnSurface` | Primary typography (titles, values, labels) |
| `on-surface-variant` | `#BAC9CC` | `TacticalColors.OnSurfaceVariant` | Secondary telemetry, unit labels (`PTS`, `ZONE`) |
| `outline` | `#849396` | `TacticalColors.Outline` | Subtle card borders, dividers |
| `outline-variant` | `#3B494C` | `TacticalColors.OutlineVariant` | Inset well borders, table lines |

---

## 2. Typography Scale

Dual typeface architecture:
- **Display, Headings & Numerical Telemetry**: `Space Grotesk` (Engineered, angular, tabular figures).
- **Narrative, Briefings & Form Controls**: `Inter` (Optimized legibility in outdoor daylight).

| Style Name | Typeface | Size | Weight | Line Height | Tracking | Transform |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `headline-xl` | Space Grotesk | 40sp | Bold (700) | 48sp | -0.02em | Tabular |
| `headline-xl-mobile` | Space Grotesk | 30sp | Bold (700) | 36sp | -0.01em | Tabular |
| `headline-lg` | Space Grotesk | 28sp | Bold (700) | 34sp | -0.01em | None |
| `headline-md` | Space Grotesk | 22sp | SemiBold (600) | 28sp | +0.01em | None |
| `headline-sm` | Space Grotesk | 18sp | SemiBold (600) | 24sp | +0.02em | Uppercase |
| `body-lg` | Inter | 16sp | Regular (400) | 24sp | 0.00em | Normal |
| `body-md` | Inter | 14sp | Regular (400) | 20sp | 0.00em | Normal |
| `body-sm` | Inter | 12sp | Regular (400) | 16sp | +0.01em | Normal |
| `label-lg` | Space Grotesk | 14sp | Bold (700) | 18sp | +0.08em | Uppercase |
| `label-md` | Space Grotesk | 12sp | SemiBold (600) | 16sp | +0.10em | Uppercase |
| `label-sm` | Space Grotesk | 10sp | SemiBold (600) | 14sp | +0.12em | Uppercase |

---

## 3. Shapes, Chamfers, and Elevation

### 3.1 Corner Radii & Chamfer Geometry
- **Standard Roundedness**:
  - `Small`: 4dp (`0.25rem`) – Tags, pills, chip indicators.
  - `Medium`: 8dp (`0.50rem`) – Form input fields, button corners.
  - `Large`: 12dp (`0.75rem`) – Glass panels, bottom sheet cards.
  - `Full`: 9999dp – Circular avatars, telemetry status capsules.
- **Tactical Chamfered Cuts (45°)**:
  - Top-Right and Bottom-Left corners cut at 10dp to produce an armored sci-fi console silhouette.
  - Implemented in Compose using a custom `ChamferedShape(cutSize = 10.dp)`.

### 3.2 Luminescent Glows (Zero `Modifier.blur`)
Per Rule 4, **never use `Modifier.blur`** for glow effects as it creates significant GPU pipeline thrashing on mobile hardware.
Instead, use `Modifier.drawBehind`:
1. Multi-layered translucent strokes drawn outside container bounds.
2. Stroke 1: Outer corona (12dp width, 10% alpha).
3. Stroke 2: Mid bloom (6dp width, 25% alpha).
4. Stroke 3: Core laser outline (1.5dp width, 80% alpha).

### 3.3 Hex-Grid Canvas Overlay
Background canvas uses procedural hexagonal math drawn in Compose Canvas:
- Hex width: 36dp, height: 62.35dp.
- Stroke: Electric cyan (`#00DAF3`) with dashed strokes (`dashPathEffect(floatArrayOf(4f, 8f))`) at **0.06 alpha**.
- Subtle slow vertical drift (offset modulated over time in standard mode, static in Lite mode).

---

## 4. Reusable Component Inventory & State Matrix

### 4.1 NeonButton
- **Primary Action** (Submit / Transmit / Advance): Neon green (`#2CF100`) or Electric Cyan (`#00E5FF`) linear fill, dark text `#070B14`, laser border with outer corona.
- **Secondary Action** (Pause / Manage / Inspect): Dark glass well `rgba(0, 229, 255, 0.12)`, 1px cyan border, cyan text.
- **Danger Action** (Reset Grid / Purge): Dark red well `rgba(255, 180, 171, 0.15)`, 1.5px magenta/red border, red text.
- **States**:
  - `Default`: Subtle ambient glow.
  - `Pressed`: Scale down to 98%, increase laser border brightness.
  - `Disabled`: Gray container `#171C25`, muted text `#849396`, zero glow.

### 4.2 GlassCard
- Translucent container with `SurfaceHigh` (85% alpha) + 1px cyan border at 30% alpha.
- Corner crosshair reticles on tactical inspection cards.
- Scanline gradient overlay at 3% opacity.

### 4.3 GlowingScoreRing
- 64dp x 64dp or 80dp x 80dp radial circular progress track.
- Background track: `#1B2029`.
- Indicator track: Electric cyan (`#00E5FF`) with animated sweep progress.
- Center icon: `bolt` or target icon; adjacent numeric display with tabular digits.

### 4.4 PlayingCardTile
- **Front**: Frosted cyber frame with suit pip (♠/♣ in `#00E5FF`, ♥/♦ in `#FFB0C9`), rank letter (`A`, `2`..`10`, `J`, `Q`, `K`), center holographic insignia, and dual inverted corner indices.
- **Back**: Holographic cyan circuit matrix pattern with glowing core.
- **Interactive States**: Selectable, active flip animation using `graphicsLayer` Y-axis rotation (0° to 180°).

### 4.5 ConeChip / BeaconSelector
- 3-tile grid representing **Red (+10)**, **Yellow (+12)**, **Green (+15)**.
- Unselected: Recessed well `#0A0E17`, desaturated glyph, 1px border.
- Selected: Outer glowing aura matching the beacon color, top-right check pill badge, highlighted points delta.

### 4.6 TopHudBar & BottomNavBar
- **Top HUD**: Fixed at top with safe-area padding. Shows app logo, role pill (`ADMIN`, `MARSHAL`, `PLAYER`), telemetry ping, wifi/battery indicators, profile action.
- **Bottom Nav**: 4 tabs with 24dp icons + uppercase 10sp labels:
  - Admin: `Control`, `Teams`, `People`, `Clues`, `Live`
  - Player: `Hunt`, `Cards`, `Rank`
  - Active tab: Illuminated in cyan (`#00E5FF`) with glowing underline indicator.

### 4.7 OfflineBanner & PendingSyncBadge
- **OfflineBanner**: Top sticky bar in Amber `#FFD600` with warning icon: *"OFFLINE CACHE ACTIVE — Submissions queued locally"*.
- **PendingSyncBadge**: Pulsing pill counter showing uncommitted Firestore writes (`hasPendingWrites`).

---

## 5. Screen-by-Screen Inventory

### Screen 1: Territory Grid Login (`login.png`)
1. **Telemetry Header**: `SYS.ONLINE // LAT:41.8902 LON:12.4922`, `GRID: ACTIVE`.
2. **Hero Identity**: Territory Grid logo inside corner reticle crosshairs, tagline *"Real-Time Scavenger Hunt Adventure"*.
3. **Gateway Terminal Card**:
   - `NODE_AUTH // GATEWAY_01` (Port 8443)
   - Role Quick-Selector: 3-column chip selector (`PLAYER`, `MARSHAL`, `ADMIN`).
   - Callsign Input (`NeonTextField`) with check verification indicator.
   - Access Key Input (`NeonTextField`) with password reveal toggle.
   - GPS Concourse auto-lock status pill (`Sector D // SYNCED`).
   - Primary Submit Button: `▶ ENTER THE GRID`.
   - Fast Deployment Squad Token row with `JOIN` button.
4. **Live Field Telemetry**: 3-metric strip (`Active Teams: 08`, `Field Cones: 14/14`, `Match Timer: 45:32`).

### Screen 2: Admin Control Panel (`admin_panel.png`)
1. **Top Command HUD**:
   - Status badge: `GAME IS LIVE! • Zone Alpha`.
   - Mission Elapsed Time (live digital clock `00:47:21`).
   - Action buttons: `Pause Ops` (yellow) & `Reset Grid` (red danger).
2. **Phase / Cipher Control Strip**:
   - Reshuffle / Advance Phase button (`Force Global Reshuffle` / `Advance Clue Phase`).
3. **Telemetry Metrics Grid**:
   - Teams Registered (`8`), Total Points (`1,286`), Active Zones (`3 / 4`).
4. **Live Grid Standings**:
   - Real-time team rows with Rank badge (#1 gold, #2 silver, #3 bronze), team name, points, and score progress track.
5. **Admin Deck**:
   - `Register Team` card & `Manage Field Marshals` card.
6. **Bottom Navigation**: `Hunt`, `Cards`, `Rank`, `Control` (Active).

### Screen 3: Field Marshal Checkpoint Log (`member_checkin.png`)
1. **Station Header**:
   - Field Marshal status card: Zone `SEC-04`, Logged `14/18`, Queue `2 Teams`, Latency `12ms`.
2. **Step 1: Arrived Team**:
   - Dropdown with GPS locked badge; highlights due teams; validates duplicate / wrong zone.
3. **Step 2: Cone Color**:
   - 3-state beacon selector: Red (+10), Yellow (+12), Green (+15).
4. **Step 3: Player Card**:
   - Central holographic dynamic card preview (King of Spades).
   - Suit buttons (♠ ♥ ♦ ♣) and Rank selector grid (A..K).
5. **Live Award Calculation**:
   - `12 + 13 = 25 PTS` calculation banner.
6. **Transmission Action**:
   - `Transmit & Unlock Next Clue` (Neon green high-contrast button).
7. **Recent Submissions Log**:
   - Mini feed with sync badges (`PENDING`, `SYNCED`, `FAILED`).

### Screen 4: Player Dashboard (`player_dashboard.png`)
1. **Team Status Bar**:
   - `Team Explorers`, `Active Hunt • Zone B`, `Rank #2 / 8`.
2. **Telemetry HUD**:
   - Score Ring HUD (148 Total Points, `+22 PTS` delta indicator, animated progress ring).
   - Inventory counter (`5 / 12` Cards).
3. **Active Mission Directive**:
   - Amber illuminated mission card with clue text (*"Locate the Yellow Beacon Cone..."*), target cone badge, and distance telemetry.
4. **Active Card Cipher & Inventory**:
   - Dynamic card cipher preview with 30s rotation indicator.
   - Horizontal scrolling collected cards deck with suit, rank, and holographic sheen.
5. **Mini Leaderboard Strip**:
   - Top 3 teams with user's team highlighted.

### Screen 5: Live Leaderboard (`leaderboard.png`)
1. **Match Status Header**:
   - `ALPHA-7 LIVE STANDINGS`, `SYNC: 100%`, Match Clock.
2. **Tactical Filter Tabs**:
   - `OVERALL`, `ZONES (3)`, `COMBOS`.
3. **Holographic Podium**:
   - #1 Gold Pedestal (Center, 124dp wide, laurel halo, trophy icon, Dominating badge).
   - #2 Silver Pedestal (Left, 108dp wide).
   - #3 Bronze Pedestal (Right, 108dp wide).
4. **Contender Grid (Pos 4-8)**:
   - Stacked glassmorphic rows with rank number, team name, last visited zone, delta points, and horizontal progress bar.
5. **Sticky User Team Footer**:
   - Floating row displaying user's team standing (`+24 pts ahead`, total score, quick `Radar` action).

---

## 6. Animations & Micro-Interactions

| Animation | Target | Duration | Easing | Spec |
| :--- | :--- | :--- | :--- | :--- |
| **Score Counter** | Total score text | 500ms | FastOutSlowIn | Animates integer from old to new value |
| **Score Ring Sweep** | Radial progress ring | 600ms | FastOutSlowIn | Smooth arc sweep upon score update |
| **Clue Pulse** | Active Clue card border | 2000ms loop | Linear / EaseInOut | Translucent stroke alpha pulses 0.3 to 0.8 |
| **Card Flip** | PlayingCardTile | 400ms | FastOutSlowIn | 3D Y-axis rotation with front/back swap at 90° |
| **Success Burst** | Transmit button / +Pts | 450ms | EaseOutBack | Scale pop + particle alpha fade |
| **Hex Background Drift** | Background canvas | 10000ms loop | Linear | Continuous vertical translation (disabled in Lite mode) |
