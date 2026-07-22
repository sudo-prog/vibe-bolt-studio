const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');
if (!code.includes('dedupe')) {
  code = code.replace(/server:\s*\{/, "resolve: { dedupe: ['react', 'react-dom', '@remix-run/react'] }, server: {");
  fs.writeFileSync('vite.config.ts', code);
}
