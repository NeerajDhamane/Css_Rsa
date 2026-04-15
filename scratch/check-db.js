const pool = require('./db');

async function diagnostic() {
    try {
        console.log("--- DATABASE DIAGNOSTIC START ---");
        
        // 1. Test Connection
        const timeResult = await pool.query('SELECT NOW()');
        console.log("✅ Connection Successful. Server Time:", timeResult.rows[0].now);

        // 2. Count Devices
        const deviceCount = await pool.query('SELECT COUNT(*) FROM devices');
        console.log(`📊 Registered Devices: ${deviceCount.rows[0].count}`);

        // 3. Count Logs
        const logCount = await pool.query('SELECT COUNT(*) FROM logs');
        console.log(`📝 Total Communication Logs: ${logCount.rows[0].count}`);

        // 4. Show last 5 logs
        if (parseInt(logCount.rows[0].count) > 0) {
            console.log("\nRecent 5 Logs:");
            const lastLogs = await pool.query('SELECT id, device_id, timestamp, created_at FROM logs ORDER BY created_at DESC LIMIT 5');
            console.table(lastLogs.rows);
        } else {
            console.log("\n⚠️ No records found in 'logs' table.");
        }

        console.log("--- DIAGNOSTIC END ---");
    } catch (err) {
        console.error("❌ DATABASE DIAGNOSTIC FAILED:", err.message);
    } finally {
        await pool.end();
    }
}

diagnostic();
