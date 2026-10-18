import type { Command } from '../commands/Command';
import type { Session } from './Session';

/**
 * 命令执行器：Invoker 里"真正把命令跑起来"的那一步。
 *
 * 它按命令的 kind 决定要不要进撤销历史：
 * - edit   ：执行前存快照，执行成功后记入历史
 * - io     ：执行后清空历史并禁止 undo/redo（§4.3）
 * - display：只执行
 *
 * 抽出来的好处：Repl 和测试驱动器共用同一套分派逻辑，不会出现
 * "测试里没走历史、线上走了历史"这种偏差。
 */
export class CommandExecutor {
  constructor(private readonly session: Session) {}

  execute(command: Command): string[] {
    const kind = command.kind ?? 'display';

    if (kind === 'edit') {
      const snapshot = this.session.requireDocument().clone();
      const output = command.execute();
      this.session.history.recordBeforeEdit(snapshot);
      return output;
    }

    if (kind === 'io') {
      const output = command.execute();
      this.session.history.markIoCommand();
      return output;
    }

    return command.execute();
  }
}
