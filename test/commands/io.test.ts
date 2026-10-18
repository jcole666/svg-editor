import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { UndoNotAllowedError } from '../../src/app/UndoNotAllowedError';
import { UsageError } from '../../src/commands/UsageError';
import { CannotReadFileError } from '../../src/io/CannotReadFileError';
import { CannotWriteFileError } from '../../src/io/CannotWriteFileError';
import { createRunner } from '../helpers';

const OTHER_SVG = path.join('examples', 'other.svg');

function tempDirectory(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'svg-editor-cmd-'));
}

describe('P7 read / save 命令', () => {
  it('read 先打印警告再打印摘要（对齐 §6）', () => {
    const run = createRunner();
    expect(run(`read ${OTHER_SVG}`)).toEqual([
      'warning: assigned id rect1 to unnamed <rect>',
      `read ${OTHER_SVG} (7 elements)`,
    ]);
  });

  it('read 之后 tree 结构与 §6 一致', () => {
    const run = createRunner();
    run(`read ${OTHER_SVG}`);
    expect(run('tree')[0]).toBe('svg (400x300)');
    expect(run('tree')).toContain('├── rect#rect1  x=0 y=0 w=400 h=300 fill=#ffffff');
  });

  it('read 不存在的文件报 cannot read file', () => {
    const run = createRunner();
    expect(() => run('read no-such-file.svg')).toThrow(CannotReadFileError);
    expect(() => run('read no-such-file.svg')).toThrow('cannot read file: no-such-file.svg');
  });

  it('save 到指定路径并回显元素数（对齐 §6）', () => {
    const run = createRunner();
    run('init 800 600');
    run('create rect bg 0 0 800 600 #ffffff');
    run('create text title 20 40 "My Diagram"');

    const target = path.join(tempDirectory(), 'demo.svg');
    expect(run(`save ${target}`)).toEqual([`saved to ${target} (2 elements)`]);
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.readFileSync(target, 'utf8')).toContain('<rect id="bg"');
  });

  it('save 无参数时保存到 read 的路径', () => {
    const run = createRunner();
    const target = path.join(tempDirectory(), 'copy.svg');

    run(`read ${OTHER_SVG}`);
    run(`save ${target}`);
    // 再改一点内容，用无参数 save 应写回同一路径
    run('set c1 cx 60');
    expect(run('save')).toEqual([`saved to ${target} (7 elements)`]);
    expect(fs.readFileSync(target, 'utf8')).toContain('cx="60"');
  });

  it('save 无参数且从未 read/save 过时报用法错误', () => {
    const run = createRunner();
    run('init');
    expect(() => run('save')).toThrow(UsageError);
  });

  it('save 到不可写路径报 cannot write file', () => {
    const run = createRunner();
    run('init');
    const bad = path.join(tempDirectory(), 'no-such-dir', 'x.svg');
    expect(() => run(`save ${bad}`)).toThrow(CannotWriteFileError);
    expect(() => run(`save ${bad}`)).toThrow(`cannot write file: ${bad}`);
  });

  it('read 之后 undo 被禁止（§4.3）', () => {
    const run = createRunner();
    run('init');
    run('create rect r1 0 0 10 10');
    run(`read ${OTHER_SVG}`);
    expect(() => run('undo')).toThrow(UndoNotAllowedError);
  });

  it('save 之后 undo 被禁止（§4.3）', () => {
    const run = createRunner();
    run('init');
    run('create rect r1 0 0 10 10');
    run(`save ${path.join(tempDirectory(), 'a.svg')}`);
    expect(() => run('undo')).toThrow('undo not allowed after io command');
  });

  it('read 覆盖当前文档（不追加）', () => {
    const run = createRunner();
    run('init');
    run('create rect r1 0 0 10 10');
    run(`read ${OTHER_SVG}`);
    expect(run('tree')).not.toContain('rect#r1');
    expect(run('tree')[0]).toBe('svg (400x300)');
  });

  it('参数个数不对报用法错误', () => {
    const run = createRunner();
    run('init');
    expect(() => run('read')).toThrow(UsageError);
    expect(() => run('save a.svg b.svg')).toThrow(UsageError);
  });
});
