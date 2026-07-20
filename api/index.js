// Vercel Serverless Function entrypoint for Express API
const path = require('path');
const fs = require('fs');

let app;

try {
  let appModule;
  const rootDistServer = path.join(__dirname, '..', 'dist', 'server.js');
  const backendDistServer = path.join(__dirname, '..', 'backend', 'dist', 'server.js');

  if (fs.existsSync(rootDistServer)) {
    appModule = require('../dist/server.js');
  } else if (fs.existsSync(backendDistServer)) {
    appModule = require('../backend/dist/server.js');
  } else {
    appModule = require('../dist/server.js');
  }

  app = appModule.default || appModule;
} catch (err) {
  console.error('Error initializing Express app in Vercel Serverless Function:', err);
  const express = require('express');
  const fallback = express();
  fallback.use((req, res) => {
    res.status(500).json({
      success: false,
      error: 'Vercel Serverless Function Initialization Error',
      message: err.message
    });
  });
  app = fallback;
}

module.exports = app;
