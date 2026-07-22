const fs = require('fs');
const file = 'node_modules/path-browserify/index.js';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes('module.exports = posix;')) {
    code = code.replace(/module\.exports = posix;/g, `
export default posix;
export const resolve = posix.resolve;
export const normalize = posix.normalize;
export const isAbsolute = posix.isAbsolute;
export const join = posix.join;
export const relative = posix.relative;
export const _makeLong = posix._makeLong;
export const dirname = posix.dirname;
export const basename = posix.basename;
export const extname = posix.extname;
export const format = posix.format;
export const parse = posix.parse;
export const sep = posix.sep;
export const delimiter = posix.delimiter;
export const posix_ = posix;
export const win32 = null;
    `);
    fs.writeFileSync(file, code);
  }
}
