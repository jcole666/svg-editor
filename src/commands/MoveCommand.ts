import type { Session } from '../app/Session';
import { Shape } from '../model/Shape';
import type { Command } from './Command';
import { UsageError } from './UsageError';

/**
 * move <id> <dx> <dy> —— 平移（增量）。
 *
 * 叶子图形改自己的坐标；容器把动作递归转发给每个子孙（Composite 语义）。
 * 反馈格式对齐任务书：叶子用 "moved to (x,y)"，容器用 "moved by (dx,dy)"。
 */
export class MoveCommand implements Command {
  readonly kind = 'edit' as const;

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
}
