import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { createBuiltinHub } from '../../src/host/builtinHub';
import { PluginLoader } from '../../src/host/PluginLoader';

const FIXTURES = path.join('test', 'fixtures', 'plugins');

function writeConfig(body: unknown): string {
  const file = path.join(FIXTURES, `.config-${process.pid}-${Math.random().toString(16).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify(body));
  return file;
}

async function load(body: unknown): Promise<{ lines: string[]; names: string[] }> {
  const lines: string[] = [];
  const hub = createBuiltinHub();
  const loader = new PluginLoader({ write: (line) => lines.push(line) });
  const file = writeConfig(body);
  try {
    await loader.loadConfig(file, hub);
  } finally {
    fs.rmSync(file, { force: true });
  }
  return { lines, names: hub.commands.all().map((spec) => spec.name) };
}

describe('插件加载器', () => {
  it('模块找不到时继续加载后面的插件', async () => {
    const result = await load({
      plugins: [{ module: './missing-plugin' }, { module: './ok' }],
    });
    expect(result.lines).toEqual(['error: plugin not found: ./missing-plugin']);
    expect(result.names).toContain('ok');
  });

  it('没有默认导出', async () => {
    const result = await load({
      plugins: [{ module: './no-default' }],
    });
    expect(result.lines[0]).toContain('error: plugin has no default export:');
  });

  it('activate 抛错，已经登记的命令要撤掉', async () => {
    const result = await load({
      plugins: [
        { module: './half' },
        { module: './ok' },
      ],
    });
    expect(result.lines.some((line) => line.startsWith('error: plugin failed to activate:'))).toBe(true);
    expect(result.lines.some((line) => line.includes('(boom)'))).toBe(true);
    expect(result.names).not.toContain('half');
    expect(result.names).toContain('ok');
  });

  it('清单和实际注册不一致时撤回', async () => {
    const result = await load({
      plugins: [{ module: './mismatch' }],
    });
    expect(result.lines[0]).toContain('error: plugin manifest mismatch: @svgframe/plugin-mismatch');
    expect(result.lines[0]).toContain('declared:');
    expect(result.lines[0]).toContain('registered:');
    expect(result.names).not.toContain('actual');
  });

  it('重复注册时撤回这个插件，内置命令还在', async () => {
    const lines: string[] = [];
    const hub = createBuiltinHub();
    const loader = new PluginLoader({ write: (line) => lines.push(line) });
    const file = writeConfig({ plugins: [{ module: './dup' }] });
    try {
      await loader.loadConfig(file, hub);
    } finally {
      fs.rmSync(file, { force: true });
    }
    expect(lines).toEqual(['error: duplicate registration: commands/init']);
    expect(hub.decorators.names()).not.toContain('temp-label');
    expect(hub.commands.get('init')?.description).toContain('空画布');
  });

  it('模块在，但是求值失败，不能报成找不到', async () => {
    const result = await load({
      plugins: [{ module: './bad-import' }],
    });
    expect(result.lines[0].startsWith('error: plugin failed to activate:')).toBe(true);
    expect(result.lines[0].includes('plugin not found')).toBe(false);
  });

  it('enabled 为 false 的项直接跳过，就算路径不存在也不报', async () => {
    const result = await load({
      plugins: [
        { module: './does-not-exist', enabled: false },
        { module: './ok' },
      ],
    });
    expect(result.lines).toEqual([]);
    expect(result.names).toContain('ok');
  });

  it('配置不合法时只用内置命令启动', async () => {
    const result = await load({ plugins: 'nope' });
    expect(result.lines).toEqual(['error: invalid plugin config']);
    expect(result.names).not.toContain('ok');
    expect(result.names).toContain('create');
  });

  it('options 会传给 activate', async () => {
    const hub = createBuiltinHub();
    const loader = new PluginLoader({ write: () => undefined });
    const file = writeConfig({
      plugins: [{ module: './options', options: { fill: '#f5a623' } }],
    });
    try {
      await loader.loadConfig(file, hub);
    } finally {
      fs.rmSync(file, { force: true });
    }
    const spec = hub.commands.get('opt');
    expect(spec?.description).toBe('#f5a623');
    expect(spec?.create([], hub.session).execute()).toEqual(['#f5a623']);
  });

  it('包名按 node 的模块解析，不在加载器里写死', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-pkg-'));
    const pkgDir = path.join(dir, 'node_modules', '@svgframe', 'plugin-demo');
    fs.mkdirSync(pkgDir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'temp' }));
    fs.writeFileSync(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({
        name: '@svgframe/plugin-demo',
        main: 'index.mjs',
        contributes: { commands: ['pkgdemo'] },
      }),
    );
    fs.writeFileSync(
      path.join(pkgDir, 'index.mjs'),
      [
        'export default class DemoPlugin {',
        '  activate(ctx) {',
        '    ctx.registerCommand({',
        "      name: 'pkgdemo', usage: 'pkgdemo', description: 'pkg',",
        "      create: () => ({ execute: () => ['pkgdemo'] }),",
        '    });',
        '  }',
        '}',
      ].join('\n'),
    );

    const lines: string[] = [];
    const hub = createBuiltinHub();
    const configFile = path.join(dir, 'plugins.config.json');
    fs.writeFileSync(configFile, JSON.stringify({ plugins: [{ module: '@svgframe/plugin-demo' }] }));
    await new PluginLoader({ write: (line) => lines.push(line) }).loadConfig(configFile, hub);
    expect(lines).toEqual([]);
    expect(hub.commands.get('pkgdemo')?.create([], hub.session).execute()).toEqual(['pkgdemo']);
  });
});
