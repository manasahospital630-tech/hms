const fs = require('fs');
const file = 'E:/HMS-1/backend/src/modules/inpatient/ip.service.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\\`/g, '`');
fs.writeFileSync(file, content);
console.log('Fixed backticks');
