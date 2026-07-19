"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const environment_1 = require("./config/environment");
const errorHandler_1 = require("./middleware/errorHandler");
// Route imports
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const patient_routes_1 = __importDefault(require("./modules/patient/patient.routes"));
const appointment_routes_1 = __importDefault(require("./modules/appointment/appointment.routes"));
const encounter_routes_1 = __importDefault(require("./modules/emr/encounter.routes"));
const pharmacy_routes_1 = __importDefault(require("./modules/pharmacy/pharmacy.routes"));
const billing_routes_1 = __importDefault(require("./modules/billing/billing.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const ip_routes_1 = __importDefault(require("./modules/inpatient/ip.routes"));
const diagnostics_routes_1 = __importDefault(require("./modules/diagnostics/diagnostics.routes"));
const app = (0, express_1.default)();
// Security & parsing middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            service: 'Manasa HMS API',
        },
    });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/patients', patient_routes_1.default);
app.use('/api/appointments', appointment_routes_1.default);
app.use('/api/emr', encounter_routes_1.default);
app.use('/api/pharmacy', pharmacy_routes_1.default);
app.use('/api/billing', billing_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/inpatient', ip_routes_1.default);
app.use('/api/diagnostics', diagnostics_routes_1.default);
// Serve static assets dynamically whenever index.html is available
const staticCandidates = [
    path_1.default.join(__dirname, '../../dist'),
    path_1.default.join(__dirname, '../dist'),
    path_1.default.join(__dirname, './dist'),
    __dirname,
    path_1.default.join(process.cwd(), 'dist'),
    path_1.default.join(process.cwd(), 'frontend/dist'),
    path_1.default.join(__dirname, '../../frontend/dist')
];
let frontendPath = '';
for (const cand of staticCandidates) {
    if (fs_1.default.existsSync(path_1.default.join(cand, 'index.html'))) {
        frontendPath = cand;
        break;
    }
}
if (frontendPath) {
    app.use(express_1.default.static(frontendPath));
    // Explicit root route handler
    app.get('/', (_req, res) => {
        res.sendFile(path_1.default.join(frontendPath, 'index.html'));
    });
    // For any non-API routes, serve index.html (React routing)
    app.get('*', (req, res, next) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path_1.default.join(frontendPath, 'index.html'));
        }
        else {
            next();
        }
    });
}
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found.',
    });
});
// Global error handler
app.use(errorHandler_1.errorHandler);
// Start server if not running on Vercel Serverless
if (!process.env.VERCEL) {
    const PORT = environment_1.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`\n🏥 Manasa HMS API Server`);
        console.log(`   Environment: ${environment_1.env.NODE_ENV}`);
        console.log(`   Port: ${PORT}`);
        console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map