// Root entry point for Node.js / Express deployment platforms (Hostinger, cPanel, PM2, Render, Railway, etc.)
// Auto-detected by standard Node.js hosting environments

const path = require('path');
const fs = require('fs');

// Ensure compiled backend server exists before executing
const distServerPath = path.join(__dirname, 'dist', 'server.js');
const backendDistServerPath = path.join(__dirname, 'backend', 'dist', 'server.js');

if (fs.existsSync(distServerPath)) {
  require(distServerPath);
} else if (fs.existsSync(backendDistServerPath)) {
  require(backendDistServerPath);
} else {
  console.error('CRITICAL: Compiled server entry point not found at dist/server.js or backend/dist/server.js');
  console.error('Please run "npm run build" to compile the application.');
  process.exit(1);
}
