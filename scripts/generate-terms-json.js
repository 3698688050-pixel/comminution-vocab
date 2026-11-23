// terms.js is the source of truth; use --check to detect an outdated JSON copy.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'data/terms.js'), 'utf8'), context);
if (!Array.isArray(context.TERMS) || !context.TERMS.length) throw new Error('Invalid terms.js');
const json = JSON.stringify(context.TERMS);
const target = path.join(root, 'data/terms.json');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== json) {
    console.error('terms.json is out of date; run node scripts/generate-terms-json.js');
    process.exitCode = 1;
  } else console.log(`OK: ${context.TERMS.length} terms match`);
} else {
  fs.writeFileSync(target, json);
  console.log(`Generated ${context.TERMS.length} terms`);
}
