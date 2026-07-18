const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

try {
  console.log('Copying backend/dist to root dist...');
  copyFolderSync(path.join(__dirname, 'backend/dist'), path.join(__dirname, 'dist'));
  console.log('Successfully copied backend build outputs to root dist/ directory.');
} catch (err) {
  console.error('Failed to copy backend build outputs:', err.message);
  process.exit(1);
}
