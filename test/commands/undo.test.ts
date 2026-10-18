import { describe, expect, it } from 'vitest';

import { NothingToRedoError } from '../../src/app/NothingToRedoError';
import { NothingToUndoError } from '../../src/app/NothingToUndoError';
import { UndoNotAllowedError } from '../../src/app/UndoNotAllowedError';
import { createRunner } from '../helpers';

describe('P5 undo/redo（Command 模式版本）', () => {
  describe('基本撤销 / 重做', () => {
    it('move 的 undo 回显 "moved back to"（对齐 §6）', () => {
      const run = createRunner();
      run('init');
      run('create circle c1 100 100 20');
      run('move c1 30 0');

      expect(run('undo')).toEqual(['circle#c1 moved back to (100,100)']);
      expect(run('show c1')[1]).toBe('  cx=100 cy=100 r=20');
    });

    it('redo 重新执行并把反馈原样再报一次（对齐 §6）', () => {
      const run = createRunner();
      run('init');
      run('create circle c1 100 100 20');
      run('move c1 30 0');
      run('undo');

      expect(run('redo')).toEqual(['circle#c1 moved to (130,100)']);
      expect(run('show c1')[1]).toBe('  cx=130 cy=100 r=20');
    });

    it('容器 move 的 undo 回显 "moved back by"（对齐 §6.1）', () => {
      const run = createRunner();
      run('init');
      run('create g node2');
      run('create rect process 520 100 160 60 in node2');

      run('move node2 0 100');
      expect(run('undo')).toEqual(['g#node2 moved back by (0,-100)']);
      expect(run('show process')[1]).toBe('  x=520 y=100 w=160 h=60');
    });

    it('delete 的 undo 把图形恢复到原父容器（对齐 §6）', () => {
      const run = createRunner();
      run('init');
      run('create g markers');
      run('create rect box 200 80 60 60 in markers');
      run('delete box');

      expect(run('undo')).toEqual(['rect#box restored into g#markers']);
      expect(run('show box')[0]).toBe('rect#box  parent=g#markers');
    });

    it('delete 的 undo 恢复到画布根时报 svg', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 0 0 10 10');
      run('delete r1');
      expect(run('undo')).toEqual(['rect#r1 restored into svg']);
    });

    it('set 的 undo 恢复旧值（对齐 §6）', () => {
      const run = createRunner();
      run('init');
      run('create text title 20 40 "My Diagram"');
      run('set title text "My Diagram v2"');

      expect(run('undo')).toEqual(['text#title updated: text="My Diagram"']);
      expect(run('show title')[1]).toBe('  (20,40) "My Diagram"');
    });

    it('set 的 undo 能删掉原本不存在的属性', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 0 0 10 10');
      run('set r1 fill red');

      expect(run('undo')).toEqual(['rect#r1 updated: fill removed']);
      expect(run('show r1')).toEqual(['rect#r1  parent=svg', '  x=0 y=0 w=10 h=10']);
    });

    it('create 的 undo 把图形移除', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 0 0 10 10');

      expect(run('undo')).toEqual(['rect#r1 creation undone']);
      expect(run('tree')).toEqual(['svg (800x600)']);
    });

    it('scale 的 undo 精确还原几何（不做反向乘法）', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 10 20 100 50');
      run('scale r1 3');

      run('undo');
      // 若用 ×3 再 ÷3，这里会得到 9.999999999999998 之类的值
      expect(run('show r1')[1]).toBe('  x=10 y=20 w=100 h=50');
    });

    it('scale 的 undo 反馈为反向因子', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 10 20 100 50');
      run('scale r1 2');
      expect(run('undo')).toEqual(['rect#r1 scaled back by 0.5']);
    });
  });

  describe('栈的行为', () => {
    it('undo 后若有新编辑，redo 栈清空（§3）', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 0 0 10 10');
      run('move r1 10 0');
      run('undo');

      run('move r1 0 99'); // 新编辑
      expect(() => run('redo')).toThrow(NothingToRedoError);
    });

    it('连续多次 undo 按后进先出回退', () => {
      const run = createRunner();
      run('init');
      run('create circle c1 100 100 20');
      run('move c1 10 0');
      run('move c1 0 10');

      run('undo');
      expect(run('show c1')[1]).toBe('  cx=110 cy=100 r=20');
      run('undo');
      expect(run('show c1')[1]).toBe('  cx=100 cy=100 r=20');
    });

    it('一次 group 式命令整体是一个 undo 单元（这里以 create 容器+子节点两步验证粒度）', () => {
      const run = createRunner();
      run('init');
      run('create g g1');
      // create g 与 create rect 是两条编辑命令 → 两个 undo 单元
      run('create rect r 1 2 3 4 in g1');
      run('undo');
      expect(run('tree')).toEqual(['svg (800x600)', '└── g#g1']);
    });

    it('撤销栈为空时报 nothing to undo', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 0 0 10 10');
      run('undo');
      expect(() => run('undo')).toThrow(NothingToUndoError);
    });

    it('重做栈为空时报 nothing to redo', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 0 0 10 10');
      expect(() => run('redo')).toThrow(NothingToRedoError);
    });
  });

  describe('文档类命令对撤销的影响（§4.3）', () => {
    it('init 之后 undo 被禁止', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 0 0 10 10');
      run('init');
      expect(() => run('undo')).toThrow(UndoNotAllowedError);
      expect(() => run('undo')).toThrow('undo not allowed after io command');
    });

    it('canvas 修改尺寸之后 undo 被禁止', () => {
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

    it('redo 同样在文档类命令之后被禁止', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 0 0 10 10');
      run('move r1 5 5');
      run('undo');
      run('canvas 1024 768');
      expect(() => run('redo')).toThrow(UndoNotAllowedError);
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
  });
});
