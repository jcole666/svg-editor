import { describe, expect, it } from 'vitest';

import { Document } from '../../src/model/Document';
import { Group } from '../../src/model/Group';
import { Circle } from '../../src/model/Circle';
import { Rect } from '../../src/model/Rect';
import { TextShape } from '../../src/model/TextShape';
import { ShapeDetailRenderer } from '../../src/view/ShapeDetailRenderer';
import { TreeRenderer } from '../../src/view/TreeRenderer';

function sampleDocument(): Document {
  const document = new Document(800, 600);
  const background = new Rect('bg', 0, 0, 800, 600);
  background.setAttr('fill', '#ffffff');
  const title = new TextShape('title', 20, 40, 'My Diagram');
  const markers = new Group('markers');
  const circle = new Circle('c1', 100, 100, 20);
  circle.setAttr('fill', 'red');
  const box = new Rect('box', 200, 80, 60, 60);
  box.setAttr('fill', '#3366ff');

  document.add(background);
  document.add(title);
  document.add(markers);
  document.add(circle, markers);
  document.add(box, markers);
  return document;
}

describe('P2 文本渲染', () => {
  it('tree 输出复现任务书 §5.1 的结构', () => {
    expect(new TreeRenderer().renderDocument(sampleDocument())).toEqual([
      'svg (800x600)',
      '├── rect#bg     x=0 y=0 w=800 h=600 fill=#ffffff',
      '├── text#title  (20,40) "My Diagram"',
      '└── g#markers',
      '    ├── circle#c1  cx=100 cy=100 r=20 fill=red',
      '    └── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff',
    ]);
  });

  it('tree <id> 只输出以该 id 为根的子树', () => {
    const document = sampleDocument();
    const lines = new TreeRenderer().renderSubtree(document.require('markers'));
    expect(lines).toEqual([
      'g#markers',
      '├── circle#c1  cx=100 cy=100 r=20 fill=red',
      '└── rect#box   x=200 y=80 w=60 h=60 fill=#3366ff',
    ]);
  });

  it('空文档的 tree 只有一行画布尺寸', () => {
    expect(new TreeRenderer().renderDocument(new Document(800, 600))).toEqual(['svg (800x600)']);
  });

  it('嵌套容器的连线符保持连续', () => {
    const document = new Document(100, 100);
    const outer = new Group('outer');
    const inner = new Group('inner');
    const rect = new Rect('r', 1, 2, 3, 4);
    document.add(outer);
    document.add(inner, outer);
    document.add(rect, inner);

    expect(new TreeRenderer().renderDocument(document)).toEqual([
      'svg (100x100)',
      '└── g#outer',
      '    └── g#inner',
      '        └── rect#r  x=1 y=2 w=3 h=4',
    ]);
  });

  it('show 输出复现任务书 §5.2 的格式', () => {
    const document = sampleDocument();
    expect(new ShapeDetailRenderer().render(document.require('c1'))).toEqual([
      'circle#c1  parent=g#markers',
      '  cx=100 cy=100 r=20',
      '  fill=red',
    ]);
  });

  it('根级图形的 parent 显示为 svg', () => {
    const document = sampleDocument();
    expect(new ShapeDetailRenderer().render(document.require('bg'))[0]).toBe(
      'rect#bg  parent=svg',
    );
  });
});
