import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { CommandExecutor } from '../../src/app/CommandExecutor';
import { Tokenizer } from '../../src/cli/Tokenizer';
import { createBuiltinHub } from '../../src/host/builtinHub';
import { PluginLoader } from '../../src/host/PluginLoader';
import { DirCommand } from '../../plugins/command-dir/DirCommand';
import type { DirectoryListing } from '../../plugins/command-dir/DirectoryListing';
import { NodeFsDirectoryListing } from '../../plugins/command-dir/NodeFsDirectoryListing';

const SAMPLE: DirectoryListing = {
  list: () => [
    { name: 'package.json', kind: 'file' },
    { name: 'docs', kind: 'dir' },
    { name: '.hidden', kind: 'file' },
    { name: 'plugins', kind: 'dir' },
    { name: 'demo.svg', kind: 'file' },
    { name: 'alias', kind: 'link' },
  ],
};

describe('dir', () => {
  it('替身：目录在前、文件在后，隐藏项保留，链接不跟随', () => {
    const command = new DirCommand([], SAMPLE, () => 'C:\\work');
    expect(command.execute()).toEqual([
      '[DIR]  docs',
      '[DIR]  plugins',
      '[FILE]  .hidden',
      '[FILE]  demo.svg',
      '[FILE]  package.json',
      '[LINK]  alias',
    ]);
  });

  it('空目录', () => {
    const command = new DirCommand([], { list: () => [] }, () => '.');
    expect(command.execute()).toEqual(['(empty directory)']);
  });

  it('读失败时带上目录路径', () => {
    const command = new DirCommand(
      [],
      {
        list: () => {
          throw new Error('cannot read directory: C:\\missing');
        },
      },
      () => 'C:\\missing',
    );
    expect(() => command.execute()).toThrow('cannot read directory: C:\\missing');
  });

  it('真实目录：和适配器组合后的顺序稳定', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-dir-'));
    fs.mkdirSync(path.join(dir, 'docs'));
    fs.mkdirSync(path.join(dir, 'plugins'));
    fs.writeFileSync(path.join(dir, 'demo.svg'), '<svg/>');
    fs.writeFileSync(path.join(dir, 'package.json'), '{}');
    fs.writeFileSync(path.join(dir, '.hidden'), '');

    const command = new DirCommand([], new NodeFsDirectoryListing(), () => dir);
    expect(command.execute()).toEqual([
      '[DIR]  docs',
      '[DIR]  plugins',
      '[FILE]  .hidden',
      '[FILE]  demo.svg',
      '[FILE]  package.json',
    ]);
  });

  it('没 init 也能用，已有文档时不改 undo', () => {
    const hub = createBuiltinHub();
    const listing = new NodeFsDirectoryListing();
    hub.pluginContext().registerCommand({
      name: 'dir',
      usage: 'dir',
      description: 'dir',
      create: (args) => new DirCommand(args, listing, () => os.tmpdir()),
    });
    const tokenizer = new Tokenizer();
    const executor = new CommandExecutor(hub.session);
    const go = (line: string) => {
      const [name, ...args] = tokenizer.tokenize(line);
      const spec = hub.commands.get(name);
      if (spec === undefined) {
        throw new Error(`unknown command: ${name}`);
      }
      return executor.execute(spec.create(args, hub.session));
    };

    expect(go('dir').length).toBeGreaterThan(0);
    go('init');
    go('create rect a 0 0 1 1');
    go('dir');
    expect(go('undo')).toEqual(['rect#a creation undone']);
    expect(go('tree')).toEqual(['svg (800x600)']);
  });

  it('读目录失败也不动文档', () => {
    const hub = createBuiltinHub();
    hub.pluginContext().registerCommand({
      name: 'dir',
      usage: 'dir',
      description: 'dir',
      create: (args) =>
        new DirCommand(
          args,
          {
            list: () => {
              throw new Error('cannot read directory: Z:\\nope');
            },
          },
          () => 'Z:\\nope',
        ),
    });
    const tokenizer = new Tokenizer();
    const executor = new CommandExecutor(hub.session);
    const go = (line: string) => {
      const [name, ...args] = tokenizer.tokenize(line);
      return executor.execute(hub.commands.get(name)!.create(args, hub.session));
    };
    go('init');
    go('create rect a 0 0 1 1');
    expect(() => go('dir')).toThrow('cannot read directory: Z:\\nope');
    expect(go('undo')).toEqual(['rect#a creation undone']);
  });

  it('两种装配对同一目录的输出逐字节相同', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-dir-same-'));
    fs.writeFileSync(path.join(dir, 'b.txt'), '');
    fs.mkdirSync(path.join(dir, 'a'));

    const configDir = path.join('test', 'fixtures');
    const config = path.join(configDir, `.dir-${process.pid}.json`);
    fs.writeFileSync(
      config,
      JSON.stringify({
        plugins: [{ module: '../../plugins/command-dir', options: { cwd: dir } }],
      }),
    );

    try {
      const coded = createBuiltinHub();
      await new PluginLoader({ write: () => undefined }).loadSpecifier(
        './plugins/command-dir',
        process.cwd(),
        coded,
        { cwd: dir },
      );
      const configured = createBuiltinHub();
      await new PluginLoader({ write: () => undefined }).loadConfig(config, configured);

      const text = (hub: ReturnType<typeof createBuiltinHub>) => {
        const spec = hub.commands.get('dir');
        if (spec === undefined) {
          throw new Error('dir missing');
        }
        return spec.create([], hub.session).execute().join('\n');
      };

      expect(text(configured)).toBe(text(coded));
      expect(text(coded)).toBe('[DIR]  a\n[FILE]  b.txt');
    } finally {
      fs.rmSync(config, { force: true });
    }
  });
});
