import type { UndoableCommand } from './UndoableCommand';
import { NothingToRedoError } from './NothingToRedoError';
import { NothingToUndoError } from './NothingToUndoError';
import { UndoNotAllowedError } from './UndoNotAllowedError';

/**
 * 命令栈 —— 撤销 / 重做的核心（对应课件命令模式 p22-25 的两个栈）。
 *
 * 职责分工（与课件一致）：
 *   执行：push(cmd) 记入 undo 栈、执行命令、**清空 redo 栈**
 *   撤销：pop() 出最近一条 → 调 undo() → 转入 redo 栈
 *   重做：从 redo 栈 pop() → 重新 execute() → 放回 undo 栈
 *
 * 关键是"请求已经是一个对象"：命令被弹出栈之后仍然可以被调用，
 * 这正是 Command 模式相对"快照法"的根本优势。
 */
export class CommandStack {
  private readonly undoStack: UndoableCommand[] = [];
  private readonly redoStack: UndoableCommand[] = [];
  private ioBlocked = false;

  /** 执行一条编辑命令：成功后入栈，并清空 redo 栈。 */
  execute(command: UndoableCommand): string[] {
    const output = command.execute();
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.ioBlocked = false;
    return output;
  }

  /** 文档类命令执行后：清空历史并禁止 undo/redo，直到下一次编辑（§4.3）。 */
  markIoCommand(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.ioBlocked = true;
  }

  undo(): string[] {
    if (this.ioBlocked) {
      throw new UndoNotAllowedError();
    }
    const command = this.undoStack.pop();
    if (command === undefined) {
      throw new NothingToUndoError();
    }
    const output = command.undo();
    this.redoStack.push(command);
    return output;
  }

  redo(): string[] {
    if (this.ioBlocked) {
      throw new UndoNotAllowedError();
    }
    const command = this.redoStack.pop();
    if (command === undefined) {
      throw new NothingToRedoError();
    }
    const output = command.execute();
    this.undoStack.push(command);
    return output;
  }
}
