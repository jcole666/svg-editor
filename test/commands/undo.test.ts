import { describe, expect, it } from 'vitest';

import { NothingToRedoError } from '../../src/app/NothingToRedoError';
import { NothingToUndoError } from '../../src/app/NothingToUndoError';
import { UndoNotAllowedError } from '../../src/app/UndoNotAllowedError';
import { createRunner } from '../helpers';

describe('P5 undo/redo（快照法版本）', () => {
  it('undo 还原上一步编辑', () => {
    const run = createRunner();
    run('init');
    run('create circle c1 100 100 20');
    run('move c1 30 0');
    expect(run('show c1')[1]).toBe('  cx=130 cy=100 r=20');

    run('undo');
    expect(run('show c1')[1]).toBe('  cx=100 cy=100 r=20');
  });

  it('redo 重新应用被撤销的编辑', () => {
    const run = createRunner();
    run('init');
    run('create circle c1 100 100 20');
    run('move c1 30 0');
    run('undo');
    run('redo');
    expect(run('show c1')[1]).toBe('  cx=130 cy=100 r=20');
  });

  it('undo 之后有新编辑，redo 栈清空', () => {
    const run = createRunner();
    run('init');
    run('create rect r1 0 0 10 10');
    run('move r1 10 0');
    run('undo');

    run('move r1 0 99'); // 新编辑
    expect(() => run('redo')).toThrow(NothingToRedoError);
  });

  it('文档类命令之后 undo 被禁止', () => {
    const run = createRunner();
    run('init');
    run('create rect r1 0 0 10 10');
    run('init'); // 文档类命令重新打开文档
    expect(() => run('undo')).toThrow(UndoNotAllowedError);
    expect(() => run('undo')).toThrow('undo not allowed after io command');
  });

  it('canvas 修改尺寸也算文档类命令，之后 undo 被禁止', () => {
    const run = createRunner();
    run('init');
    run('create rect r1 0 0 10 10');
    run('canvas 1024 768');
    expect(() => run('undo')).toThrow(UndoNotAllowedError);
  });

  it('canvas 只查询尺寸不影响撤销历史', () => {
    const run = createRunner();
    run('init');
    run('create rect r1 0 0 10 10');
    run('move r1 5 5');
    expect(run('canvas')).toEqual(['canvas 800x600']);
    run('undo');
    expect(run('show r1')[1]).toBe('  x=0 y=0 w=10 h=10');
  });

  it('下一次编辑命令重新解禁 undo', () => {
    const run = createRunner();
    run('init');
    run('create rect r1 0 0 10 10');
    run('canvas 1024 768');
    expect(() => run('undo')).toThrow(UndoNotAllowedError);

    run('create rect r2 0 0 5 5');
    run('undo');
    expect(run('tree')).toEqual(['svg (1024x768)', '└── rect#r1  x=0 y=0 w=10 h=10']);
  });

  it('撤销栈为空时报 nothing to undo', () => {
    const run = createRunner();
    run('init');
    run('create rect r1 0 0 10 10');
    run('undo');
    expect(() => run('undo')).toThrow(NothingToUndoError);
  });

  it('删除后 undo 能把整棵子树恢复（快照法的天然优势）', () => {
    const run = createRunner();
    run('init');
    run('create g g1');
    run('create rect r 1 2 3 4 in g1');
    run('delete g1');
    expect(run('tree')).toEqual(['svg (800x600)']);

    run('undo');
    expect(run('tree')).toEqual([
      'svg (800x600)',
      '└── g#g1',
      '    └── rect#r  x=1 y=2 w=3 h=4',
    ]);
  });
});
