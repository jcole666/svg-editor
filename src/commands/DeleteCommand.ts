import type { Session } from '../app/Session';
import type { UndoableCommand } from '../app/UndoableCommand';
import type { RemovedShape } from '../model/Document';
import { UsageError } from './UsageError';

/**
 * delete <id> —— 删除图形；容器则连同全部子孙一起删。
 *
 * undo：把**同一个对象**按原来的父容器、原来的下标插回去。
 * 记 parent + index 而不只是对象，是因为兄弟顺序决定 z-order（§3 的 front/back）。
 */
export class DeleteCommand implements UndoableCommand {
  readonly kind = 'edit' as const;
  private removed: RemovedShape | null = null;

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
    this.removed = document.remove(shape.id);

    return [`${shape.label()} deleted`];
  }

  undo(): string[] {
    const removed = this.removed;
    if (removed === null) {
      throw new Error('delete command has nothing to undo');
    }

    this.session.requireDocument().insert(removed.shape, removed.parent, removed.index);

    const parentLabel = removed.parent === null ? 'svg' : removed.parent.label();
    return [`${removed.shape.label()} restored into ${parentLabel}`];
  }
}
