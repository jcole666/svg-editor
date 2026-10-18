import { describe, expect, it } from 'vitest';

import { Session } from '../../src/app/Session';
import { CommandRegistry } from '../../src/commands/CommandRegistry';

type ExpectedKind = 'edit' | 'io' | 'display' | 'display-or-io';

/**
 * 任务书 §3 的完整命令表。这张表同时也是文档里"命令 × 能力覆盖矩阵"的来源：
 * 一旦有人新增命令却忘了分类，这个测试会先红。
 */
const SPEC_COMMANDS: ReadonlyArray<readonly [string, ExpectedKind]> = [
  // 文档类
  ['init', 'io'],
  ['read', 'io'],
  ['save', 'io'],
  ['canvas', 'display-or-io'],
  // 图形编辑类
  ['create', 'edit'],
  ['delete', 'edit'],
  ['move', 'edit'],
  ['scale', 'edit'],
  ['set', 'edit'],
  ['group', 'edit'],
  ['ungroup', 'edit'],
  ['addto', 'edit'],
  ['front', 'edit'],
  ['back', 'edit'],
  // 显示类
  ['tree', 'display'],
  ['show', 'display'],
  ['help', 'display'],
  // 撤销重做
  ['undo', 'display'],
  ['redo', 'display'],
];

function kindOf(name: string, args: string[]): string {
  const registry = new CommandRegistry();
  const session = new Session();
  const spec = registry.get(name);
  if (spec === undefined) {
    throw new Error(`command not registered: ${name}`);
  }
  return spec.create(args, session).kind ?? 'display';
}

describe('P9 命令覆盖矩阵', () => {
  it('注册表恰好包含任务书 §3 的全部命令（不缺、不多）', () => {
    const registry = new CommandRegistry();
    const registered = registry
      .all()
      .map((spec) => spec.name)
      .sort();
    const expected = SPEC_COMMANDS.map(([name]) => name).sort();
    expect(registered).toEqual(expected);
  });

  it('每条命令都有非空的 usage 与 description（help 依赖它们）', () => {
    const registry = new CommandRegistry();
    for (const spec of registry.all()) {
      expect(spec.usage.length, `${spec.name} 的 usage 不能为空`).toBeGreaterThan(0);
      expect(spec.description.length, `${spec.name} 的 description 不能为空`).toBeGreaterThan(0);
    }
  });

  for (const [name, expectedKind] of SPEC_COMMANDS) {
    if (expectedKind === 'display-or-io') {
      it(`canvas：无参数是 display，带参数是 io`, () => {
        expect(kindOf('canvas', [])).toBe('display');
        expect(kindOf('canvas', ['1024', '768'])).toBe('io');
      });
      continue;
    }

    it(`${name} 的分类是 ${expectedKind}`, () => {
      expect(kindOf(name, [])).toBe(expectedKind);
    });
  }

  it('可撤销命令恰好是 §3 的 10 条图形编辑类', () => {
    const registry = new CommandRegistry();
    const edits = registry.all().filter((spec) => {
      const session = new Session();
      return (spec.create([], session).kind ?? 'display') === 'edit';
    });
    expect(edits.map((spec) => spec.name).sort()).toEqual(
      ['addto', 'back', 'create', 'delete', 'front', 'group', 'move', 'scale', 'set', 'ungroup'].sort(),
    );
  });
});
