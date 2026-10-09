import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Apply the existing adapter patch without installing patch-package's vulnerable
// workspace-discovery dependencies. Fail closed when an adapter update changes it.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'node_modules/@sveltejs/adapter-vercel/index.js');
const patch = fs.readFileSync(path.join(root, 'patches/@sveltejs+adapter-vercel+6.3.4.patch'), 'utf8');
let source = fs.readFileSync(target, 'utf8').replaceAll('\r\n', '\n');
const hunks = patch.replaceAll('\r\n', '\n').split(/^@@ .*@@.*\n/m).slice(1);
if (hunks.length !== 5) throw new Error('Unexpected adapter patch format');
for (const hunk of hunks) {
  const lines = hunk.split('\n').filter(line => /^[ +\-]/.test(line));
  const before = lines.filter(line => !line.startsWith('+')).map(line => line.slice(1)).join('\n');
  const after = lines.filter(line => !line.startsWith('-')).map(line => line.slice(1)).join('\n');
  if (source.includes(before)) {
    if (source.indexOf(before) !== source.lastIndexOf(before)) throw new Error('Ambiguous adapter patch');
    source = source.replace(before, after);
  } else if (!source.includes(after)) {
    throw new Error('Adapter source changed; review the Windows symlink patch');
  }
}
fs.writeFileSync(target, source);
console.log('Applied adapter-vercel Windows symlink compatibility patch');
