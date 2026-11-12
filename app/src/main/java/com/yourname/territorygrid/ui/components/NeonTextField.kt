package com.yourname.territorygrid.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.yourname.territorygrid.ui.theme.TacticalColors
import com.yourname.territorygrid.ui.theme.TerritoryGridTheme

@Composable
fun NeonTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    hint: String = "",
    isError: Boolean = false,
    errorMessage: String? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    trailingIcon: (@Composable () -> Unit)? = null
) {
    var isFocused by remember { mutableStateOf(false) }

    val borderColor = when {
        isError -> TacticalColors.Error
        isFocused -> TacticalColors.PrimaryContainer
        else -> TacticalColors.OutlineVariant.copy(alpha = 0.5f)
    }

    val shape = RoundedCornerShape(8.dp)

    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = if (isFocused) TacticalColors.PrimaryContainer else TacticalColors.OnSurfaceVariant,
            modifier = Modifier.padding(bottom = 6.dp)
        )

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .drawBehind {
                    if (isFocused || isError) {
                        drawRoundRect(
                            color = borderColor.copy(alpha = 0.2f),
                            size = size,
                            style = Stroke(width = 6.dp.toPx())
                        )
                    }
                }
                .clip(shape)
                .background(TacticalColors.SurfaceLowest)
                .border(if (isFocused || isError) 1.5.dp else 1.dp, borderColor, shape)
                .onFocusChanged { isFocused = it.isFocused }
                .padding(horizontal = 14.dp, vertical = 14.dp)
        ) {
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                textStyle = MaterialTheme.typography.bodyLarge.copy(color = TacticalColors.OnSurface),
                cursorBrush = SolidColor(TacticalColors.PrimaryContainer),
                visualTransformation = visualTransformation,
                keyboardOptions = keyboardOptions,
                keyboardActions = keyboardActions,
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.CenterStart),
                decorationBox = { innerTextField ->
                    Box(modifier = Modifier.fillMaxWidth()) {
                        if (value.isEmpty()) {
                            Text(
                                text = hint,
                                style = MaterialTheme.typography.bodyLarge,
                                color = TacticalColors.Outline
                            )
                        }
                        innerTextField()
                    }
                }
            )

            trailingIcon?.let {
                Box(modifier = Modifier.align(Alignment.CenterEnd)) {
                    it()
                }
            }
        }

        if (isError && errorMessage != null) {
            Text(
                text = errorMessage,
                style = MaterialTheme.typography.bodySmall,
                color = TacticalColors.Error,
                modifier = Modifier.padding(top = 4.dp, start = 4.dp)
            )
        }
    }
}

@Preview
@Composable
fun NeonTextFieldPreview() {
    TerritoryGridTheme {
        NeonTextField(
            value = "Agent_Kestrel_09",
            onValueChange = {},
            label = "Tactical Callsign",
            hint = "Enter callsign"
        )
    }
}
