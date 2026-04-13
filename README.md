# Smart City RSA Communication Framework

A secure IoT communication system built for Cryptography & System Security.

## Features
- RSA Encryption & Decryption
- Digital Signature (generation + verification)
- SHA-256 Hashing
- PostgreSQL database storage
- Smart City IoT device simulation

## RSA Parameters
- p = 61, q = 53, n = 3233
- e = 17 (public key)
- d = 2753 (private key)

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: PostgreSQL

## Run Locally
1. Clone the repo
2. Run `npm install`
3. Create `.env` file with your DB credentials
4. Run `node server.js`
5. Open `http://localhost:3000`