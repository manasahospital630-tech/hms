"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z
        .string()
        .default('5000')
        .transform((val) => parseInt(val, 10))
        .pipe(zod_1.z.number().int().positive()),
    DATABASE_URL: zod_1.z
        .string()
        .default(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hms_db'),
    JWT_SECRET: zod_1.z
        .string()
        .default(process.env.JWT_SECRET || 'super-secret-jwt-key-for-manasa-hms-production-2026'),
    JWT_EXPIRES_IN: zod_1.z.string().default('24h'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('production'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
//# sourceMappingURL=environment.js.map