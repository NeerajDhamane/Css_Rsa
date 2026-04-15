-- Smart City Secure Communication System - Database Schema

-- Clear existing data (CAUTION: Resets the simulation)
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS devices;

-- Devices table to manage simulated IoT keys and status
CREATE TABLE devices (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'traffic-001'
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    public_key_jwk JSONB,       -- Storing RSA Public Key for wrapping/verification
    last_nonce VARCHAR(100),    -- For simple replay protection tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Logs table to store cryptographic payloads and verification data
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(id),
    encrypted_message TEXT NOT NULL, -- AES encrypted data (base64)
    encrypted_key TEXT NOT NULL,     -- AES key wrapped with RSA public key
    iv TEXT NOT NULL,                -- AES initialization vector
    hash VARCHAR(64) NOT NULL,       -- SHA-256 hash
    hmac VARCHAR(64) NOT NULL,       -- HMAC-SHA256
    signature TEXT NOT NULL,         -- RSA Digital Signature
    timestamp BIGINT NOT NULL,       -- Client-side timestamp
    nonce VARCHAR(100) NOT NULL,     -- Unique message identifier
    is_valid BOOLEAN DEFAULT TRUE,   -- Result of server-side initial check
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed some initial devices
INSERT INTO devices (id, name, type) VALUES 
('traffic-001', 'Main St. Traffic Sensor', 'TRAFFIC'),
('pollution-002', 'Central Park Air Quality', 'POLLUTION'),
('temp-003', 'Sector 7 Weather Station', 'ENVIRONMENT'),
('water-004', 'River Level Monitor', 'INFRASTRUCTURE');
