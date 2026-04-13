const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Serve index.html
const path = require('path');
app.use(express.static(path.join(__dirname)));

// POST - Save encrypted data to DB
app.post('/save', async (req, res) => {
    try {
        const { original_message, encrypted_data, signature, verified } = req.body;

        // Generate SHA-256 hash of original message
        const hash_value = crypto
            .createHash('sha256')
            .update(original_message)
            .digest('hex');

        await pool.query(
            `INSERT INTO communication_logs 
            (original_message, encrypted_data, hash_value, signature, verified) 
            VALUES ($1, $2, $3, $4, $5)`,
            [original_message, encrypted_data, hash_value, signature.toString(), verified]
        );

        res.json({ success: true, hash_value });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Fetch all logs from DB
app.get('/logs', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM communication_logs ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});