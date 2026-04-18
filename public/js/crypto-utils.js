/**
 * Smart City Secure Communication System - Cryptography Utilities
 * Uses the Web Crypto API (SubtleCrypto) for high-performance, 
 * browser-native cryptographic operations.
 */

const CryptoUtils = {
    // RSA Configurations
    RSA_ALGO: {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
    },
    
    // RSA Signature Configurations
    SIGN_ALGO: {
        name: "RSA-PSS",
        saltLength: 32
    },

    /**
     * Generate a new RSA Key Pair for a device
     * @returns {Promise<CryptoKeyPair>}
     */
    async generateRSAKeyPair() {
        return await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true, // extractable
            ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
        );
    },

    /**
     * Generate a separate RSA Key Pair for signing (Non-repudiation)
     */
    async generateSigningKeyPair() {
        return await window.crypto.subtle.generateKey(
            {
                name: "RSA-PSS",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["sign", "verify"]
        );
    },

    /**
     * Hybrid Encryption (Confidentiality)
     * 1. Generate random AES-256 key
     * 2. Encrypt message with AES-GCM
     * 3. Wrap (encrypt) AES key with RSA Public Key
     */
    async encryptHybrid(message, rsaPublicKey) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);

        // 1. Generate AES Key
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        // 2. Encrypt Message with AES
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            data
        );

        // 3. Wrap AES Key with RSA
        const wrappedKey = await window.crypto.subtle.wrapKey(
            "raw",
            aesKey,
            rsaPublicKey,
            "RSA-OAEP"
        );

        return {
            encryptedMessage: this.bufToBase64(encryptedContent),
            encryptedKey: this.bufToBase64(wrappedKey),
            iv: this.bufToBase64(iv)
        };
    },

    /**
     * Hybrid Decryption
     */
    async decryptHybrid(encMessageBase64, encKeyBase64, ivBase64, rsaPrivateKey) {
        const encryptedMessage = this.base64ToBuf(encMessageBase64);
        const encryptedKey = this.base64ToBuf(encKeyBase64);
        const iv = this.base64ToBuf(ivBase64);

        // 1. Unwrap AES Key
        const aesKey = await window.crypto.subtle.unwrapKey(
            "raw",
            encryptedKey,
            rsaPrivateKey,
            "RSA-OAEP",
            "AES-GCM",
            true,
            ["decrypt"]
        );

        // 2. Decrypt Content
        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            encryptedMessage
        );

        return new TextDecoder().decode(decryptedContent);
    },

    /**
     * Digital Signature (Non-repudiation)
     * Signs the raw bytes of the SHA-256 hex digest (not the UTF-8 encoded hex string)
     * This ensures consistent signing regardless of string encoding.
     */
    async signMessage(hashHex, privateKey) {
        // Convert hex string to raw bytes — sign the actual digest bytes
        const bytes = new Uint8Array(hashHex.match(/.{2}/g).map(b => parseInt(b, 16)));
        const signature = await window.crypto.subtle.sign(
            { name: "RSA-PSS", saltLength: 32 },
            privateKey,
            bytes
        );
        return this.bufToBase64(signature);
    },

    /**
     * Verify Digital Signature
     * Verifies against raw bytes of the SHA-256 hex digest — must match signMessage exactly.
     */
    async verifySignature(hashHex, signatureBase64, publicKey) {
        // Same conversion as signMessage — verify against raw hash bytes
        const bytes = new Uint8Array(hashHex.match(/.{2}/g).map(b => parseInt(b, 16)));
        const signature = this.base64ToBuf(signatureBase64);
        return await window.crypto.subtle.verify(
            { name: "RSA-PSS", saltLength: 32 },
            publicKey,
            signature,
            bytes
        );
    },

    /**
     * SHA-256 Hash (Integrity)
     */
    async computeHash(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
        return this.bufToHex(hashBuffer);
    },

    /**
     * HMAC-SHA256 (Authentication)
     */
    async computeHMAC(message, secret) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(message);

        const key = await window.crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const hmacBuffer = await window.crypto.subtle.sign("HMAC", key, messageData);
        return this.bufToHex(hmacBuffer);
    },

    // --- Helper Methods ---

    bufToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    },

    base64ToBuf(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    },

    bufToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    async exportKey(key) {
        return await window.crypto.subtle.exportKey("jwk", key);
    },

    async importKey(jwk, algo, usages) {
        return await window.crypto.subtle.importKey("jwk", jwk, algo, true, usages);
    }
};

// Export for use in other scripts
window.CryptoUtils = CryptoUtils;