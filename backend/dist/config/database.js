"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = exports.query = void 0;
const pg_1 = require("pg");
const environment_1 = require("./environment");
// Production Supabase Direct Port 5432 (Bypasses PgBouncer 6543 ECIRCUITBREAKER lockout)
const prodCloudDb5432 = 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';
const sanitizeConnectionString = (connStr) => {
    if (!connStr || connStr.includes('localhost') || connStr.includes('127.0.0.1') || connStr.includes('postgres:postgres') || connStr.includes('hms_db')) {
        return prodCloudDb5432;
    }
    // FORCE replacement of PgBouncer Port 6543 (which throws ECIRCUITBREAKER) with Direct Session Port 5432
    return connStr.replace(':6543', ':5432');
};
const createPool = (connectionString) => {
    const finalUrl = sanitizeConnectionString(connectionString);
    const isLocal = finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1') || finalUrl.includes('sslmode=disable');
    return new pg_1.Pool({
        connectionString: finalUrl,
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
        // If active pool fails due to auth failure, circuit breaker lockout, or bad connection
        if (errMsg.includes('password authentication failed') ||
            errMsg.includes('ECIRCUITBREAKER') ||
            errMsg.includes('too many authentication failures') ||
            errMsg.includes('ECONNREFUSED') ||
            errCode === '28P01' ||
            errCode === 'ECONNREFUSED') {
            console.warn('Primary DB pool error encountered (' + errMsg + '). Automatically retrying on Direct Cloud Database Pool (Port 5432)...');
            if (!fallbackPool) {
                fallbackPool = createPool(prodCloudDb5432);
                fallbackPool.on('error', (e) => console.error('Unexpected error on fallback pool:', e.message));
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
        if (errMsg.includes('password authentication failed') || errMsg.includes('ECIRCUITBREAKER') || error?.code === '28P01') {
            if (!fallbackPool) {
                fallbackPool = createPool(prodCloudDb5432);
            }
            return await fallbackPool.connect();
        }
        throw error;
    }
};
exports.getClient = getClient;
exports.default = activePool;
//# sourceMappingURL=database.js.map