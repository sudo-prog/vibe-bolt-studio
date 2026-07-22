const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');
code = code.replace("resolve: { dedupe: ['react', 'react-dom', '@remix-run/react'] }", "resolve: { dedupe: ['react', 'react-dom', '@remix-run/react'] }, optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', '@remix-run/react'] }");
fs.writeFileSync('vite.config.ts', code);
