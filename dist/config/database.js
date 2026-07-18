"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.query = void 0;
const pg_1 = require("pg");
const environment_1 = require("./environment");
const pool = new pg_1.Pool({
    connectionString: environment_1.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle database client:', err);
    process.exit(-1);
});
const query = async (text, params) => {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (environment_1.env.NODE_ENV === 'development') {
        console.log('Executed query', { text: text.substring(0, 80), duration, rows: result.rowCount });
    }
    return result;
};
exports.query = query;
const getClient = async () => {
    const client = await pool.connect();
    return client;
};
exports.getClient = getClient;
exports.default = pool;
//# sourceMappingURL=database.js.map