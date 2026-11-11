---
name: Neon Tactical HUD
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#171c25'
  surface-container: '#1b2029'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2f0'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#dfe2f0'
  inverse-on-surface: '#2c303b'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#ffb0c9'
  on-secondary: '#640034'
  secondary-container: '#e1037d'
  on-secondary-container: '#fffbff'
  tertiary: '#baffa2'
  on-tertiary: '#053900'
  tertiary-container: '#2cf100'
  on-tertiary-container: '#0e6800'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#ffd9e3'
  secondary-fixed-dim: '#ffb0c9'
  on-secondary-fixed: '#3e001e'
  on-secondary-fixed-variant: '#8e004c'
  tertiary-fixed: '#79ff5b'
  tertiary-fixed-dim: '#2ae500'
  on-tertiary-fixed: '#022100'
  on-tertiary-fixed-variant: '#095300'
  background: '#0f131d'
  on-background: '#dfe2f0'
  surface-variant: '#31353f'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: 0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.12em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system evokes high-stakes tactical reconnaissance, adrenaline-fueled competitive urgency, and precision digital instrumentation. Built for a real-time outdoor and campus scavenger hunt experience, the aesthetic fuses military command-post HUDs with cybernetic street play. Users navigate physical geography through a high-contrast augmented lens where territory control, glowing beacon retrieval, and cryptographic inventory management collide.

The visual style blends **Cyberpunk Glassmorphism** with **Futuristic Tactical Brutalism**:
- **Atmosphere:** Deep void space navy backdrop anchored by subtle hexagonal terrain coordinates and vector crosshairs.
- **Illumination:** Neon optical blooming, laser-etched strokes, glowing neon beacons (Red, Yellow, Green), and holographic inventory matrices.
- **Physicality:** Angled chamfers, tactical telemetry readouts, scan-line separators, and translucent armored panels that feel like handheld sci-fi field scanners.

## Colors

The palette operates in strict dark mode, establishing an obsidian tactical plane lit by focused luminescent wavelengths. High chromatic saturation is balanced by deep navy-black layers to prevent eye fatigue during night or bright outdoor conditions.

### Palette Architecture
- **Base Canvas:** Deep Space Navy (`#070B14`), layered with Surface Elev 1 (`#0D1527`) and Surface Elev 2 (`#152038`).
- **Primary Electric Cyan (`#00E5FF`):** Radar pings, active targeting brackets, tactical outlines, primary metrics, and biometric frames.
- **Secondary Neon Magenta (`#FF2E93`):** High-priority alerts, contested territory zones, rival team telemetry, and critical interactive overrides.
- **Success / Tactical Neon Green (`#39FF14`):** Node secured, mission complete, connection alive, positive score delta.
- **Warning Amber (`#FFB300`):** Proximity countdowns, time-decay triggers, high-value target objectives.

### Field Objective Beacon Tones
- **Red Beacon Target:** `#FF3B3B` with core glow `#FF8A8A`
- **Yellow Beacon Target:** `#FFD600` with core glow `#FFF176`
- **Green Beacon Target:** `#00E676` with core glow `#B9F6CA`

Hexagonal grid background lines must be drawn at `#00E5FF` at `0.06` opacity to retain legibility without visual noise.

## Typography

The typographic hierarchy distinguishes data capture from combat instructions.

- **Headings & Tactical Telemetry (Space Grotesk):** Engineered, angular, and authoritative. Used for titles, countdown meters, radar statuses, point banners, and tactical callouts. All uppercase for `label-*` and status readouts to evoke cockpit HUD consoles.
- **Narrative & System Instructions (Inter):** Highly legible across varied daylight and moving field conditions. Used for mission briefings, clue decoders, inventory descriptions, and real-time event logs.
- **Numeric Figures:** Space Grotesk numerals should use tabular alignment (`font-variant-numeric: tabular-nums`) across counters, scores, timer rings, and coordinates to prevent visual jitter during live updates.

## Layout & Spacing

The system enforces a dense, modular 4-column layout on mobile devices (scaling to 8 columns on tablets and 12 on field command screens) utilizing an 8pt spatial grid rhythm.

### Layout Mechanics
- **Canvas Margins:** Fixed `1rem` (16px) margins on mobile viewports to maximize live GPS map surface area and tactical touch targets.
- **Gutters:** Standardized `1rem` between telemetry panels and action docks.
- **Tactical Docking:** Bottom command bars (Home, Map, Leaderboard, Comms) and top status headers remain pinned with backdrop blurs, ensuring navigation and vital mission status are never obscured during fast locomotion.
- **Vertical Scannability:** Compact cards with strict internal vertical pacing (`space-sm` for metric-to-label, `space-md` between action groups).

## Elevation & Depth

Visual hierarchy does not rely on traditional drop shadows. Instead, it uses **Luminescent Glassmorphism** combined with **Backdrop Blur** and **Electroluminescent Border Tracing**.

- **Base Layer (Ground Zero):** Pitch space navy `#070B14` with a CSS SVG faint hex grid overlay.
- **Tier 1 - Sub-surface Containers:** `rgba(13, 21, 39, 0.75)` backdrop-filter blur `16px`, bordered by `1px solid rgba(0, 229, 255, 0.20)`.
- **Tier 2 - Active Mission Cards:** `rgba(21, 32, 56, 0.85)` backdrop-filter blur `24px`, bordered by `1px solid rgba(0, 229, 255, 0.50)` with an ambient outer glow `0 0 16px rgba(0, 229, 255, 0.25)`.
- **Tier 3 - Floating Modals & Critical Overlays:** `rgba(10, 16, 28, 0.95)`, edged with `1.5px solid #FF2E93` or `#39FF14`, accompanied by an outer radial bloom `0 0 24px rgba(255, 46, 147, 0.40)`.
- **Scan-Line Texture:** A repeating linear gradient `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 229, 255, 0.03) 3px, transparent 4px)` laid over telemetry panels to mimic terminal phosphor monitors.

## Shapes

The interface embraces a chamfered, sharp-precision tactical profile. Standard roundedness uses `roundedness: 1` (`0.25rem` / 4px corners for base inputs and small badges), while hero cards and panels leverage angled 45-degree chamfered cuts (using CSS `clip-path: polygon(...)`) to produce militarized cybernetic edges.

- **Primary Panel Corners:** 45-degree chamfer cuts of `8px` to `12px` on opposite diagonal corners (top-right and bottom-left) to simulate reinforced physical casing.
- **Pill Exceptions:** High-frequency status pills (`LIVE`, `ONLINE`, active team badges) use full capsules to preserve contrast against angular background containers.
- **Holographic Cards:** Precision 1px border lines with micro crosshair accents at the four vertices.

## Components

### Buttons & Interactive Controls
- **Primary Action (Deploy / Submit / Validate):** Chamfered edges, filled with neon green (`#39FF14`) or electric cyan (`#00E5FF`) linear gradients, dark monospace-styled bold text `#070B14`, accompanied by a persistent neon corona `box-shadow: 0 0 20px rgba(57, 255, 20, 0.45)`.
- **Secondary / Tactical Hold Action:** Translucent dark fill `rgba(0, 229, 255, 0.12)`, 1px neon cyan border, neon cyan typography. Active state triggers high-frequency pulse animation.
- **Emergency / Admin Intercept:** Neon magenta `#FF2E93` perimeter with pulsing warning glow.

### Beacon Selector Tiles (Cone Indicators)
- Three-state segmented matrix presenting Red (`#FF3B3B`), Yellow (`#FFD600`), and Green (`#00E676`) physical cones.
- Unselected: Dark fill, desaturated cone glyph, 1px border `rgba(255, 255, 255, 0.1)`.
- Selected: Intense luminous aura matched to the beacon color, `2px` high-contrast outer ring, score delta badge highlighted (`+10`, `+12`, `+15`).

### Holographic Playing Cards (Inventory System)
- Cybernetic playing card items (e.g., King of Spades, 7 of Hearts) set in frosted acrylic frames with glowing neon circuitry traces on the reverse side.
- Active card showcases illuminated cyan edge glow, subtle scanlines, suit pip rendered in chromatic neon, and reflective specular sheen.

### Progress & Telemetry Rings
- Circular animated SVGs showing capture radius and mission countdowns.
- Track in muted dark blue `#152038`; progress indicator rendered in `#00E5FF` or `#39FF14` with a radial light trail on the leading edge.

### Leaderboard & List Items
- Stacked glassmorphic strips separated by `1px` gradient scan-line dividers (`rgba(0, 229, 255, 0.2)` fading to transparent at ends).
- Rank 1-3 highlighted with cybernetic metallic accents: Gold (`#FFD600`), Silver (`#E0F7FA`), and Bronze (`#FF8A65`) glow frames.

### Input Fields & Search Vectors
- Dark navy wells `#0A101C` with recessed inset borders. Focus activates a `1px` electric cyan outline and subtle target reticle icons inside the input prefix.