// Vercel Serverless Function entrypoint for Express API
const path = require('path');
const fs = require('fs');

let appModule;
const rootDistServer = path.join(__dirname, '..', 'dist', 'server.js');
const backendDistServer = path.join(__dirname, '..', 'backend', 'dist', 'server.js');

if (fs.existsSync(rootDistServer)) {
  appModule = require(rootDistServer);
} else if (fs.existsSync(backendDistServer)) {
  appModule = require(backendDistServer);
} else {
  appModule = require('../backend/src/server');
}

const app = appModule.default || appModule;

module.exports = (req, res) => {
  return app(req, res);
};
