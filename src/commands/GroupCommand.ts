import type { Session } from '../app/Session';
import type { UndoableCommand } from '../app/UndoableCommand';
import { CannotGroupDescendantError } from '../model/CannotGroupDescendantError';
import type { ShapePosition } from '../model/Document';
import { DuplicateIdError } from '../model/DuplicateIdError';
import { Group } from '../model/Group';
import type { Shape } from '../model/Shape';
import { UsageError } from './UsageError';

interface Origin extends ShapePosition {
  readonly shape: Shape;
}

/**
 * group <newGid> <id1> <id2>… —— 新建容器并收入若干图形。
 *
 * 语义要点（§3）：
 *   - 从各自原父容器摘出，**保持相对顺序**
 *   - 新容器放在第一个图形原来的位置（否则会莫名其妙跳到画布末尾）
 *   - 防环：不能把容器和它自己的子孙分到同一组（§4.2）
 *
 * undo：解散新容器，并把每个图形按**原来的父容器与下标**放回。
 */
export class GroupCommand implements UndoableCommand {
  readonly kind = 'edit' as const;
  private createdGroup: Group | null = null;
  private origins: Origin[] = [];

  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.args.length < 2) {
      throw new UsageError('group <newGid> <id1> <id2>...');
    }

    const groupId = this.args[0];
    const ids = this.args.slice(1);

    if (document.has(groupId)) {
      throw new DuplicateIdError(groupId);
    }

    const shapes = ids.map((id) => document.require(id));
    GroupCommand.assertNoCycle(shapes);

    // 先在没有任何改动时记录原始位置
    const origins: Origin[] = shapes.map((shape) => ({
      shape,
      parent: shape.parent,
      index: document.indexOf(shape),
    }));

    const first = origins[0];
    for (const shape of shapes) {
      document.detach(shape);
    }

    const group = new Group(groupId);
    document.insert(group, first.parent, first.index);
    for (const shape of shapes) {
      group.addChild(shape);
    }

    this.createdGroup = group;
    this.origins = origins;

    return [`${group.label()} created with ${GroupCommand.childrenText(shapes.length)}`];
  }

  undo(): string[] {
    const group = this.createdGroup;
    if (group === null) {
      throw new Error('group command has nothing to undo');
    }

    const document = this.session.requireDocument();

    for (const child of [...group.children()]) {
      group.removeChild(child);
    }
    document.remove(group.id);

    // 按原下标从小到大放回，避免插错位置
    for (const origin of [...this.origins].sort((a, b) => a.index - b.index)) {
      document.reparent(origin.shape, origin.parent, origin.index);
    }

    this.createdGroup = null;
    return [`${group.label()} creation undone`];
  }

  private static assertNoCycle(shapes: Shape[]): void {
    for (const candidate of shapes) {
      if (!(candidate instanceof Group)) {
        continue;
      }
      for (const other of shapes) {
        if (other !== candidate && candidate.contains(other)) {
          throw new CannotGroupDescendantError(candidate.id);
        }
      }
    }
  }

  private static childrenText(count: number): string {
    return `${count} ${count === 1 ? 'child' : 'children'}`;
  }
}
