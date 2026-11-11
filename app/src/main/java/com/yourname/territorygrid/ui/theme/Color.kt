package com.yourname.territorygrid.ui.theme

import androidx.compose.ui.graphics.Color

object TacticalColors {
    // Surfaces & Canvas
    val SurfaceLowest = Color(0xFF0A0E17)
    val Background = Color(0xFF0F131D)
    val SurfaceLow = Color(0xFF171C25)
    val Surface = Color(0xFF1B2029)
    val SurfaceHigh = Color(0xFF262A34)
    val SurfaceHighest = Color(0xFF31353F)
    val SurfaceBright = Color(0xFF353944)

    // Contrast text & borders
    val OnSurface = Color(0xFFDFE2F0)
    val OnSurfaceVariant = Color(0xFFBAC9CC)
    val Outline = Color(0xFF849396)
    val OutlineVariant = Color(0xFF3B494C)

    // Electric Cyan (Primary)
    val Primary = Color(0xFFC3F5FF)
    val PrimaryContainer = Color(0xFF00E5FF)
    val PrimaryFixedDim = Color(0xFF00DAF3)
    val OnPrimary = Color(0xFF00363D)
    val OnPrimaryContainer = Color(0xFF00626E)

    // Neon Magenta (Secondary & Alerts)
    val Secondary = Color(0xFFFFB0C9)
    val SecondaryContainer = Color(0xFFE1037D)
    val AlertMagenta = Color(0xFFFF2E93)
    val OnSecondary = Color(0xFF640034)

    // Tactical Green (Tertiary & Success)
    val Tertiary = Color(0xFFBAFFA2)
    val TertiaryContainer = Color(0xFF2CF100)
    val TacticalGreen = Color(0xFF39FF14)
    val OnTertiary = Color(0xFF053900)

    // Field Objective Beacon (Cone) Tones
    val ConeRed = Color(0xFFFF3B3B)
    val ConeRedGlow = Color(0xFFFF8A8A)
    val ConeYellow = Color(0xFFFFD600)
    val ConeYellowGlow = Color(0xFFFFF176)
    val ConeGreen = Color(0xFF00E676)
    val ConeGreenGlow = Color(0xFFB9F6CA)

    // Amber Warning & Danger Error
    val WarningAmber = Color(0xFFFFD600)
    val Error = Color(0xFFFFB4AB)
    val ErrorContainer = Color(0xFF93000A)
    val OnError = Color(0xFF690005)

    // Semantic Aliases for tactical readability
    val TextPrimary = OnSurface
    val TextSecondary = OnSurfaceVariant
    val PrimaryFixed = PrimaryFixedDim
    val SurfaceContainerLow = SurfaceLow
    val SurfaceContainerHigh = SurfaceHigh
    val SurfaceContainerHighest = SurfaceHighest
    val BorderSubtle = OutlineVariant
    val NeonCyan = PrimaryContainer
    val NeonGreen = TacticalGreen
    val NeonMagenta = SecondaryContainer
    val RedGlow = ConeRed
    val GoldAlert = WarningAmber
    val CardBorder = OutlineVariant
    val BackgroundDark = Background
}
