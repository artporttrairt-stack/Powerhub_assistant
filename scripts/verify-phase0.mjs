import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    console.error(`FAIL ${label}`);
    process.exit(result.status || 1);
  }
  console.log(`PASS ${label}`);
}

const testFiles = walk(join(root, 'tests', 'phase0'))
  .filter((file) => file.endsWith('.test.js'))
  .sort();
run('phase0 tests', process.execPath, ['--test', ...testFiles]);

const syntaxRoots = [
  join(root, 'extension', 'src'),
  join(root, 'tests', 'phase0'),
  join(root, 'scripts'),
];
const syntaxFiles = syntaxRoots
  .flatMap((dir) => walk(dir))
  .filter((file) => file.endsWith('.js') || file.endsWith('.mjs'))
  .sort();

for (const file of syntaxFiles) {
  run(`syntax ${relative(root, file)}`, process.execPath, ['--check', file]);
}
console.log(`PASS syntax ${syntaxFiles.length} files`);
