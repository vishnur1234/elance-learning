import pg from 'pg';

let pool;
let tableEnsured = false;

function getPool(connectionString) {
	if (!pool) {
		pool = new pg.Pool({
			connectionString,
			ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
		});
	}
	return pool;
}

async function ensureTable(p) {
	if (tableEnsured) return;
	try {
		await p.query(`
			CREATE TABLE IF NOT EXISTS _emdash_sessions (
				key TEXT PRIMARY KEY,
				value TEXT NOT NULL,
				expires_at TIMESTAMP
			);
		`);
		tableEnsured = true;
	} catch (e) {
		console.error('[supabase-session-driver] Failed to ensure table:', e);
	}
}

export default function supabaseSessionDriver(options = {}) {
	const connectionString = options.connectionString || process.env.DATABASE_URL;

	return {
		name: 'supabase-session',
		async getItem(key) {
			try {
				if (!connectionString) return null;
				const p = getPool(connectionString);
				await ensureTable(p);
				const res = await p.query('SELECT value FROM _emdash_sessions WHERE key = $1', [key]);
				if (res.rows.length === 0) return null;
				return JSON.parse(res.rows[0].value);
			} catch (err) {
				console.error('[supabase-session] getItem error:', err);
				return null;
			}
		},
		async setItem(key, value) {
			try {
				if (!connectionString) return;
				const p = getPool(connectionString);
				await ensureTable(p);
				const valStr = JSON.stringify(value);
				await p.query(
					`INSERT INTO _emdash_sessions (key, value) VALUES ($1, $2)
					 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
					[key, valStr]
				);
			} catch (err) {
				console.error('[supabase-session] setItem error:', err);
			}
		},
		async removeItem(key) {
			try {
				if (!connectionString) return;
				const p = getPool(connectionString);
				await ensureTable(p);
				await p.query('DELETE FROM _emdash_sessions WHERE key = $1', [key]);
			} catch (err) {
				console.error('[supabase-session] removeItem error:', err);
			}
		},
		async getKeys() {
			try {
				if (!connectionString) return [];
				const p = getPool(connectionString);
				await ensureTable(p);
				const res = await p.query('SELECT key FROM _emdash_sessions');
				return res.rows.map(r => r.key);
			} catch (err) {
				return [];
			}
		},
		async clear() {
			try {
				if (!connectionString) return;
				const p = getPool(connectionString);
				await ensureTable(p);
				await p.query('DELETE FROM _emdash_sessions');
			} catch (err) {
				console.error('[supabase-session] clear error:', err);
			}
		}
	};
}
