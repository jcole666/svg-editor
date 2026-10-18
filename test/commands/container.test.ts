import { describe, expect, it } from 'vitest';

import { UsageError } from '../../src/commands/UsageError';
import { CannotGroupDescendantError } from '../../src/model/CannotGroupDescendantError';
import { CannotUngroupTopLevelError } from '../../src/model/CannotUngroupTopLevelError';
import { DuplicateIdError } from '../../src/model/DuplicateIdError';
import { NotAContainerError } from '../../src/model/NotAContainerError';
import { createRunner } from '../helpers';

describe('P6 容器命令', () => {
  describe('group', () => {
    it('新建容器并保持收入顺序（对齐 §6）', () => {
      const run = createRunner();
      run('init');
      run('create circle c1 100 100 20 red');
      run('create rect box 200 80 60 60 #3366ff');

      expect(run('group markers c1 box')).toEqual(['g#markers created with 2 children']);
      expect(run('tree')).toEqual([
        'svg (800x600)',
        '└── g#markers',
        '    ├── circle#c1  cx=100 cy=100 r=20 fill=red',
        '    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff',
      ]);
    });

    it('新容器放在第一个图形原来的位置', () => {
      const run = createRunner();
      run('init');
      run('create rect a 0 0 1 1');
      run('create rect b 1 1 1 1');
      run('create rect c 2 2 1 1');

      run('group middle b c');
      expect(run('tree')).toEqual([
        'svg (800x600)',
        '├── rect#a    x=0 y=0 w=1 h=1',
        '└── g#middle',
        '    ├── rect#b  x=1 y=1 w=1 h=1',
        '    └── rect#c  x=2 y=2 w=1 h=1',
      ]);
    });

    it('禁止把容器和它自己的子孙分到同一组（§4.2）', () => {
      const run = createRunner();
      run('init');
      run('create circle c1 100 100 20');
      run('group markers c1');

      expect(() => run('group bad c1 markers')).toThrow(CannotGroupDescendantError);
      expect(() => run('group bad c1 markers')).toThrow(
        'cannot group a container into its own descendant: markers',
      );
    });

    it('新 id 重复报 id already exists', () => {
      const run = createRunner();
      run('init');
      run('create rect a 0 0 1 1');
      run('create rect b 1 1 1 1');
      expect(() => run('group a b')).toThrow(DuplicateIdError);
    });

    it('参数不足报用法错误', () => {
      const run = createRunner();
      run('init');
      expect(() => run('group onlyGid')).toThrow(UsageError);
    });

    it('undo 把图形按原位置放回', () => {
      const run = createRunner();
      run('init');
      run('create rect a 0 0 1 1');
      run('create rect b 1 1 1 1');
      run('create rect c 2 2 1 1');
      run('group middle b c');

      run('undo');
      expect(run('tree')).toEqual([
        'svg (800x600)',
        '├── rect#a  x=0 y=0 w=1 h=1',
        '├── rect#b  x=1 y=1 w=1 h=1',
        '└── rect#c  x=2 y=2 w=1 h=1',
      ]);
    });
  });

  describe('ungroup', () => {
    const build = (): ((line: string) => string[]) => {
      const run = createRunner();
      run('init');
      run('create g outer');
      run('create g inner in outer');
      run('create rect r 1 2 3 4 in inner');
      return run;
    };

    it('子图形提升到父级并占据容器位置（§3）', () => {
      const run = build();
      expect(run('ungroup inner')).toEqual(['g#inner ungrouped into g#outer (1 child)']);
      expect(run('tree')).toEqual([
        'svg (800x600)',
        '└── g#outer',
        '    └── rect#r  x=1 y=2 w=3 h=4',
      ]);
    });

    it('画布根级容器不允许 ungroup（§4.2）', () => {
      const run = createRunner();
      run('init');
      run('create g scene');
      expect(() => run('ungroup scene')).toThrow(CannotUngroupTopLevelError);
      expect(() => run('ungroup scene')).toThrow('cannot ungroup top-level container: scene');
    });

    it('对非容器图形报 not a container', () => {
      const run = createRunner();
      run('init');
      run('create rect r 0 0 1 1');
      expect(() => run('ungroup r')).toThrow(NotAContainerError);
    });

    it('undo 重新组装容器与子节点顺序', () => {
      const run = build();
      run('ungroup inner');
      run('undo');
      expect(run('tree')).toEqual([
        'svg (800x600)',
        '└── g#outer',
        '    └── g#inner',
        '        └── rect#r  x=1 y=2 w=3 h=4',
      ]);
    });
  });

  describe('addto', () => {
    it('把图形移到容器末尾', () => {
      const run = createRunner();
      run('init');
      run('create g g1');
      run('create rect a 0 0 1 1');
      expect(run('addto g1 a')).toEqual(['rect#a added to g#g1']);
      expect(run('show a')[0]).toBe('rect#a  parent=g#g1');
    });

    it('目标不是容器报 not a container', () => {
      const run = createRunner();
      run('init');
      run('create rect a 0 0 1 1');
      run('create rect b 1 1 1 1');
      expect(() => run('addto a b')).toThrow(NotAContainerError);
    });

    it('禁止把容器挪进自己的后代', () => {
      const run = createRunner();
      run('init');
      run('create g outer');
      run('create g inner in outer');
      expect(() => run('addto inner outer')).toThrow(CannotGroupDescendantError);
    });

    it('undo 把图形放回原位', () => {
      const run = createRunner();
      run('init');
      run('create rect a 0 0 1 1');
      run('create g g1');
      run('addto g1 a');

      run('undo');
      expect(run('tree')).toEqual([
        'svg (800x600)',
        '├── rect#a  x=0 y=0 w=1 h=1',
        '└── g#g1',
      ]);
    });
  });

  describe('front / back', () => {
    const build = (): ((line: string) => string[]) => {
      const run = createRunner();
      run('init');
      run('create rect a 0 0 1 1');
      run('create rect b 1 1 1 1');
      run('create rect c 2 2 1 1');
      return run;
    };

    it('back 放到同级最前（数组最前）', () => {
      const run = build();
      expect(run('back c')).toEqual(['rect#c sent to back']);
      expect(run('tree')).toEqual([
        'svg (800x600)',
        '├── rect#c  x=2 y=2 w=1 h=1',
        '├── rect#a  x=0 y=0 w=1 h=1',
        '└── rect#b  x=1 y=1 w=1 h=1',
      ]);
    });

    it('front 放到同级最后（数组末尾）', () => {
      const run = build();
      expect(run('front a')).toEqual(['rect#a brought to front']);
      expect(run('tree')).toEqual([
        'svg (800x600)',
        '├── rect#b  x=1 y=1 w=1 h=1',
        '├── rect#c  x=2 y=2 w=1 h=1',
        '└── rect#a  x=0 y=0 w=1 h=1',
      ]);
    });

    it('只在同级内调整，不影响其它层级', () => {
      const run = createRunner();
      run('init');
      run('create g g1');
      run('create rect x 0 0 1 1 in g1');
      run('create rect y 1 1 1 1 in g1');
      run('back y');
      expect(run('tree g1')).toEqual([
        'g#g1',
        '├── rect#y  x=1 y=1 w=1 h=1',
        '└── rect#x  x=0 y=0 w=1 h=1',
      ]);
    });

    it('undo 恢复原下标', () => {
      const run = build();
      run('back c');
      run('undo');
      expect(run('tree')).toEqual([
        'svg (800x600)',
        '├── rect#a  x=0 y=0 w=1 h=1',
        '├── rect#b  x=1 y=1 w=1 h=1',
        '└── rect#c  x=2 y=2 w=1 h=1',
      ]);
    });

    it('参数个数不对报用法错误', () => {
      const run = build();
      expect(() => run('front')).toThrow(UsageError);
      expect(() => run('back a b')).toThrow(UsageError);
    });
  });
});
