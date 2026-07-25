"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.query = void 0;
const pg_1 = require("pg");
const environment_1 = require("./environment");
const prodCloudDb = 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
const createPool = (connectionString) => {
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1') || connectionString.includes('sslmode=disable');
    return new pg_1.Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: isLocal ? false : { rejectUnauthorized: false }
    });
};
let activePool = createPool(environment_1.env.DATABASE_URL);
let fallbackPool = null;
activePool.on('error', (err) => {
    console.error('Unexpected error on primary database client:', err.message);
});
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await activePool.query(text, params);
        const duration = Date.now() - start;
        if (environment_1.env.NODE_ENV === 'development') {
            console.log('Executed query', { text: text.substring(0, 80), duration, rows: result.rowCount });
        }
        return result;
    }
    catch (error) {
        const errMsg = error?.message || '';
        const errCode = error?.code || '';
        // If primary pool connection fails due to invalid password, auth error (28P01), or connection refused on localhost
        if (errMsg.includes('password authentication failed') ||
            errMsg.includes('ECONNREFUSED') ||
            errCode === '28P01' ||
            errCode === 'ECONNREFUSED') {
            console.warn('Primary DB connection failed. Automatically falling back to Production Cloud Database pool...');
            if (!fallbackPool) {
                fallbackPool = createPool(prodCloudDb);
                fallbackPool.on('error', (e) => console.error('Unexpected error on fallback database pool:', e.message));
            }
            const result = await fallbackPool.query(text, params);
            return result;
        }
        throw error;
    }
};
exports.query = query;
const getClient = async () => {
    try {
        const client = await activePool.connect();
        return client;
    }
    catch (error) {
        const errMsg = error?.message || '';
        if (errMsg.includes('password authentication failed') || error?.code === '28P01') {
            if (!fallbackPool) {
                fallbackPool = createPool(prodCloudDb);
            }
            return await fallbackPool.connect();
        }
        throw error;
    }
};
exports.getClient = getClient;
exports.default = activePool;
//# sourceMappingURL=database.js.map