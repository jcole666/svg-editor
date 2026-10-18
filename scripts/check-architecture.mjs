#!/usr/bin/env node
/**
 * 架构检查：扫描 src/ 下真实 import，验证模块依赖方向。
 *
 * 用法：npm run check:arch
 * 规则（与 doc/README.md「依赖方向规则」一致）：
 *   cli      → app, commands
 *   commands → app, model, view, io
 *   app      → model
 *   view     → model
 *   io       → model
 *   model    → （不依赖任何模块）
 *   src/main.ts 是组合根，允许依赖任意模块。
 *
 * 出现表外依赖即判违规并以退出码 1 结束，方便挂进提交流程。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SRC = 'src';
const ENTRY = 'root';

const ALLOWED = new Set([
  'cli -> app',
  'cli -> commands',
  'commands -> app',
  'commands -> model',
  'commands -> view',
  'commands -> io',
  'app -> model',
  'view -> model',
  'io -> model',
]);

const MODULES = ['cli', 'commands', 'app', 'view', 'model', 'io'];

function collectTypeScriptFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectTypeScriptFiles(full));
    } else if (entry.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

function moduleOf(file) {
  const parts = relative(SRC, file).split(sep);
  return parts.length === 1 ? ENTRY : parts[0];
}

/** 只在仓库自身内解析相对 import，外部依赖不参与检查。 */
function targetModuleOf(file, specifier) {
  const resolved = relative(SRC, join(file, '..', specifier));
  if (resolved.startsWith('..')) {
    return null;
  }
  const parts = resolved.split(sep);
  if (parts[0].endsWith('.ts')) {
    return null;
  }
  return parts.length === 1 ? ENTRY : parts[0];
}

const edges = new Map();
const fileCounts = new Map();
const lineCounts = new Map();

for (const file of collectTypeScriptFiles(SRC)) {
  const from = moduleOf(file);
  fileCounts.set(from, (fileCounts.get(from) ?? 0) + 1);
  lineCounts.set(from, (lineCounts.get(from) ?? 0) + readFileSync(file, 'utf8').split('\n').length);

  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/from\s+'(\.[^']+)'/g)) {
    const to = targetModuleOf(file, match[1]);
    if (to === null || to === from) {
      continue;
    }
    const key = `${from} -> ${to}`;
    edges.set(key, (edges.get(key) ?? 0) + 1);
  }
}

console.log('模块规模：');
for (const name of [...MODULES, ENTRY]) {
  if (!fileCounts.has(name)) {
    continue;
  }
  const files = fileCounts.get(name);
  const lines = lineCounts.get(name);
  console.log(`  ${name.padEnd(10)} ${String(files).padStart(3)} 个文件  ${String(lines).padStart(5)} 行`);
}

console.log('\n模块依赖边（由真实 import 扫描得出）：');
const violations = [];
for (const key of [...edges.keys()].sort()) {
  const [from] = key.split(' ');
  const allowed = from === ENTRY || ALLOWED.has(key);
  if (!allowed) {
    violations.push(key);
  }
  const count = edges.get(key);
  console.log(`  ${allowed ? 'OK  ' : '违规'} ${key.padEnd(22)} ${count} 处`);
}

if (violations.length === 0) {
  console.log('\n依赖方向检查通过：无表外依赖。');
  process.exit(0);
}

console.error(`\n依赖方向检查失败：${violations.length} 条表外依赖`);
for (const violation of violations) {
  console.error(`  - ${violation}`);
}
process.exit(1);
