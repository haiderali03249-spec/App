package com.haider.offline.messaging.nearby

import android.content.Context
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class NearbyConnectionsManager(private val context: Context) {
    private val connectionsClient: ConnectionsClient = Nearby.getConnectionsClient(context)
    private val SERVICE_ID = "com.haider.offline.messaging.SERVICE"
    private val STRATEGY = Strategy.P2P_CLUSTER

    private val _discoveredEndpoints = MutableStateFlow<Map<String, DiscoveredEndpoint>>(emptyMap())
    val discoveredEndpoints: StateFlow<Map<String, DiscoveredEndpoint>> = _discoveredEndpoints.asStateFlow()

    private val _connectionState = MutableStateFlow<ConnectionState>(ConnectionState.Idle)
    val connectionState: StateFlow<ConnectionState> = _connectionState.asStateFlow()

    fun startAdvertising(localDeviceName: String) {
        val options = AdvertisingOptions.Builder().setStrategy(STRATEGY).build()
        connectionsClient.startAdvertising(localDeviceName, SERVICE_ID, connectionLifecycleCallback, options)
    }

    fun stopAdvertising() {
        connectionsClient.stopAdvertising()
    }

    fun startDiscovery() {
        val options = DiscoveryOptions.Builder().setStrategy(STRATEGY).build()
        connectionsClient.startDiscovery(SERVICE_ID, endpointDiscoveryCallback, options)
    }

    fun stopDiscovery() {
        connectionsClient.stopDiscovery()
    }

    fun requestConnection(endpointId: String, localDeviceName: String) {
        connectionsClient.requestConnection(localDeviceName, endpointId, connectionLifecycleCallback)
    }

    fun sendPayload(endpointId: String, bytes: ByteArray) {
        val payload = Payload.fromBytes(bytes)
        connectionsClient.sendPayload(endpointId, payload)
    }

    private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
        override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
            val updated = _discoveredEndpoints.value.toMutableMap()
            updated[endpointId] = DiscoveredEndpoint(endpointId, info.endpointName)
            _discoveredEndpoints.value = updated
        }

        override fun onEndpointLost(endpointId: String) {
            val updated = _discoveredEndpoints.value.toMutableMap()
            updated.remove(endpointId)
            _discoveredEndpoints.value = updated
        }
    }

    private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
        override fun onConnectionInitiated(endpointId: String, connectionInfo: ConnectionInfo) {
            connectionsClient.acceptConnection(endpointId, payloadCallback)
        }

        override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
            if (result.status.isSuccess) {
                _connectionState.value = ConnectionState.Connected(endpointId)
            }
        }

        override fun onDisconnected(endpointId: String) {
            _connectionState.value = ConnectionState.Disconnected(endpointId)
        }
    }

    private val payloadCallback = object : PayloadCallback() {
        override fun onPayloadReceived(endpointId: String, payload: Payload) {
            if (payload.type == Payload.Type.BYTES) {
                val data = payload.asBytes() ?: return
                // Process received encrypted payload
            }
        }

        override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {}
    }
}

data class DiscoveredEndpoint(val id: String, val name: String)
sealed class ConnectionState {
    object Idle : ConnectionState()
    data class Connected(val endpointId: String) : ConnectionState()
    data class Disconnected(val endpointId: String) : ConnectionState()
}
