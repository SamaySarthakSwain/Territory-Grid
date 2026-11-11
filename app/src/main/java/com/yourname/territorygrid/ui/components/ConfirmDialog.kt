package com.yourname.territorygrid.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.yourname.territorygrid.ui.theme.ChamferedShape
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme

@Composable
fun ConfirmDialog(
    title: String,
    message: String,
    confirmText: String = "Confirm",
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
    isDanger: Boolean = false,
    iconColor: Color = if (isDanger) TacticalColors.Error else TacticalColors.PrimaryContainer
) {
    Dialog(onDismissRequest = onDismiss) {
        val shape = ChamferedShape(cutSize = 12.dp)
        val borderColor = if (isDanger) TacticalColors.Error else TacticalColors.PrimaryContainer

        Box(
            modifier = modifier
                .fillMaxWidth()
                .clip(shape)
                .background(TacticalColors.SurfaceHigh)
                .border(BorderStroke(1.5.dp, borderColor.copy(alpha = 0.6f)), shape)
                .padding(20.dp)
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(iconColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = null,
                        tint = iconColor,
                        modifier = Modifier.size(28.dp)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = title.uppercase(),
                    style = MaterialTheme.typography.headlineSmall,
                    color = TacticalColors.OnSurface
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = message,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TacticalColors.OnSurfaceVariant
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    NeonButton(
                        text = "CANCEL",
                        onClick = onDismiss,
                        variant = NeonButtonVariant.SECONDARY,
                        modifier = Modifier.weight(1f)
                    )

                    NeonButton(
                        text = confirmText.uppercase(),
                        onClick = onConfirm,
                        variant = if (isDanger) NeonButtonVariant.DANGER else NeonButtonVariant.SUCCESS,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Preview
@Composable
fun ConfirmDialogPreview() {
    TerritoryGridTheme {
        ConfirmDialog(
            title = "Authorize Grid Reset?",
            message = "This will invalidate all checkpoint caches and recalculate scores to zero.",
            confirmText = "Purge Grid",
            onConfirm = {},
            onDismiss = {},
            isDanger = true
        )
    }
}
