import { PassThrough } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { CommandExecutor } from '../../src/app/CommandExecutor';
import { Repl } from '../../src/cli/Repl';
import { Tokenizer } from '../../src/cli/Tokenizer';
import type { ExtensionHub } from '../../src/extension/ExtensionHub';
import { createBuiltinHub } from '../../src/host/builtinHub';
import { activateCodedPlugins } from '../../src/host/codePlugins';
import { PluginLoader } from '../../src/host/PluginLoader';
import StatsPlugin from '../../plugins/command-stats/index';
import BoxPlugin from '../../plugins/shape-box/index';

function run(hub: ExtensionHub): (line: string) => string[] {
  const tokenizer = new Tokenizer();
  const executor = new CommandExecutor(hub.session);
  return (line: string) => {
    const [name, ...args] = tokenizer.tokenize(line);
    const spec = hub.commands.get(name);
    if (spec === undefined) {
      throw new Error(`unknown command: ${name}`);
    }
    return executor.execute(spec.create(args, hub.session));
  };
}

describe('stats', () => {
  it('没装插件时不是一条命令', () => {
    expect(createBuiltinHub().commands.get('stats')).toBeUndefined();
  });

  it('按首次出现的顺序数叶子，g 只算容器', () => {
    const hub = createBuiltinHub();
    new StatsPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init');
    go('create rect a 0 0 1 1');
    go('create rect b 0 0 1 1');
    go('create rect c 0 0 1 1');
    go('create circle d 0 0 1');
    go('create g g1');
    go('create text t1 0 0 "a" in g1');
    go('create text t2 0 0 "b" in g1');
    expect(go('stats')).toEqual(['rect: 3  circle: 1  text: 2  (total 6, containers 1)']);
  });

  it('空文档', () => {
    const hub = createBuiltinHub();
    new StatsPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init');
    expect(go('stats')).toEqual(['(total 0, containers 0)']);
  });

  it('box 自己算容器，里面的叶子照常计', () => {
    const hub = createBuiltinHub();
    new StatsPlugin().activate(hub.pluginContext());
    new BoxPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init');
    go('create box n1 120 100 160 60 "开始"');
    expect(go('stats')).toEqual(['rect: 1  text: 1  (total 2, containers 1)']);
  });

  it('不进 undo 栈', () => {
    const hub = createBuiltinHub();
    new StatsPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init');
    go('create rect a 0 0 1 1');
    go('stats');
    expect(go('undo')).toEqual(['rect#a creation undone']);
  });
});

describe('两种装配跑同一段输入', () => {
  it('代码装配和配置装配的输出一致', async () => {
    const lines = ['init 800 600', 'create rect bg 0 0 10 10', 'stats', 'exit'];

    const coded = createBuiltinHub();
    await activateCodedPlugins(coded, { write: () => undefined });
    const configured = createBuiltinHub();
    await new PluginLoader({ write: () => undefined }).loadConfig('plugins.config.json', configured);

    expect(await capture(configured, lines)).toBe(await capture(coded, lines));
  });
});

async function capture(hub: ExtensionHub, lines: readonly string[]): Promise<string> {
  const input = new PassThrough();
  const output = new PassThrough();
  let text = '';
  output.on('data', (chunk: Buffer) => {
    text += chunk.toString();
  });
  const repl = new Repl({ input, output }, hub);
  const done = repl.start();
  for (const line of lines) {
    input.write(`${line}\n`);
  }
  input.end();
  await done;
  return text;
}
