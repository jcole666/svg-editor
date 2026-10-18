import { describe, expect, it } from 'vitest';

import { Session } from '../../src/app/Session';
import { CommandRegistry } from '../../src/commands/CommandRegistry';
import { UsageError } from '../../src/commands/UsageError';
import { Tokenizer } from '../../src/cli/Tokenizer';
import { InvalidNumberError } from '../../src/model/InvalidNumberError';
import { NoDocumentError } from '../../src/model/NoDocumentError';
import { NoSuchShapeError } from '../../src/model/NoSuchShapeError';

function createRunner(): (line: string) => string[] {
  const session = new Session();
  const registry = new CommandRegistry();
  const tokenizer = new Tokenizer();

  return (line: string): string[] => {
    const tokens = tokenizer.tokenize(line);
    const [name, ...args] = tokens;
    const spec = registry.get(name);
    if (spec === undefined) {
      throw new Error(`unknown command: ${name}`);
    }
    return spec.create(args, session).execute();
  };
}

describe('P2 只读命令与文档命令', () => {
  it('init 无参数使用 800x600', () => {
    expect(createRunner()('init')).toEqual(['canvas 800x600 created']);
  });

  it('init 带参数生效', () => {
    expect(createRunner()('init 1024 768')).toEqual(['canvas 1024x768 created']);
  });

  it('init 参数非法时报数值错误', () => {
    expect(() => createRunner()('init abc')).toThrow(InvalidNumberError);
  });

  it('init 参数过多时报用法错误', () => {
    expect(() => createRunner()('init 1 2 3')).toThrow(UsageError);
  });

  it('未 init 就执行 tree 报 no document', () => {
    expect(() => createRunner()('tree')).toThrow(NoDocumentError);
    expect(() => createRunner()('tree')).toThrow(
      "no document. use 'init' or 'read' first",
    );
  });

  it('init 之后 tree 输出画布头', () => {
    const run = createRunner();
    run('init');
    expect(run('tree')).toEqual(['svg (800x600)']);
  });

  it('canvas 无参数显示尺寸，带参数修改', () => {
    const run = createRunner();
    run('init');
    expect(run('canvas')).toEqual(['canvas 800x600']);
    expect(run('canvas 1024 768')).toEqual(['canvas 1024x768']);
    expect(run('canvas')).toEqual(['canvas 1024x768']);
  });

  it('canvas 只给一个参数时报用法错误', () => {
    const run = createRunner();
    run('init');
    expect(() => run('canvas 100')).toThrow(UsageError);
  });

  it('show 缺参数 / 多余参数都报用法错误', () => {
    const run = createRunner();
    run('init');
    expect(() => run('show')).toThrow(UsageError);
    expect(() => run('show a b')).toThrow(UsageError);
  });

  it('show / tree 指向不存在的 id 报 no such shape', () => {
    const run = createRunner();
    run('init');
    expect(() => run('show r9')).toThrow(NoSuchShapeError);
    expect(() => run('tree r9')).toThrow(NoSuchShapeError);
  });

  it('help 列出已注册命令与用法', () => {
    const lines = createRunner()('help');
    expect(lines[0]).toBe('commands:');
    const text = lines.join('\n');
    expect(text).toContain('init [w] [h]');
    expect(text).toContain('canvas [w] [h]');
    expect(text).toContain('tree [id]');
    expect(text).toContain('show <id>');
    expect(text).toContain('help');
    expect(text).toContain('exit | quit');
  });

  it('注册表能区分已注册与未注册命令', () => {
    const registry = new CommandRegistry();
    expect(registry.get('init')).toBeDefined();
    expect(registry.get('create')).toBeUndefined();
  });
});
