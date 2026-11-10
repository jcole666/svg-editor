import { describe, expect, it } from 'vitest';

import { badgeFor } from '../../vscode/svg-outline/src/badge';
import { parseOutline } from '../../vscode/svg-outline/src/outline';

const SAMPLE = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">',
  '  <g id="flow">',
  '    <rect id="start" x="20" y="20" width="120" height="60"/>',
  '    <g id="nested">',
  '      <text x="30" y="50">Hello SVG</text>',
  '    </g>',
  '  </g>',
  '</svg>',
  '',
].join('\n');

describe('SVG 大纲', () => {
  it('嵌套分组，有 id 显示成标签#id，没有 id 只显示标签', () => {
    const [svg] = parseOutline(SAMPLE);
    expect(svg.name).toBe('svg');
    expect(svg.children.map((node) => node.name)).toEqual(['g#flow']);
    const flow = svg.children[0];
    expect(flow.children.map((node) => node.name)).toEqual(['rect#start', 'g#nested']);
    expect(flow.children[1].children.map((node) => node.name)).toEqual(['text']);
  });

  it('点 rect#start 能对上源码那一行', () => {
    const rect = parseOutline(SAMPLE)[0].children[0].children[0];
    expect(rect.name).toBe('rect#start');
    expect(rect.startLine).toBe(2);
    expect(SAMPLE.split('\n')[rect.startLine]).toContain('<rect id="start"');
  });

  it('改完内容以后范围跟着变', () => {
    const before = parseOutline(SAMPLE)[0].children[0].children[0];
    const edited = SAMPLE.replace('x="20"', 'x="40"');
    const after = parseOutline(edited)[0].children[0].children[0];
    expect(after.startLine).toBe(before.startLine);
    expect(edited.split('\n')[after.startLine]).toContain('x="40"');
    const shifted = `\n${SAMPLE}`;
    expect(parseOutline(shifted)[0].children[0].children[0].startLine).toBe(before.startLine + 1);
  });

  it('XML 写了一半就清空，不抛错', () => {
    expect(parseOutline('<svg><rect id="start"')).toEqual([]);
    expect(parseOutline('<svg><g></svg>')).toEqual([]);
  });
});

describe('SVG 文件标记', () => {
  it('只给 svg 文件加 []', () => {
    expect(badgeFor('fixtures/example.svg', false)).toBe('[]');
    expect(badgeFor('fixtures/plain.txt', false)).toBeUndefined();
    expect(badgeFor('fixtures/example.svg', true)).toBeUndefined();
    expect(badgeFor('NOTES.SVG', false)).toBe('[]');
  });
});
