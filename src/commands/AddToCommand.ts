import type { Session } from '../app/Session';
import type { UndoableCommand } from '../app/UndoableCommand';
import { CannotGroupDescendantError } from '../model/CannotGroupDescendantError';
import type { ShapePosition } from '../model/Document';
import { NotAContainerError } from '../model/NotAContainerError';
import { UsageError } from './UsageError';

/**
 * addto <gid> <id> —— 把已有图形移入容器（作为最后一个子节点）（§3）。
 *
 * 与 group 的分工：group 是"一次收编多个并新建容器"，
 * addto 是"把单个图形挪进一个已经存在的容器"（对应 §4.1 说的"移动归属"）。
 *
 * undo：把图形放回原来的父容器与下标。
 */
export class AddToCommand implements UndoableCommand {
  readonly kind = 'edit' as const;
  private shapeId = '';
  private origin: ShapePosition | null = null;

  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.args.length !== 2) {
      throw new UsageError('addto <gid> <id>');
    }

    const target = document.require(this.args[0]);
    if (!target.isContainer()) {
      throw new NotAContainerError(this.args[0]);
    }

    const shape = document.require(this.args[1]);

    // 防环：不能把容器挪进它自己的后代的内部
    if (shape === target || shape.contains(target)) {
      throw new CannotGroupDescendantError(shape.id);
    }

    this.shapeId = shape.id;
    this.origin = document.detach(shape);
    target.addChild(shape);

    return [`${shape.label()} added to ${target.label()}`];
  }

  undo(): string[] {
    const origin = this.origin;
    if (origin === null) {
      throw new Error('addto command has nothing to undo');
    }

    const document = this.session.requireDocument();
    const shape = document.require(this.shapeId);

    document.detach(shape);
    document.reparent(shape, origin.parent, origin.index);

    return [`${shape.label()} moved back`];
  }
}
