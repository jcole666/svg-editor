import type { Session } from '../app/Session';
import type { Command } from './Command';
import { UsageError } from './UsageError';

/**
 * delete <id> —— 删除图形；容器则连同全部子孙一起删。
 *
 * P4 阶段只做删除。P5 会在此基础上记录被删对象与原位置，以便 undo 原位恢复。
 */
export class DeleteCommand implements Command {
  readonly kind = 'edit' as const;

  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.args.length !== 1) {
      throw new UsageError('delete <id>');
    }

    const shape = document.require(this.args[0]);
    document.remove(shape.id);

    return [`${shape.label()} deleted`];
  }
}
