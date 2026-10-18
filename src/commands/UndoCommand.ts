import type { Session } from '../app/Session';
import type { Command } from './Command';

/**
 * undo —— 撤销上一次编辑命令（§3）。
 *
 * 自己不碰数据结构：把请求转交给命令栈，由被记住的那条命令反向执行。
 */
export class UndoCommand implements Command {
  constructor(private readonly session: Session) {}

  execute(): string[] {
    this.session.requireDocument();
    return this.session.commandStack.undo();
  }
}
