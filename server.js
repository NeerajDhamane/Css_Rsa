const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from root
app.use(express.static(path.join(__dirname)));

/**
 * GET /devices
 * Returns list of available IoT devices and their current public keys
 */
app.get('/api/devices', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, type, public_key_jwk FROM devices ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching devices:', err);
        res.status(500).json({ error: 'Database error fetching devices' });
    }
});

/**
 * POST /api/save
 * Main endpoint for receiving secure IoT communications.
 * Handles storage and basic replay protection checks.
 */
app.post('/api/save', async (req, res) => {
    try {
        const { 
            device_id, 
            encrypted_message, 
            encrypted_key, 
            iv, 
            hash, 
            hmac, 
            signature, 
            timestamp, 
            nonce 
        } = req.body;

        // 1. Basic Replay Attack Protection (Server-side)
        // Check if nonce has already been used in the logs
        const nonceCheck = await pool.query(
            'SELECT 1 FROM logs WHERE device_id = $1 AND nonce = $2 LIMIT 1',
            [device_id, nonce]
        );

        if (nonceCheck.rows.length > 0) {
            return res.status(403).json({ 
                success: false, 
                error: 'REPLAY_DETECTED', 
                message: 'Duplicate nonce detected! This message has already been processed.' 
            });
        }

        // 2. Check Timestamp (Tolerance: 5 minutes)
        const now = Date.now();
        const tolerance = 5 * 60 * 1000; 
        if (Math.abs(now - timestamp) > tolerance) {
             return res.status(403).json({ 
                success: false, 
                error: 'EXPIRED_MESSAGE', 
                message: 'Message timestamp is too old or too far in the future.' 
            });
        }

        // 3. Save to logs
        await pool.query(
            `INSERT INTO logs 
            (device_id, encrypted_message, encrypted_key, iv, hash, hmac, signature, timestamp, nonce) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [device_id, encrypted_message, encrypted_key, iv, hash, hmac, signature, timestamp, nonce]
        );

        // Update device last nonce
        await pool.query('UPDATE devices SET last_nonce = $1 WHERE id = $2', [nonce, device_id]);

        res.json({ success: true, message: 'Secure log preserved in PostgreSQL.' });

    } catch (err) {
        console.error('Error saving log:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/update-keys
 * Simulates key rotation by updating a device's public key
 */
app.post('/api/update-keys', async (req, res) => {
    try {
        const { device_id, public_key_jwk } = req.body;
        await pool.query(
            'UPDATE devices SET public_key_jwk = $1 WHERE id = $2',
            [public_key_jwk, device_id]
        );
        res.json({ success: true, message: 'Public key rotated successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/logs
 * Fetches all communication logs
 */
app.get('/api/logs', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT l.*, d.name as device_name, d.public_key_jwk
             FROM logs l 
             JOIN devices d ON l.device_id = d.id 
             ORDER BY l.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fallback for SPA-like navigation: redirect unknown GET requests to index.html
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        next();
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Smart City Security Server running at http://localhost:${PORT}`);
});