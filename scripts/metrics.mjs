#!/usr/bin/env node
/**
 * 从 git 历史算 Phase 2 的规模。
 * 对比 tag final 和 HEAD，不读工作区里还没提交的文件。
 *
 * 用法：npm run metrics
 * 输出：docs/metrics/report.md
 */
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const FROM = 'final';
const TO = 'HEAD';

function list(rev) {
  return execSync(`git ls-tree -r --name-only ${rev}`, { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
}

function show(rev, file) {
  try {
    return execSync(`git show ${rev}:${file}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

function category(file) {
  if (!file.endsWith('.ts')) {
    return null;
  }
  if (file.startsWith('test/') || file.startsWith('dist/') || file.includes('node_modules/')) {
    return null;
  }
  if (file.startsWith('vscode/')) {
    return 'vscode';
  }
  if (file.startsWith('plugins/')) {
    return 'plugin';
  }
  if (file === 'src/main.ts' || file.startsWith('src/host/')) {
    return 'assembly';
  }
  if (file.startsWith('src/')) {
    return 'kernel';
  }
  return null;
}

function linesOf(text) {
  if (text.length === 0) {
    return 0;
  }
  return text.split(/\r?\n/).length;
}

/** 圈复杂度用一个固定的数法：1 + if/for/while/case/catch/&&/||/? 的次数。注释先去掉。 */
function complexity(text) {
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const matches = stripped.match(/\b(if|for|while|case|catch)\b|&&|\|\||\?/g);
  return 1 + (matches ? matches.length : 0);
}

function duty(text) {
  const block = text.match(/\/\*\*([\s\S]*?)\*\//);
  if (block) {
    const line = block[1]
      .split(/\r?\n/)
      .map((item) => item.replace(/^\s*\*\s?/, '').trim())
      .find((item) => item.length > 0);
    return line ?? '';
  }
  const single = text.match(/^\s*\/\/\s*(.+)$/m);
  return single ? single[1].trim() : '';
}

function collect(rev) {
  const rows = [];
  for (const file of list(rev)) {
    const kind = category(file);
    if (kind === null) {
      continue;
    }
    const text = show(rev, file);
    if (text === null) {
      continue;
    }
    rows.push({
      file,
      kind,
      lines: linesOf(text),
      complexity: complexity(text),
      duty: duty(text),
    });
  }
  return rows;
}

function sum(rows, kind, field) {
  return rows.filter((row) => row.kind === kind).reduce((total, row) => total + row[field], 0);
}

const before = collect(FROM);
const after = collect(TO);
const kinds = ['kernel', 'assembly', 'plugin', 'vscode'];
const title = {
  kernel: '内核',
  assembly: '装配处',
  plugin: '插件',
  vscode: 'VSCode 扩展',
};

const lines = [];
lines.push('# 规模');
lines.push('');
lines.push(`由 \`scripts/metrics.mjs\` 对比 \`${FROM}\` 和 \`${TO}\` 生成，没有手填。`);
lines.push('只数 `.ts` 源文件。测试、`node_modules`、`dist` 不算。VSCode 扩展单独列，不进 CLI 的增量。');
lines.push('圈复杂度按「1 + if / for / while / case / catch / && / || / ?」计，先去掉注释。');
lines.push('');
lines.push('| 分类 | final 行数 | HEAD 行数 | 行数差 | final 圈复杂度 | HEAD 圈复杂度 | 圈复杂度差 |');
lines.push('|---|---:|---:|---:|---:|---:|---:|');
for (const kind of kinds) {
  const oldLines = sum(before, kind, 'lines');
  const newLines = sum(after, kind, 'lines');
  const oldCx = sum(before, kind, 'complexity');
  const newCx = sum(after, kind, 'complexity');
  lines.push(
    `| ${title[kind]} | ${oldLines} | ${newLines} | ${newLines - oldLines} | ${oldCx} | ${newCx} | ${newCx - oldCx} |`,
  );
}
lines.push('');
lines.push('## 文件');
lines.push('');
lines.push('| 文件 | 分类 | 行数 | 圈复杂度 | 文件头注释 |');
lines.push('|---|---|---:|---:|---|');
for (const row of after) {
  const note = row.duty.replace(/\|/g, '/');
  lines.push(`| \`${row.file}\` | ${title[row.kind]} | ${row.lines} | ${row.complexity} | ${note} |`);
}

mkdirSync('docs/metrics', { recursive: true });
writeFileSync('docs/metrics/report.md', `${lines.join('\n')}\n`);
console.log('wrote docs/metrics/report.md');
