import type { Command } from './Command';
import type { Session } from './Session';
import type { UndoableCommand } from './UndoableCommand';

function isUndoable(command: Command): command is UndoableCommand {
  return command.kind === 'edit' && typeof (command as { undo?: unknown }).undo === 'function';
}

/**
 * 命令执行器：Invoker 里"真正把命令跑起来"的那一步。
 *
 * 按命令的 kind 决定要不要进撤销栈：
 * - edit   ：交给 CommandStack（执行 + 入栈 + 清空 redo）
 * - io     ：直接执行，然后清空历史并禁止 undo/redo（§4.3）
 * - display：只执行
 *
 * Repl 和测试驱动器共用它，避免"测试里没走历史、线上走了历史"的偏差。
 */
export class CommandExecutor {
  constructor(private readonly session: Session) {}

  execute(command: Command): string[] {
    if (isUndoable(command)) {
      return this.session.commandStack.execute(command);
    }

    if (command.kind === 'io') {
      const output = command.execute();
      this.session.commandStack.markIoCommand();
      return output;
    }

    return command.execute();
  }
}
