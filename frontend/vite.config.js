import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

function buildBackendPlugin() {
  return {
    name: 'build-backend',
    closeBundle() {
      try {
        console.log('Vite build finished. Starting backend compilation via Vite plugin...');
        const rootDir = path.resolve(__dirname, '..');
        const backendDir = path.resolve(rootDir, 'backend');
        
        // Install backend dependencies if not present
        if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
          console.log('Installing backend dependencies...');
          execSync('npm install', { cwd: backendDir, stdio: 'inherit' });
        }
        
        // Compile backend
        console.log('Compiling backend...');
        execSync('npm run build', { cwd: backendDir, stdio: 'inherit' });
        
        console.log('Backend build completed successfully via Vite plugin.');
      } catch (err) {
        console.error('Error during backend build in Vite plugin:', err.message);
      }
    }
  };
}

export default defineConfig({
    plugins: [react(), buildBackendPlugin()],
    server: {
        port: 5173,
        open: true,
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
    build: {
        outDir: '../dist',
        emptyOutDir: false,
    },
});
