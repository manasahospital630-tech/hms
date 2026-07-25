"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Attempt to load .env from multiple potential locations for cloud/Hostinger compatibility
const envPaths = [
    path_1.default.resolve(process.cwd(), '.env'),
    path_1.default.resolve(process.cwd(), 'backend/.env'),
    path_1.default.resolve(__dirname, '../.env'),
    path_1.default.resolve(__dirname, '../../.env'),
    path_1.default.resolve(__dirname, '../../../.env'),
    path_1.default.resolve(__dirname, '.env')
];
for (const p of envPaths) {
    if (fs_1.default.existsSync(p)) {
        dotenv_1.default.config({ path: p });
        break;
    }
}
dotenv_1.default.config();
const prodCloudDb = 'postgresql://postgres.pamobniywbuloarioxiu:Nine%40248688944@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
const defaultJwt = 'super-secret-jwt-key-for-manasa-hms-production-2026';
// Construct database URL from environment variables if individual vars exist
let constructedDbUrl = process.env.DATABASE_URL;
if (!constructedDbUrl) {
    const user = process.env.DB_USER || process.env.POSTGRES_USER || process.env.PGUSER;
    const password = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD || process.env.DB_PASS;
    const host = process.env.DB_HOST || process.env.POSTGRES_HOST || process.env.PGHOST;
    const port = process.env.DB_PORT || process.env.POSTGRES_PORT || process.env.PGPORT || '5432';
    const name = process.env.DB_NAME || process.env.POSTGRES_DB || process.env.PGDATABASE || 'postgres';
    if (user && password && host) {
        constructedDbUrl = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
    }
}
// If DATABASE_URL is missing or set to generic broken localhost string, default to live cloud DB
if (!constructedDbUrl || constructedDbUrl.includes('postgres:postgres@localhost') || constructedDbUrl.includes('postgres@localhost:5432/hms_db')) {
    constructedDbUrl = prodCloudDb;
}
let rawPort = process.env.PORT || 5000;
if (typeof rawPort === 'string' && !isNaN(parseInt(rawPort, 10)) && !rawPort.includes('/') && !rawPort.includes('\\')) {
    rawPort = parseInt(rawPort, 10);
}
exports.env = {
    PORT: rawPort,
    DATABASE_URL: constructedDbUrl || prodCloudDb,
    JWT_SECRET: process.env.JWT_SECRET || defaultJwt,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    NODE_ENV: process.env.NODE_ENV || 'production',
};
//# sourceMappingURL=environment.js.map