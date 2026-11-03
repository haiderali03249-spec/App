package com.haider.offline.messaging.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

val DeepNavy = Color(0xFF060B18)
val ElectricBlue = Color(0xFF0066FF)
val LuminousCyan = Color(0xFF00D2FF)
val NeonPurple = Color(0xFF8B5CF6)
val FrostedWhite = Color(0x1AFFFFFF)
val GlassBorder = Color(0x26FFFFFF)

fun Modifier.liquidGlass(
    radiusDp: Int = 20,
    borderAlpha: Float = 0.15f
) = this
    .background(
        brush = Brush.verticalGradient(
            colors = listOf(
                Color(0x1AFFFFFF),
                Color(0x0AFFFFFF)
            )
        ),
        shape = RoundedCornerShape(radiusDp.dp)
    )
    .border(
        width = 1.dp,
        brush = Brush.linearGradient(
            colors = listOf(
                Color.White.copy(alpha = borderAlpha),
                Color(0xFF00D2FF).copy(alpha = 0.2f),
                Color.White.copy(alpha = borderAlpha * 0.5f)
            )
        ),
        shape = RoundedCornerShape(radiusDp.dp)
    )
