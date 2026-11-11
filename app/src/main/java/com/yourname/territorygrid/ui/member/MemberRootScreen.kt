package com.yourname.territorygrid.ui.member

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.yourname.territorygrid.R
import com.yourname.territorygrid.domain.model.Role
import com.yourname.territorygrid.domain.model.UserProfile
import com.yourname.territorygrid.ui.components.GlassCard
import com.yourname.territorygrid.ui.components.HexGridBackground
import com.yourname.territorygrid.ui.components.NeonButton
import com.yourname.territorygrid.ui.components.NeonButtonVariant
import com.yourname.territorygrid.ui.components.TopHudBar
import com.yourname.territorygrid.ui.theme.TacticalColors

@Composable
fun MemberRootScreen(
    user: UserProfile,
    onSignOut: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(modifier = modifier.fillMaxSize()) {
        HexGridBackground(modifier = Modifier.fillMaxSize())

        Column(modifier = Modifier.fillMaxSize()) {
            TopHudBar(
                title = stringResource(R.string.field_marshal),
                subtitle = "Station Checkpoint",
                roleLabel = "MARSHAL",
                onProfileClick = onSignOut
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "STATION MARSHAL: ${user.name.ifBlank { user.email }}",
                            style = MaterialTheme.typography.labelMedium,
                            color = TacticalColors.ConeGreen,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "ASSIGNED ZONE: ${user.zoneId ?: "UNASSIGNED"}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TacticalColors.PrimaryContainer
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Field marshal arbitration link ready for Phase 4 scoring check-ins.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TacticalColors.TextSecondary
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        NeonButton(
                            text = stringResource(R.string.sign_out),
                            onClick = onSignOut,
                            variant = NeonButtonVariant.DANGER,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}
