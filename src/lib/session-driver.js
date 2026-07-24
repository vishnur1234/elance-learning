import pg from 'pg';

export default function supabaseSessionDriver(options = {}) {
    const connStr = options.connectionString || process.env.DATABASE_URL;
    let pool;
    const getPool = () => {
        if (!pool) pool = new pg.Pool({ connectionString: connStr });
        return pool;
    };

    return {
        name: 'supabase-session',
        async getItem(key) {
            try {
                const client = getPool();
                const res = await client.query('SELECT value FROM _emdash_sessions WHERE id = $1', [key]);
                if (res.rows.length === 0) return null;
                return JSON.parse(res.rows[0].value);
            } catch {
                return null;
            }
        },
        async setItem(key, value) {
            try {
                const client = getPool();
                await client.query(`
                    CREATE TABLE IF NOT EXISTS _emdash_sessions (
                        id TEXT PRIMARY KEY,
                        value TEXT NOT NULL,
                        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                    );
                `);
                await client.query(`
                    INSERT INTO _emdash_sessions (id, value, updated_at)
                    VALUES ($1, $2, CURRENT_TIMESTAMP)
                    ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
                `, [key, JSON.stringify(value)]);
            } catch (err) {
                console.error('Session set error:', err);
            }
        },
        async removeItem(key) {
            try {
                const client = getPool();
                await client.query('DELETE FROM _emdash_sessions WHERE id = $1', [key]);
            } catch {}
        },
        async hasItem(key) {
            const val = await this.getItem(key);
            return val !== null;
        },
        async clear() {
            try {
                const client = getPool();
                await client.query('TRUNCATE TABLE _emdash_sessions');
            } catch {}
        }
    };
}
