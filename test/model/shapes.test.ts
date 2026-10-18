import { describe, expect, it } from 'vitest';

import { Circle } from '../../src/model/Circle';
import { Ellipse } from '../../src/model/Ellipse';
import { Group } from '../../src/model/Group';
import { Line } from '../../src/model/Line';
import { Rect } from '../../src/model/Rect';
import { TextShape } from '../../src/model/TextShape';
import { UnknownAttributeError } from '../../src/model/UnknownAttributeError';

function withFill(shape: Rect | Circle, fill: string): Rect | Circle {
  shape.setAttr('fill', fill);
  return shape;
}

describe('P1 图形数据模型', () => {
  describe('SVG 渲染（每种图形对齐任务书 §4.1 片段）', () => {
    it('rect 渲染 id / 几何 / fill', () => {
      const rect = new Rect('r1', 10, 20, 100, 50);
      rect.setAttr('fill', '#eee');
      expect(rect.toSvg(0)).toBe(
        '<rect id="r1" x="10" y="20" width="100" height="50" fill="#eee"/>',
      );
    });

    it('circle 渲染', () => {
      const circle = new Circle('c1', 100, 100, 20);
      circle.setAttr('fill', 'red');
      expect(circle.toSvg(0)).toBe('<circle id="c1" cx="100" cy="100" r="20" fill="red"/>');
    });

    it('ellipse 渲染', () => {
      expect(new Ellipse('e1', 1, 2, 3, 4).toSvg(0)).toBe(
        '<ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>',
      );
    });

    it('line 渲染（stroke 出现在 SVG 属性里）', () => {
      const line = new Line('arrow1', 280, 130, 520, 130);
      line.setAttr('stroke', 'black');
      expect(line.toSvg(0)).toBe(
        '<line id="arrow1" x1="280" y1="130" x2="520" y2="130" stroke="black"/>',
      );
    });

    it('text 内容作为子文本并做转义', () => {
      expect(new TextShape('t1', 20, 40, 'My Diagram').toSvg(0)).toBe(
        '<text id="t1" x="20" y="40">My Diagram</text>',
      );
      expect(new TextShape('t2', 0, 0, 'a & b < c').toSvg(0)).toBe(
        '<text id="t2" x="0" y="0">a &amp; b &lt; c</text>',
      );
    });

    it('空容器自闭合', () => {
      expect(new Group('scene').toSvg(0)).toBe('<g id="scene"/>');
    });

    it('容器嵌套子节点时按层缩进', () => {
      const group = new Group('markers');
      group.addChild(withFill(new Circle('c1', 100, 100, 20), 'red'));
      expect(group.toSvg(0)).toBe(
        ['<g id="markers">', '  <circle id="c1" cx="100" cy="100" r="20" fill="red"/>', '</g>'].join(
          '\n',
        ),
      );
    });

    it('小数坐标不带多余 0', () => {
      expect(new Rect('r', 1.5, 2.25, 3, 4).toSvg(0)).toBe(
        '<rect id="r" x="1.5" y="2.25" width="3" height="4"/>',
      );
    });
  });

  describe('tree 行内摘要（对齐任务书 §5.1 / §6.1）', () => {
    it('rect 摘要显示几何与 fill', () => {
      const rect = new Rect('bg', 0, 0, 800, 600);
      rect.setAttr('fill', '#ffffff');
      expect(rect.label()).toBe('rect#bg');
      expect(rect.attributeSummary()).toBe('x=0 y=0 w=800 h=600 fill=#ffffff');
    });

    it('line 摘要不含 stroke（依据 §6.1 的 tree 输出）', () => {
      const line = new Line('arrow1', 280, 130, 520, 130);
      line.setAttr('stroke', 'black');
      expect(line.attributeSummary()).toBe('(280,130) -> (520,130)');
      // 但 show 明细里 stroke 必须还在
      expect(line.detailLines()).toContain('stroke=black');
    });

    it('text 摘要为 (x,y) "内容"', () => {
      expect(new TextShape('title', 20, 40, 'My Diagram').attributeSummary()).toBe(
        '(20,40) "My Diagram"',
      );
    });

    it('容器摘要没有几何', () => {
      expect(new Group('markers').attributeSummary()).toBe('');
    });
  });

  describe('move / scale', () => {
    it('叶子图形平移与缩放', () => {
      const rect = new Rect('r', 10, 20, 100, 50);
      rect.moveBy(30, -5);
      expect(rect.geometrySummary()).toBe('x=40 y=15 w=100 h=50');
      rect.scaleBy(2);
      expect(rect.geometrySummary()).toBe('x=80 y=30 w=200 h=100');
    });

    it('容器把动作递归转发给子孙（Composite 语义）', () => {
      const group = new Group('node2');
      const rect = new Rect('process', 520, 100, 160, 60);
      const label = new TextShape('process-label', 545, 135, '处理数据');
      group.addChild(rect);
      group.addChild(label);

      group.moveBy(0, 100);
      expect(rect.geometrySummary()).toBe('x=520 y=200 w=160 h=60');
      expect(label.geometrySummary()).toBe('(545,235) "处理数据"');
    });

    it('容器与叶子暴露同一套方法（统一操作）', () => {
      const group = new Group('g');
      const rect = new Rect('r', 10, 10, 10, 10);
      group.addChild(rect);
      // 同一个 moveBy 调用，对容器和对叶子都成立
      const targets = [group, rect];
      for (const target of targets) {
        target.scaleBy(3);
      }
      expect(rect.geometrySummary()).toBe('x=90 y=90 w=90 h=90');
    });
  });

  describe('set 白名单', () => {
    it('允许设置公共样式与自身几何属性', () => {
      const rect = new Rect('r', 0, 0, 10, 10);
      rect.setAttr('fill', 'blue');
      rect.setAttr('stroke-width', '2');
      rect.setAttr('width', '99');
      expect(rect.getAttr('fill')).toBe('blue');
      expect(rect.getAttr('stroke-width')).toBe('2');
      expect(rect.getAttr('width')).toBe('99');
    });

    it('text 的文本内容用 text 属性设置', () => {
      const text = new TextShape('t', 0, 0, 'old');
      text.setAttr('text', 'new');
      expect(text.getAttr('text')).toBe('new');
      expect(text.attributeSummary()).toBe('(0,0) "new"');
    });

    it('白名单外的属性抛 UnknownAttributeError', () => {
      expect(() => new Rect('r', 0, 0, 1, 1).setAttr('opacity', '0.5')).toThrow(
        UnknownAttributeError,
      );
    });

    it('容器没有几何属性，只有样式可设', () => {
      const group = new Group('g');
      expect(() => group.setAttr('x', '1')).toThrow(UnknownAttributeError);
      group.setAttr('fill', 'red');
      expect(group.attributeSummary()).toBe('fill=red');
    });
  });

  describe('clone（为 P5 的 undo 快照做准备）', () => {
    it('克隆是深拷贝，改副本不影响原件', () => {
      const group = new Group('g');
      const rect = new Rect('r', 10, 10, 20, 20);
      rect.setAttr('fill', 'red');
      group.addChild(rect);

      const copy = group.clone() as Group;
      const copiedRect = copy.children()[0] as Rect;

      expect(copiedRect).not.toBe(rect);
      expect(copiedRect.geometrySummary()).toBe(rect.geometrySummary());

      copiedRect.moveBy(100, 100);
      expect(rect.geometrySummary()).toBe('x=10 y=10 w=20 h=20');
      expect(copiedRect.getAttr('fill')).toBe('red');
    });

    it('克隆后父子指针指向副本而不是原件', () => {
      const group = new Group('g');
      group.addChild(new Rect('r', 0, 0, 1, 1));
      const copy = group.clone() as Group;
      expect(copy.children()[0].parent).toBe(copy);
    });
  });

  describe('Group 结构维护', () => {
    it('addChild 维护父子指针，removeChild 解除', () => {
      const group = new Group('g');
      const rect = new Rect('r', 0, 0, 1, 1);
      group.addChild(rect);
      expect(rect.parent).toBe(group);
      expect(group.removeChild(rect)).toBe(0);
      expect(rect.parent).toBeNull();
    });

    it('contains 能判断深层子孙', () => {
      const outer = new Group('outer');
      const inner = new Group('inner');
      const rect = new Rect('r', 0, 0, 1, 1);
      outer.addChild(inner);
      inner.addChild(rect);
      expect(outer.contains(rect)).toBe(true);
      expect(inner.contains(outer)).toBe(false);
    });
  });
});
