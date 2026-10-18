import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { SvgReader } from '../../src/io/SvgReader';
import { SvgWriter } from '../../src/io/SvgWriter';
import { XmlParser } from '../../src/io/XmlParser';
import { TreeRenderer } from '../../src/view/TreeRenderer';

const OTHER_SVG = path.join('examples', 'other.svg');

function tempDirectory(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'svg-editor-io-'));
}

describe('P7 XML 解析', () => {
  const parser = new XmlParser();

  it('解析自闭合标签与嵌套元素', () => {
    const root = parser.parse('<svg><g><rect id="a" x="1"/></g></svg>');
    expect(root.name).toBe('svg');
    expect(root.children[0].name).toBe('g');
    expect(root.children[0].children[0].attribute('x')).toBe('1');
  });

  it('跳过 XML 声明与注释', () => {
    const root = parser.parse('<?xml version="1.0"?>\n<!-- hi -->\n<svg width="10"/>');
    expect(root.name).toBe('svg');
    expect(root.attribute('width')).toBe('10');
  });

  it('支持单引号属性值', () => {
    const root = parser.parse("<svg width='20'/>");
    expect(root.attribute('width')).toBe('20');
  });

  it('解码实体', () => {
    const root = parser.parse('<svg><text>a &amp; b &lt; c &#65;</text></svg>');
    expect(root.children[0].text).toBe('a & b < c A');
  });

  it('标签不匹配时报错', () => {
    expect(() => parser.parse('<svg><g></svg>')).toThrow();
  });
});

describe('P7 SVG 读取', () => {
  it('读 other.svg：补 id 并给出警告（对齐 §6）', () => {
    const result = new SvgReader().readFile(OTHER_SVG);

    expect(result.warnings).toEqual(['warning: assigned id rect1 to unnamed <rect>']);
    expect(result.document.countShapes()).toBe(7);
    expect(result.document.width).toBe(400);
    expect(result.document.height).toBe(300);
  });

  it('读 other.svg：结构树与 §6 一致', () => {
    const result = new SvgReader().readFile(OTHER_SVG);
    expect(new TreeRenderer().renderDocument(result.document)).toEqual([
      'svg (400x300)',
      '├── rect#rect1  x=0 y=0 w=400 h=300 fill=#ffffff',
      '├── text#t1     (10,290) "imported"',
      '├── circle#c1   cx=50 cy=50 r=10',
      '├── g#g1',
      '│   ├── rect#r2    x=0 y=0 w=10 h=10',
      '│   └── circle#c2  cx=5 cy=5 r=2',
      '└── ellipse#e1  cx=1 cy=2 rx=3 ry=4',
    ]);
  });

  it('自动补的 id 不会撞上文件里已有的 id', () => {
    const source =
      '<svg width="10" height="10"><rect id="rect1" x="0" y="0" width="1" height="1"/>' +
      '<rect x="1" y="1" width="1" height="1"/></svg>';
    const result = new SvgReader().readSource(source);
    expect(result.warnings).toEqual(['warning: assigned id rect2 to unnamed <rect>']);
  });

  it('没有 width/height 时回退到 viewBox', () => {
    const result = new SvgReader().readSource('<svg viewBox="0 0 320 240"/>');
    expect(result.document.width).toBe(320);
    expect(result.document.height).toBe(240);
  });

  it('text 内容去掉首尾空白并保留中间空格', () => {
    const result = new SvgReader().readSource('<svg><text id="t" x="0" y="0">  hello  world  </text></svg>');
    expect(result.document.require('t').attributeSummary()).toBe('(0,0) "hello  world"');
  });

  it('未知标签被忽略但不会导致失败', () => {
    const result = new SvgReader().readSource(
      '<svg width="10" height="10"><defs><rect id="x" width="1" height="1"/></defs><circle id="c" cx="1" cy="1" r="1"/></svg>',
    );
    expect(result.document.countShapes()).toBe(1);
    expect(result.document.has('c')).toBe(true);
  });

  it('根元素不是 svg 时报错', () => {
    expect(() => new SvgReader().readSource('<html/>')).toThrow();
  });
});

describe('P7 SVG 写出与 round-trip', () => {
  it('输出以 XML 声明开头并包含 svg 元素', () => {
    const result = new SvgReader().readFile(OTHER_SVG);
    const text = new SvgWriter().toText(result.document);
    expect(text.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(text).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"');
    expect(text.endsWith('\n')).toBe(true);
  });

  it('save 后再 read 回来，结构树完全一致', () => {
    const reader = new SvgReader();
    const writer = new SvgWriter();
    const first = reader.readFile(OTHER_SVG);

    const directory = tempDirectory();
    const saved = path.join(directory, 'roundtrip.svg');
    writer.writeFile(first.document, saved);

    const second = reader.readFile(saved);
    expect(second.warnings).toEqual([]);
    expect(new TreeRenderer().renderDocument(second.document)).toEqual(
      new TreeRenderer().renderDocument(first.document),
    );
  });

  it('未知属性在 round-trip 中保留', () => {
    const reader = new SvgReader();
    const writer = new SvgWriter();
    const result = reader.readSource(
      '<svg width="10" height="10"><text id="t" x="0" y="0" font-size="16" fill="red">hi</text></svg>',
    );

    const directory = tempDirectory();
    const saved = path.join(directory, 'attrs.svg');
    writer.writeFile(result.document, saved);

    expect(fs.readFileSync(saved, 'utf8')).toContain('font-size="16"');
  });
});
