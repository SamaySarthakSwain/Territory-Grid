package com.yourname.territorygrid.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider

private val TacticalColorScheme = darkColorScheme(
    primary = TacticalColors.Primary,
    onPrimary = TacticalColors.OnPrimary,
    primaryContainer = TacticalColors.PrimaryContainer,
    onPrimaryContainer = TacticalColors.OnPrimaryContainer,
    secondary = TacticalColors.Secondary,
    onSecondary = TacticalColors.OnSecondary,
    secondaryContainer = TacticalColors.SecondaryContainer,
    tertiary = TacticalColors.Tertiary,
    onTertiary = TacticalColors.OnTertiary,
    tertiaryContainer = TacticalColors.TertiaryContainer,
    background = TacticalColors.Background,
    onBackground = TacticalColors.OnSurface,
    surface = TacticalColors.Surface,
    onSurface = TacticalColors.OnSurface,
    surfaceVariant = TacticalColors.SurfaceHighest,
    onSurfaceVariant = TacticalColors.OnSurfaceVariant,
    outline = TacticalColors.Outline,
    outlineVariant = TacticalColors.OutlineVariant,
    error = TacticalColors.Error,
    onError = TacticalColors.OnError,
    errorContainer = TacticalColors.ErrorContainer
)

@Composable
fun TerritoryGridTheme(
    content: @Composable () -> Unit
) {
    // Strictly dark theme only per strict stack rule
    CompositionLocalProvider(LocalSpacing provides Spacing()) {
        MaterialTheme(
            colorScheme = TacticalColorScheme,
            typography = TacticalTypography,
            shapes = TacticalShapes,
            content = content
        )
    }
}
