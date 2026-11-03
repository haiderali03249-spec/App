package com.haider.offline.messaging

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.haider.offline.messaging.ui.theme.DeepNavy
import com.haider.offline.messaging.ui.theme.LuminousCyan
import com.haider.offline.messaging.ui.theme.liquidGlass

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = DeepNavy
                ) {
                    HaiderMainScreen()
                }
            }
        }
    }
}

@Composable
fun HaiderMainScreen() {
    var isScanning by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Header
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(top = 24.dp)
        ) {
            Text(
                text = "HAIDER",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                text = "Offline Messaging System",
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = LuminousCyan
            )
            Text(
                text = "Connect Nearby. Message Freely.",
                fontSize = 11.sp,
                color = Color.Gray
            )
        }

        // Radar / Search Status Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .liquidGlass(radiusDp = 24)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = if (isScanning) "Searching for Nearby Devices..." else "P2P Cluster Ready",
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Google Nearby Connections API (BLE & Wi-Fi Direct)",
                    color = Color.LightGray,
                    fontSize = 11.sp
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { isScanning = !isScanning },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isScanning) Color(0xFFEF4444) else Color(0xFF0066FF)
                    )
                ) {
                    Text(text = if (isScanning) "Stop Searching" else "Start Searching")
                }
            }
        }

        // Contact Section at bottom
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(bottom = 16.dp)
        ) {
            Text(
                text = "Support Contact: 03249192862",
                color = Color.LightGray,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}
