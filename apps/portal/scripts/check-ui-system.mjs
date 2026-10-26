import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const colors = /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)/gi;
const withoutComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
export function colorInventory(css) {
  const counts = {};
  for (const match of withoutComments(css).matchAll(colors)) {const value = match[0].toLowerCase(); counts[value] = (counts[value] || 0) + 1;}
  return counts;
}
export function checkStyles(files, legacy = {}) {
  const findings = [];
  for (const [file, source] of Object.entries(files)) {
    // New palette values have one home; legacy files may only reduce their debt.
    const css = file === 'ui/system.css' ? withoutComments(source).replace(/:root\s*\{[^{}]*\}/g, '') : source;
    for (const [value, count] of Object.entries(colorInventory(css))) {
      const allowed = file === 'ui/system.css' ? 0 : legacy[file]?.[value] || 0;
      if (count > allowed) findings.push({file, value, count, allowed});
    }
  }
  return findings;
}
async function readCss(root, prefix = '') {
  const files = {};
  for (const entry of await fs.readdir(path.join(root, prefix), {withFileTypes: true})) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) Object.assign(files, await readCss(root, relative));
    else if (entry.name.endsWith('.css')) files[relative] = await fs.readFile(path.join(root, relative), 'utf8');
  }
  return files;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../site/', import.meta.url));
  const legacy = JSON.parse(await fs.readFile(new URL('./ui-system-legacy.json', import.meta.url), 'utf8'));
  const files = await readCss(root), findings = checkStyles(files, legacy);
  if (findings.length) {
    for (const finding of findings) console.error(`${finding.file}: ${finding.value} appears ${finding.count} times (legacy allowance ${finding.allowed}). Reuse a semantic token from ui/system.css.`);
    process.exitCode = 1;
  } else console.log(`UI color guard passed for ${Object.keys(files).length} stylesheets. Review component reuse and necessary copy with docs/PORTAL_UI_SYSTEM.md.`);
}
