import { GeometrySnapshot } from '../app/GeometrySnapshot';
import type { Session } from '../app/Session';
import type { UndoableCommand } from '../app/UndoableCommand';
import { Shape } from '../model/Shape';
import { UsageError } from './UsageError';

/**
 * move <id> <dx> <dy> —— 平移（增量）。
 *
 * 叶子图形改自己的坐标；容器把动作递归转发给每个子孙（Composite 语义）。
 * 反馈格式对齐任务书：叶子用 "moved to (x,y)"，容器用 "moved by (dx,dy)"。
 *
 * undo：不是"反向平移"，而是把**移动前记下的几何值写回去**。
 * 原因见 GeometrySnapshot：浮点加减不保证可逆。
 */
export class MoveCommand implements UndoableCommand {
  readonly kind = 'edit' as const;
  private shapeId = '';
  private dx = 0;
  private dy = 0;
  private before: GeometrySnapshot | null = null;

  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.args.length !== 3) {
      throw new UsageError('move <id> <dx> <dy>');
    }

    const shape = document.require(this.args[0]);
    const dx = Shape.parseNumber(this.args[1]);
    const dy = Shape.parseNumber(this.args[2]);

    this.shapeId = shape.id;
    this.dx = dx;
    this.dy = dy;
    this.before = GeometrySnapshot.capture(shape);

    shape.moveBy(dx, dy);

    const point = shape.referencePoint();
    if (point === null) {
      return [
        `${shape.label()} moved by (${Shape.formatNumber(dx)},${Shape.formatNumber(dy)})`,
      ];
    }
    return [
      `${shape.label()} moved to (${Shape.formatNumber(point.x)},${Shape.formatNumber(point.y)})`,
    ];
  }

  undo(): string[] {
    const shape = this.session.requireDocument().require(this.shapeId);
    this.before?.restore();

    const point = shape.referencePoint();
    if (point === null) {
      return [
        `${shape.label()} moved back by (${Shape.formatNumber(-this.dx)},${Shape.formatNumber(
          -this.dy,
        )})`,
      ];
    }
    return [
      `${shape.label()} moved back to (${Shape.formatNumber(point.x)},${Shape.formatNumber(
        point.y,
      )})`,
    ];
  }
}
