import type { Session } from '../app/Session';
import type { UndoableCommand } from '../app/UndoableCommand';
import type { ShapePosition } from '../model/Document';
import { UsageError } from './UsageError';

export type ZOrderDirection = 'front' | 'back';

/**
 * front <id> / back <id> —— 调整同级 z-order：放到最前 / 最后（§3）。
 *
 * "最前" = 同级数组的末尾（后画的压在上面），"最后" = 下标 0。
 * undo：放回原来的下标。
 */
export class ZOrderCommand implements UndoableCommand {
  readonly kind = 'edit' as const;
  private shapeId = '';
  private origin: ShapePosition | null = null;

  constructor(
    private readonly args: string[],
    private readonly session: Session,
    private readonly direction: ZOrderDirection,
  ) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.args.length !== 1) {
      throw new UsageError(`${this.direction} <id>`);
    }

    const shape = document.require(this.args[0]);
    this.shapeId = shape.id;
    this.origin = document.detach(shape);

    const parent = this.origin.parent;
    const targetIndex = this.direction === 'front' ? document.siblingCount(parent) : 0;
    document.reparent(shape, parent, targetIndex);

    return [
      this.direction === 'front'
        ? `${shape.label()} brought to front`
        : `${shape.label()} sent to back`,
    ];
  }

  undo(): string[] {
    const origin = this.origin;
    if (origin === null) {
      throw new Error('z-order command has nothing to undo');
    }

    const document = this.session.requireDocument();
    const shape = document.require(this.shapeId);

    document.detach(shape);
    document.reparent(shape, origin.parent, origin.index);

    return [`${shape.label()} position restored`];
  }
}
