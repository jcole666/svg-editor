import { describe, expect, it } from 'vitest';

import { DuplicateIdError } from '../../src/model/DuplicateIdError';
import { createRunner } from '../helpers';

/**
 * 这两条是审查发现的真实 bug 的回归测试。
 *
 * 1) group 允许重复成员 → 同一对象进容器两次，save 写出重复 id 的非法 SVG
 * 2) ungroup 的 undo 重建了新容器对象 → 先前命令记的父引用指向孤儿节点
 *
 * 注意：§4.2 规定画布根级容器不能 ungroup，所以场景里把 outer 放在 root1 里。
 */
const NESTED_TREE = [
  'svg (800x600)',
  '└── g#root1',
  '    └── g#outer',
  '        ├── rect#a  x=0 y=0 w=1 h=1',
  '        └── rect#b  x=2 y=2 w=1 h=1',
];

/** 建好 root1 → outer → (a, b) 这棵树。 */
function buildNested(): (line: string) => string[] {
  const run = createRunner();
  run('init');
  run('create g root1');
  run('create g outer in root1');
  run('create rect a 0 0 1 1 in outer');
  run('create rect b 2 2 1 1 in outer');
  return run;
}

describe('容器命令的回归测试', () => {
  describe('group 不允许重复成员', () => {
    it('同一个 id 出现两次时报错，且不改变状态', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 0 0 1 1');

      expect(() => run('group g1 r1 r1')).toThrow(DuplicateIdError);
      expect(() => run('group g1 r1 r1')).toThrow('id already exists: r1');

      expect(run('tree')).toEqual(['svg (800x600)', '└── rect#r1  x=0 y=0 w=1 h=1']);
    });

    it('重复出现在中间也能拦住', () => {
      const run = createRunner();
      run('init');
      run('create rect a 0 0 1 1');
      run('create rect b 2 2 1 1');

      expect(() => run('group g a b a')).toThrow(DuplicateIdError);
      expect(run('tree')).toEqual([
        'svg (800x600)',
        '├── rect#a  x=0 y=0 w=1 h=1',
        '└── rect#b  x=2 y=2 w=1 h=1',
      ]);
    });

    it('正常分组不受影响', () => {
      const run = createRunner();
      run('init');
      run('create rect a 0 0 1 1');
      run('create rect b 2 2 1 1');

      expect(run('group g a b')).toEqual(['g#g created with 2 children']);
    });
  });

  describe('ungroup 的 undo 与先前命令的 undo 可以叠加', () => {
    it('front → ungroup → undo → undo：图形回到原容器', () => {
      const run = buildNested();
      run('front a'); // outer: [b, a]
      run('ungroup outer'); // root1: [b, a]
      run('undo'); // 重建 outer: [b, a]
      run('undo'); // 撤销 front：a 回到 outer 第 0 位

      expect(run('tree')).toEqual(NESTED_TREE);
    });

    it('delete → ungroup → undo → undo：被删图形回到原容器', () => {
      const run = buildNested();
      run('delete a'); // outer: [b]
      run('ungroup outer'); // root1: [b]
      run('undo'); // 重建 outer: [b]
      run('undo'); // 撤销 delete：a 回到 outer 第 0 位

      expect(run('tree')).toEqual(NESTED_TREE);
      expect(run('show a')[0]).toBe('rect#a  parent=g#outer');
    });

    it('ungroup 之后仍能在原位置重建，兄弟顺序不变', () => {
      const run = buildNested();
      run('ungroup outer');

      expect(run('undo')).toEqual(['g#outer regrouped with 2 children']);
      expect(run('tree')).toEqual(NESTED_TREE);
    });
  });
});
