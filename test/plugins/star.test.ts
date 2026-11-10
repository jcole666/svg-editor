import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { CommandExecutor } from '../../src/app/CommandExecutor';
import { Tokenizer } from '../../src/cli/Tokenizer';
import type { ExtensionHub } from '../../src/extension/ExtensionHub';
import { createBuiltinHub } from '../../src/host/builtinHub';
import { SvgWriter } from '../../src/io/SvgWriter';
import BoxPlugin from '../../plugins/shape-box/index';
import ModifiedStarPlugin from '../../plugins/tree-modified-star/index';

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

describe('树标签', () => {
  it('刚 init 完没有星号，和没装插件的 tree 一样', () => {
    const plain = createBuiltinHub();
    const starred = createBuiltinHub();
    new ModifiedStarPlugin().activate(starred.pluginContext());
    run(plain)('init 800 600');
    run(starred)('init 800 600');
    expect(run(starred)('tree')).toEqual(run(plain)('tree'));
    expect(run(plain)('tree')).toEqual(['svg (800x600)']);
  });

  it('编辑、保存、再编辑、undo 回到保存点', () => {
    const hub = createBuiltinHub();
    new ModifiedStarPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init');
    go('create rect a 0 0 10 10');
    expect(go('tree').join('\n')).toContain('*');

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-star-'));
    const file = path.join(dir, 'a.svg');
    go(`save ${file}`);
    expect(go('tree').join('\n')).not.toContain('*');

    go('set a fill red');
    expect(go('tree').some((line) => line.includes('rect#a') && line.endsWith(' *'))).toBe(true);
    expect(go('tree')[0].endsWith(' *')).toBe(true);

    go('undo');
    expect(go('tree').join('\n')).not.toContain('*');
  });

  it('新建节点立刻标星，祖先也标', () => {
    const hub = createBuiltinHub();
    new ModifiedStarPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-star-'));
    go(`save ${path.join(dir, 'b.svg')}`);
    go('create g g1');
    go('create rect a 0 0 1 1 in g1');
    const lines = go('tree');
    expect(lines[0].endsWith(' *')).toBe(true);
    expect(lines.some((line) => line.includes('g#g1') && line.endsWith(' *'))).toBe(true);
    expect(lines.some((line) => line.includes('rect#a') && line.endsWith(' *'))).toBe(true);
  });

  it('(box) 和 * 可以同时出现，互不影响', () => {
    const hub = createBuiltinHub();
    new BoxPlugin().activate(hub.pluginContext());
    new ModifiedStarPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init');
    go('create box n1 0 0 40 20 "a"');
    const lines = go('tree');
    expect(lines.some((line) => line.includes('g#n1 (box) *'))).toBe(true);
    expect(lines.some((line) => line.includes('rect#n1-rect') && line.endsWith(' *'))).toBe(true);
  });

  it('保存后再读回来，星号以读入结果为干净状态', () => {
    const hub = createBuiltinHub();
    new ModifiedStarPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init');
    go('create rect a 0 0 10 10 red');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-star-'));
    const file = path.join(dir, 'c.svg');
    new SvgWriter().writeFile(hub.session.requireDocument(), file);
    go(`read ${file}`);
    expect(go('tree').join('\n')).not.toContain('*');
  });
});
