package com.haider.offline.messaging.security

import java.security.*
import java.security.spec.ECGenParameterSpec
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher
import javax.crypto.KeyAgreement
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

class CryptoManager {
    private val keyPair: KeyPair

    init {
        val kpg = KeyPairGenerator.getInstance("EC")
        kpg.initialize(ECGenParameterSpec("secp256r1"))
        keyPair = kpg.generateKeyPair()
    }

    fun getPublicKeyBytes(): ByteArray = keyPair.public.encoded

    fun deriveSharedSecret(peerPublicKeyBytes: ByteArray): SecretKeySpec {
        val kf = KeyFactory.getInstance("EC")
        val peerKey = kf.generatePublic(X509EncodedKeySpec(peerPublicKeyBytes))

        val ka = KeyAgreement.getInstance("ECDH")
        ka.init(keyPair.private)
        ka.doPhase(peerKey, true)
        val rawSecret = ka.generateSecret()

        val md = MessageDigest.getInstance("SHA-256")
        val aesKeyBytes = md.digest(rawSecret)
        return SecretKeySpec(aesKeyBytes, "AES")
    }

    fun encryptPrivate(aesKey: SecretKeySpec, plaintext: ByteArray): EncryptedPayload {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val iv = ByteArray(12)
        SecureRandom().nextBytes(iv)
        val spec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.ENCRYPT_MODE, aesKey, spec)

        val ciphertext = cipher.doFinal(plaintext)
        return EncryptedPayload(ciphertext, iv)
    }

    fun decryptPrivate(aesKey: SecretKeySpec, ciphertext: ByteArray, iv: ByteArray): ByteArray {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val spec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.DECRYPT_MODE, aesKey, spec)
        return cipher.doFinal(ciphertext)
    }
}

data class EncryptedPayload(val ciphertext: ByteArray, val iv: ByteArray)
