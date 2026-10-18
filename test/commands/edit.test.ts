import { describe, expect, it } from 'vitest';

import { UsageError } from '../../src/commands/UsageError';
import { InvalidScaleFactorError } from '../../src/model/InvalidScaleFactorError';
import { NoSuchShapeError } from '../../src/model/NoSuchShapeError';
import { UnknownAttributeError } from '../../src/model/UnknownAttributeError';
import { createRunner } from '../helpers';

describe('P4 编辑命令（本阶段无 undo）', () => {
  describe('move', () => {
    it('叶子图形回显绝对坐标（对齐 §6 的 moved to）', () => {
      const run = createRunner();
      run('init');
      run('create circle c1 100 100 20 red');
      expect(run('move c1 30 0')).toEqual(['circle#c1 moved to (130,100)']);
      expect(run('show c1')[1]).toBe('  cx=130 cy=100 r=20');
    });

    it('容器回显位移量（对齐 §6.1 的 moved by）', () => {
      const run = createRunner();
      run('init');
      run('create g node2');
      run('create rect process 520 100 160 60 #f5a623 in node2');
      run('create text process-label 545 135 "处理数据" in node2');

      expect(run('move node2 0 100')).toEqual(['g#node2 moved by (0,100)']);
      expect(run('tree node2')).toEqual([
        'g#node2',
        '├── rect#process        x=520 y=200 w=160 h=60 fill=#f5a623',
        '└── text#process-label  (545,235) "处理数据"',
      ]);
    });

    it('不存在的 id 报 no such shape', () => {
      const run = createRunner();
      run('init');
      expect(() => run('move r9 1 2')).toThrow(NoSuchShapeError);
    });

    it('参数个数不对报用法错误', () => {
      const run = createRunner();
      run('init');
      expect(() => run('move r1 1')).toThrow(UsageError);
      expect(() => run('move r1 1 2 3')).toThrow(UsageError);
    });
  });

  describe('scale', () => {
    it('叶子图形按因子缩放位置与尺寸', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 10 20 100 50');
      expect(run('scale r1 2')).toEqual(['rect#r1 scaled by 2']);
      expect(run('show r1')[1]).toBe('  x=20 y=40 w=200 h=100');
    });

    it('容器递归缩放每个子孙（Composite 语义）', () => {
      const run = createRunner();
      run('init');
      run('create g g1');
      run('create rect r 10 10 20 20 in g1');
      run('scale g1 3');
      expect(run('show r')[1]).toBe('  x=30 y=30 w=60 h=60');
    });

    it('非正因子报 scale factor must be positive', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 10 20 100 50');
      expect(() => run('scale r1 0')).toThrow(InvalidScaleFactorError);
      expect(() => run('scale r1 -1')).toThrow('scale factor must be positive');
      // 失败不改变几何
      expect(run('show r1')[1]).toBe('  x=10 y=20 w=100 h=50');
    });
  });

  describe('set', () => {
    it('设置公共样式与几何属性', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 10 20 100 50');
      expect(run('set r1 fill #eee')).toEqual(['rect#r1 updated: fill=#eee']);
      expect(run('set r1 width 200')).toEqual(['rect#r1 updated: width=200']);
      expect(run('show r1')).toEqual([
        'rect#r1  parent=svg',
        '  x=10 y=20 w=200 h=50',
        '  fill=#eee',
      ]);
    });

    it('设置 text 内容时回显带引号（对齐 §6）', () => {
      const run = createRunner();
      run('init');
      run('create text title 20 40 "My Diagram"');
      expect(run('set title text "My Diagram v2"')).toEqual([
        'text#title updated: text="My Diagram v2"',
      ]);
      expect(run('show title')[1]).toBe('  (20,40) "My Diagram v2"');
    });

    it('白名单外的属性报 unknown attribute', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 10 20 100 50');
      expect(() => run('set r1 opacity 0.5')).toThrow(UnknownAttributeError);
      expect(() => run('set r1 opacity 0.5')).toThrow('unknown attribute: opacity');
    });

    it('给矩形设别的类型的几何属性也属未知属性', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 10 20 100 50');
      expect(() => run('set r1 cx 5')).toThrow('unknown attribute: cx');
    });

    it('容器没有几何属性', () => {
      const run = createRunner();
      run('init');
      run('create g g1');
      expect(() => run('set g1 x 1')).toThrow('unknown attribute: x');
      expect(run('set g1 fill red')).toEqual(['g#g1 updated: fill=red']);
    });

    it('参数个数不对报用法错误', () => {
      const run = createRunner();
      run('init');
      expect(() => run('set r1 fill')).toThrow(UsageError);
      expect(() => run('set r1 fill a b')).toThrow(UsageError);
    });
  });

  describe('delete', () => {
    it('删除叶子图形并从索引中移除', () => {
      const run = createRunner();
      run('init');
      run('create rect box 200 80 60 60');
      expect(run('delete box')).toEqual(['rect#box deleted']);
      expect(run('tree')).toEqual(['svg (800x600)']);
      expect(() => run('show box')).toThrow(NoSuchShapeError);
    });

    it('删除容器连同全部子孙一起消失', () => {
      const run = createRunner();
      run('init');
      run('create g g1');
      run('create rect r 1 2 3 4 in g1');
      run('create text t 5 6 "x" in g1');

      expect(run('delete g1')).toEqual(['g#g1 deleted']);
      expect(run('tree')).toEqual(['svg (800x600)']);
      expect(() => run('show r')).toThrow(NoSuchShapeError);
      expect(() => run('show t')).toThrow(NoSuchShapeError);
    });

    it('删除后 id 可以复用', () => {
      const run = createRunner();
      run('init');
      run('create rect r1 1 2 3 4');
      run('delete r1');
      expect(run('create rect r1 10 20 30 40')).toEqual(['rect#r1 created']);
      expect(run('show r1')[1]).toBe('  x=10 y=20 w=30 h=40');
    });

    it('不存在的 id 报 no such shape', () => {
      const run = createRunner();
      run('init');
      expect(() => run('delete r9')).toThrow(NoSuchShapeError);
    });
  });

  describe('Composite 统一操作', () => {
    it('同一组命令对容器与叶子一视同仁', () => {
      const run = createRunner();
      run('init');
      run('create g box');
      run('create rect inner 0 0 10 10 in box');

      // 对容器和叶子都执行同样的四条命令，行为一致
      expect(run('move box 10 10')).toEqual(['g#box moved by (10,10)']);
      expect(run('scale box 2')).toEqual(['g#box scaled by 2']);
      expect(run('set box fill red')).toEqual(['g#box updated: fill=red']);
      expect(run('delete box')).toEqual(['g#box deleted']);
    });
  });
});
