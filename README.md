# 🏙️ Smart City RSA Communication Framework

[![Security: RSA-256](https://img.shields.io/badge/Security-RSA--OAEP%20%2B%20PSS-blueviolet)](https://en.wikipedia.org/wiki/RSA_(cryptosystem))
[![Encryption: AES-GCM](https://img.shields.io/badge/Encryption-AES--256--GCM-green)](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)](https://www.postgresql.org/)

A professional-grade, full-stack security framework designed to simulate and protect **Smart City IoT Communications**. This project demonstrates a robust "Defense in Depth" strategy by combining Hybrid Encryption, Digital Signatures, and multi-layered Integrity checks.

---

## 🚀 Project Overview

In a modern Smart City, thousands of IoT devices (traffic sensors, pollution monitors, water meters) transmit critical data to a central authority. If this data is tampered with or spoofed, it can lead to infrastructure failure or public safety risks.

This framework provides a **secure pipeline** for these transmissions, ensuring:
1.  **Confidentiality**: Data is unreadable to anyone but the server.
2.  **Integrity**: Data cannot be modified in transit.
3.  **Authentication**: The server knows exactly which device sent the message.
4.  **Non-repudiation**: Devices cannot deny sending a specific message.
5.  **Freshness**: Messages cannot be intercepted and replayed later (Replay Attack protection).

---

## 🔐 Security Architecture

This system implements a sophisticated cryptographic pipeline using the **Web Crypto API** (Browser) and a **Node.js/PostgreSQL** backend.

### 1. Hybrid Encryption (RSA + AES)
-   **AES-GCM (256-bit)**: Used for high-speed encryption of the actual message payload.
-   **RSA-OAEP**: Used to securely "wrap" the AES key so only the server (holder of the private key) can decrypt it.

### 2. Digital Signatures (RSA-PSS)
-   Every message is signed using a device-specific **RSA-PSS Private Key**.
-   The server verifies the signature using the device's public key stored in the database, ensuring the message is authentic.

### 3. Integrity & Authentication (SHA-256 & HMAC)
-   **SHA-256**: Generates a unique fingerprint of the message.
-   **HMAC-SHA256**: Uses a shared secret to provide an additional layer of authentication.

### 4. Replay Protection (Nonces & Timestamps)
-   **Nonce**: A unique UUID for every message. The server tracks these to prevent duplicate processing.
-   **Timestamp**: Messages older than 5 minutes are automatically rejected to prevent delayed injection attacks.

---

## 🛠️ Tech Stack

-   **Frontend**: Vanilla JS (ES6+), HTML5, CSS3 (Glassmorphism UI).
-   **Backend**: Node.js, Express.js.
-   **Database**: PostgreSQL (Relational storage for logs and device keys).
-   **Cryptography**: Web Crypto API (Client-side), standard hashing/verification (Server-side simulation).

---

## ⚙️ Getting Started

### Prerequisites
-   [Node.js](https://nodejs.org/) (v14+ recommended)
-   [PostgreSQL](https://www.postgresql.org/) (Installed and running)

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Database Setup
1.  Log into your PostgreSQL instance (via `psql` or PGAdmin).
2.  Create a new database:
    ```sql
    CREATE DATABASE smart_city_security;
    ```
3.  Execute the `schema.sql` file provided in the repository to create the tables and seed initial devices:
    ```bash
    psql -d smart_city_security -f schema.sql
    ```

### 3. Configuration
Create a `.env` file in the root directory and add your database credentials:
```env
DB_USER=your_postgres_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_city_security
```

### 4. Run the App
```bash
node server.js
```
The server will start at `http://localhost:3000`.

---

## 📦 Database Schema

### `devices` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR | Unique device identifier (e.g., `traffic-001`) |
| `name` | VARCHAR | Human-readable name |
| `public_key_jwk` | JSONB | The device's RSA Public Key bundle |
| `last_nonce` | VARCHAR | Used for replay protection tracking |

### `logs` Table
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | SERIAL | Primary Key |
| `encrypted_message`| TEXT | BASE64 encoded AES-encrypted payload |
| `encrypted_key` | TEXT | RSA-wrapped AES key |
| `signature` | TEXT | RSA Digital Signature |
| `nonce` | VARCHAR | Unique ID for this specific transmission |

---

## 📱 User Interface & Simulation

### **Dashboard**
-   **Message Composer**: Select a device and send encrypted messages.
-   **Cryptographic Pipeline**: View real-time logs of the step-by-step security process.
-   **Attack Simulation**: Intentionally trigger security failures:
    -   **Tamper**: Corrupts data to trigger Integrity failure.
    -   **Replay**: Attempts to resend a previous valid message.
    -   **Spoof**: Pretends to be a device that doesn't exist.
    -   **Expire**: Sends a message with a stale timestamp.

### **System Logs**
Visit `/verify.html` to view all preserved transmissions in the PostgreSQL database and their verification status.

---

## 🛡️ Security Specifications
-   **RSA Key Size**: 2048-bit
-   **AES Key Size**: 256-bit
-   **Hash Algorithm**: SHA-256
-   **Signature Scheme**: RSA-PSS
-   **Encryption Scheme**: RSA-OAEP