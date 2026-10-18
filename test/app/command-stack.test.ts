import { describe, expect, it } from 'vitest';

import { CommandStack } from '../../src/app/CommandStack';
import { NothingToRedoError } from '../../src/app/NothingToRedoError';
import { NothingToUndoError } from '../../src/app/NothingToUndoError';
import { UndoNotAllowedError } from '../../src/app/UndoNotAllowedError';
import type { UndoableCommand } from '../../src/app/UndoableCommand';

/**
 * 调用者层（Invoker）的单元测试。
 *
 * 用假的命令对象替代真实 Receiver，只检验命令栈的编排行为：
 * 调用顺序、栈的增减、redo 清空、io 后禁止。对应 TDD 课件 p33
 * 「用 mock 命令验证『谁被调用、顺序如何』」。
 */
class FakeCommand implements UndoableCommand {
  readonly kind = 'edit' as const;

  constructor(
    private readonly name: string,
    private readonly log: string[],
  ) {}

  execute(): string[] {
    this.log.push(`execute:${this.name}`);
    return [`${this.name} executed`];
  }

  undo(): string[] {
    this.log.push(`undo:${this.name}`);
    return [`${this.name} undone`];
  }
}

function createStack(): { stack: CommandStack; log: string[] } {
  return { stack: new CommandStack(), log: [] };
}

describe('P9 调用者层：CommandStack 编排', () => {
  it('执行时调用 execute 并返回其输出', () => {
    const { stack, log } = createStack();
    const command = new FakeCommand('a', log);

    expect(stack.execute(command)).toEqual(['a executed']);
    expect(log).toEqual(['execute:a']);
  });

  it('undo 按后进先出调用各命令的 undo', () => {
    const { stack, log } = createStack();
    stack.execute(new FakeCommand('a', log));
    stack.execute(new FakeCommand('b', log));

    expect(stack.undo()).toEqual(['b undone']);
    expect(stack.undo()).toEqual(['a undone']);
    expect(log).toEqual(['execute:a', 'execute:b', 'undo:b', 'undo:a']);
  });

  it('redo 重新 execute 被撤销的命令，并放回 undo 栈', () => {
    const { stack, log } = createStack();
    stack.execute(new FakeCommand('a', log));
    stack.undo();

    expect(stack.redo()).toEqual(['a executed']);
    expect(log).toEqual(['execute:a', 'undo:a', 'execute:a']);
    // redo 之后还能再 undo
    expect(stack.undo()).toEqual(['a undone']);
  });

  it('执行新命令会清空 redo 栈', () => {
    const { stack, log } = createStack();
    stack.execute(new FakeCommand('a', log));
    stack.undo();
    stack.execute(new FakeCommand('b', log));

    expect(() => stack.redo()).toThrow(NothingToRedoError);
  });

  it('undo 后新命令之前的命令仍在 undo 栈里', () => {
    const { stack, log } = createStack();
    stack.execute(new FakeCommand('a', log));
    stack.execute(new FakeCommand('b', log));
    stack.undo(); // 撤销 b
    stack.execute(new FakeCommand('c', log)); // 新命令，清空 redo

    expect(stack.undo()).toEqual(['c undone']);
    expect(stack.undo()).toEqual(['a undone']);
  });

  it('空栈调用 undo / redo 报对应错误', () => {
    const { stack } = createStack();
    expect(() => stack.undo()).toThrow(NothingToUndoError);
    expect(() => stack.redo()).toThrow(NothingToRedoError);
  });

  it('io 命令后 undo / redo 都被禁止，直到下一次执行编辑命令', () => {
    const { stack, log } = createStack();
    stack.execute(new FakeCommand('a', log));
    stack.markIoCommand();

    expect(() => stack.undo()).toThrow(UndoNotAllowedError);
    expect(() => stack.redo()).toThrow(UndoNotAllowedError);

    stack.execute(new FakeCommand('b', log));
    expect(stack.undo()).toEqual(['b undone']);
  });

  it('io 命令后历史被清空', () => {
    const { stack, log } = createStack();
    stack.execute(new FakeCommand('a', log));
    stack.markIoCommand();
    stack.execute(new FakeCommand('b', log));

    expect(stack.undo()).toEqual(['b undone']);
    // 之前那条 a 已经被清掉，不应再被撤销
    expect(() => stack.undo()).toThrow(NothingToUndoError);
  });

  it('命令抛异常时不会入栈', () => {
    const { stack, log } = createStack();
    const failing: UndoableCommand = {
      kind: 'edit',
      execute(): string[] {
        log.push('execute:fail');
        throw new Error('boom');
      },
      undo(): string[] {
        log.push('undo:fail');
        return [];
      },
    };

    expect(() => stack.execute(failing)).toThrow('boom');
    expect(() => stack.undo()).toThrow(NothingToUndoError);
  });
});
