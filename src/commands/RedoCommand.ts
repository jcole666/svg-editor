import type { Session } from '../app/Session';
import type { Command } from '../app/Command';

/** redo —— 重做；从 redo 栈取出命令重新执行（§3）。 */
export class RedoCommand implements Command {
  constructor(private readonly session: Session) {}

  execute(): string[] {
    this.session.requireDocument();
    return this.session.commandStack.redo();
  }
}
