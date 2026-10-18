import { describe, expect, it } from 'vitest';

import { Document } from '../../src/model/Document';
import { DuplicateIdError } from '../../src/model/DuplicateIdError';
import { Group } from '../../src/model/Group';
import { NoSuchShapeError } from '../../src/model/NoSuchShapeError';
import { Rect } from '../../src/model/Rect';
import { TextShape } from '../../src/model/TextShape';
import { Circle } from '../../src/model/Circle';

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

describe('P2 Document（Receiver）', () => {
  it('登记图形后能按 id 找到，并维护父子关系', () => {
    const document = sampleDocument();
    expect(document.has('c1')).toBe(true);
    expect(document.require('c1').parent?.label()).toBe('g#markers');
    expect(document.children()).toHaveLength(3);
  });

  it('找不到的 id 抛 NoSuchShapeError', () => {
    const document = sampleDocument();
    expect(document.has('r9')).toBe(false);
    expect(() => document.require('r9')).toThrow(NoSuchShapeError);
  });

  it('id 重复时抛 DuplicateIdError 且不改变状态', () => {
    const document = sampleDocument();
    const before = document.countShapes();
    expect(() => document.add(new Circle('c1', 0, 0, 1))).toThrow(DuplicateIdError);
    expect(document.countShapes()).toBe(before);
    expect(document.children()).toHaveLength(3);
  });

  it('countShapes 统计全部子孙（用于 save 的 (n elements)）', () => {
    expect(sampleDocument().countShapes()).toBe(5);
  });

  it('canvas 尺寸可读写', () => {
    const document = new Document(800, 600);
    document.resize(1024, 768);
    expect(document.width).toBe(1024);
    expect(document.height).toBe(768);
  });

  it('空文档渲染为自闭合 svg', () => {
    expect(new Document(800, 600).toSvg()).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" ' +
        'viewBox="0 0 800 600"/>',
    );
  });

  it('渲染整份文档时按层级缩进', () => {
    expect(sampleDocument().toSvg()).toBe(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">',
        '  <rect id="bg" x="0" y="0" width="800" height="600" fill="#ffffff"/>',
        '  <text id="title" x="20" y="40">My Diagram</text>',
        '  <g id="markers">',
        '    <circle id="c1" cx="100" cy="100" r="20" fill="red"/>',
        '    <rect id="box" x="200" y="80" width="60" height="60" fill="#3366ff"/>',
        '  </g>',
        '</svg>',
      ].join('\n'),
    );
  });
});
