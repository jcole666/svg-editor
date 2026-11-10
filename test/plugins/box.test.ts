import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { CommandExecutor } from '../../src/app/CommandExecutor';
import { Tokenizer } from '../../src/cli/Tokenizer';
import type { AttributeHandler } from '../../src/extension/AttributeHandler';
import { ExtensionHub } from '../../src/extension/ExtensionHub';
import { createBuiltinHub } from '../../src/host/builtinHub';
import { SvgReader } from '../../src/io/SvgReader';
import { SvgWriter } from '../../src/io/SvgWriter';
import { CreateCommand } from '../../src/commands/CreateCommand';
import { InitCommand } from '../../src/commands/InitCommand';
import { SetCommand } from '../../src/commands/SetCommand';
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

describe('box', () => {
  it('创建、fill、label 各自是一个 undo', () => {
    const hub = createBuiltinHub();
    new BoxPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init 800 600');
    expect(go('create box n1 120 100 160 60 "开始"')).toEqual([
      'box#n1 created (g#n1 + rect#n1-rect + text#n1-label)',
    ]);
    expect(go('tree n1')).toEqual([
      'g#n1 (box)',
      '├── rect#n1-rect   x=120 y=100 w=160 h=60 fill=#4a90d9',
      '└── text#n1-label  (140,135) "开始"',
    ]);

    expect(go('set n1 fill #f5a623')).toEqual(['box#n1 fill propagated to n1-rect']);
    expect(go('undo')).toEqual(['box#n1 fill restored on n1-rect']);
    expect(go('redo')).toEqual(['box#n1 fill propagated to n1-rect']);

    expect(go('set n1 label "处理数据 v2"')).toEqual(['box#n1 label updated: "处理数据 v2"']);
    expect(go('undo')).toEqual(['box#n1 label restored: "开始"']);
    expect(hub.session.document?.require('n1-label').getAttr('text')).toBe('开始');
    expect(go('redo')).toEqual(['box#n1 label updated: "处理数据 v2"']);
  });

  it('不依赖别的插件也能创建和改 label', () => {
    const hub = new ExtensionHub();
    new BoxPlugin().activate(hub.pluginContext());
    hub.commands.register({
      name: 'init',
      usage: 'init',
      description: 'init',
      create: (args, session) => new InitCommand(args, session),
    });
    hub.commands.register({
      name: 'create',
      usage: 'create',
      description: 'create',
      create: (args, session) => new CreateCommand(args, session, hub.shapes),
    });
    hub.commands.register({
      name: 'set',
      usage: 'set',
      description: 'set',
      create: (args, session) => new SetCommand(args, session, hub.attributes),
    });
    const go = run(hub);
    go('init');
    expect(go('create box n1 0 0 40 20 "a"')[0]).toContain('box#n1 created');
    expect(go('set n1 label "b"')).toEqual(['box#n1 label updated: "b"']);
  });
});

describe('box 和文档命令', () => {
  function ready(): { hub: ExtensionHub; go: (line: string) => string[] } {
    const hub = createBuiltinHub();
    new BoxPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init 800 600');
    go('create box n1 120 100 160 60 "开始"');
    go('create box n2 520 100 160 60 "处理数据"');
    go('create line arrow1 280 130 520 130 black');
    go('group flowchart n1 n2 arrow1');
    return { hub, go };
  }

  it('ungroup 被拒绝，必要子部件不能单独拿走', () => {
    const { hub, go } = ready();
    expect(() => go('ungroup n1')).toThrow('cannot ungroup composite shape: n1');
    expect(() => go('delete n1-rect')).toThrow('cannot modify composite shape structure: n1');
    expect(() => go('addto flowchart n1-label')).toThrow('cannot modify composite shape structure: n1');
    expect(hub.session.document?.require('n1').childShapes().map((child) => child.id)).toEqual([
      'n1-rect',
      'n1-label',
    ]);
    expect(go('move n2 0 100')).toEqual(['box#n2 moved by (0,100)']);
    expect(go('undo')).toEqual(['box#n2 moved back by (0,-100)']);
  });

  it('子部件 id 冲突时整条命令失败', () => {
    const hub = createBuiltinHub();
    new BoxPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init');
    go('create rect n1-rect 0 0 1 1');
    expect(() => go('create box n1 0 0 10 10 "x"')).toThrow('id already exists: n1-rect');
    expect(hub.session.document?.has('n1')).toBe(false);
  });

  it('可以再往里面放别的图形', () => {
    const hub = createBuiltinHub();
    new BoxPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init');
    go('create box n1 0 0 40 20 "a"');
    expect(go('create circle c 1 1 1 in n1')).toEqual(['circle#c created in box#n1']);
    expect(go('delete c')).toEqual(['circle#c deleted']);
  });

  it('序列化带 data-kind，没装插件时读回变成普通 g', () => {
    const { hub } = ready();
    const document = hub.session.document;
    if (document === undefined || document === null) {
      throw new Error('missing document');
    }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-box-'));
    const file = path.join(dir, 'box.svg');
    new SvgWriter().writeFile(document, file);
    const text = fs.readFileSync(file, 'utf8');
    expect(text).toContain('data-kind="box"');

    const plain = new SvgReader(createBuiltinHub().shapes).readFile(file);
    expect(plain.document.require('n1').typeName()).toBe('g');
    expect(plain.document.require('n1-rect').typeName()).toBe('rect');

    const again = new SvgReader(hub.shapes).readFile(file);
    expect(again.document.require('n1').typeName()).toBe('box');
    expect(again.document.require('n1').canUngroup()).toBe(false);
  });

  it('缺子部件或 id 重复时拒绝整份读入，原文档还在', () => {
    const hub = createBuiltinHub();
    new BoxPlugin().activate(hub.pluginContext());
    const go = run(hub);
    go('init');
    go('create rect keep 0 0 1 1');

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-box-bad-'));
    const broken = path.join(dir, 'broken.svg');
    fs.writeFileSync(
      broken,
      '<svg width="10" height="10"><g id="n1" data-kind="box"><rect id="n1-rect" x="0" y="0" width="1" height="1"/></g></svg>',
    );
    expect(() => go(`read ${broken}`)).toThrow('cannot read box: n1');
    expect(hub.session.document?.has('keep')).toBe(true);

    const duplicated = path.join(dir, 'dup.svg');
    fs.writeFileSync(
      duplicated,
      '<svg width="10" height="10"><rect id="a" x="0" y="0" width="1" height="1"/><rect id="a" x="1" y="1" width="1" height="1"/></svg>',
    );
    expect(() => go(`read ${duplicated}`)).toThrow('id already exists: a');
    expect(hub.session.document?.has('keep')).toBe(true);
  });
});

describe('属性处理器的契约', () => {
  function rectHub(): { hub: ExtensionHub; go: (line: string) => string[] } {
    const hub = createBuiltinHub();
    const go = run(hub);
    go('init');
    go('create rect r1 0 0 10 10');
    return { hub, go };
  }

  it('没有处理器时还是原来的白名单', () => {
    const { go } = rectHub();
    expect(go('set r1 fill red')).toEqual(['rect#r1 updated: fill=red']);
    expect(() => go('set r1 label nope')).toThrow('unknown attribute: label');
  });

  it('两个处理器同时命中就拒绝，文档不变', () => {
    const { hub, go } = rectHub();
    const both = (name: string): AttributeHandler => ({
      name,
      handles: (shape, attribute) => shape.typeName() === 'rect' && attribute === 'fill',
      apply: () => ({ summary: name, undoSummary: name }),
    });
    hub.attributes.register(both('one'));
    hub.attributes.register(both('two'));
    expect(() => go('set r1 fill red')).toThrow('conflicting attribute handlers: fill');
    expect(hub.session.document?.require('r1').getAttr('fill')).toBeUndefined();
    expect(go('undo')).toEqual(['rect#r1 creation undone']);
  });

  it('改到一半抛错就回滚，这次 set 不进栈', () => {
    const { hub, go } = rectHub();
    const handler: AttributeHandler = {
      name: 'boom',
      handles: (shape, attribute) => shape.typeName() === 'rect' && attribute === 'fill',
      apply: (shape) => {
        shape.setAttr('fill', 'red');
        shape.setAttr('stroke', 'blue');
        throw new Error('partial');
      },
    };
    hub.attributes.register(handler);
    expect(() => go('set r1 fill red')).toThrow('partial');
    const rect = hub.session.document?.require('r1');
    expect(rect?.getAttr('fill')).toBeUndefined();
    expect(rect?.getAttr('stroke')).toBeUndefined();
    expect(go('undo')).toEqual(['rect#r1 creation undone']);
  });
});
