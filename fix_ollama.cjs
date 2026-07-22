const fs = require('fs');
let code = fs.readFileSync('app/utils/constants.ts', 'utf8');

const replacement = `  {
    name: 'Ollama',
    staticModels: [],
    getDynamicModels: getOllamaModels,
    getApiKeyLink: 'https://ollama.com/download',
    labelForGetApiKey: 'Download Ollama',
    icon: 'i-ph:cloud-arrow-down',
  },`;

code = code.replace(/  \{\n    name: 'Ollama',[\s\S]*?icon: 'i-ph:cloud-arrow-down',\n  \},/, replacement);
fs.writeFileSync('app/utils/constants.ts', code);
