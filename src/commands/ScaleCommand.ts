import { GeometrySnapshot } from '../app/GeometrySnapshot';
import type { Session } from '../app/Session';
import type { UndoableCommand } from '../app/UndoableCommand';
import { InvalidScaleFactorError } from '../model/InvalidScaleFactorError';
import { Shape } from '../model/Shape';
import { UsageError } from './UsageError';

/**
 * scale <id> <factor> —— 等比缩放：factor 同乘到图形的全部几何属性
 * （位置与尺寸）；作用于容器时递归到每个子孙。
 *
 * 因子必须为正数（§4.2）。
 * undo：同样用"写回旧几何值"，避免 10 × 3 ÷ 3 ≠ 10 的浮点误差。
 */
export class ScaleCommand implements UndoableCommand {
  readonly kind = 'edit' as const;
  private shapeId = '';
  private factor = 1;
  private before: GeometrySnapshot | null = null;

  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.args.length !== 2) {
      throw new UsageError('scale <id> <factor>');
    }

    const shape = document.require(this.args[0]);
    const factor = Shape.parseNumber(this.args[1]);

    if (factor <= 0) {
      throw new InvalidScaleFactorError();
    }

    this.shapeId = shape.id;
    this.factor = factor;
    this.before = GeometrySnapshot.capture(shape);

    shape.scaleBy(factor);

    return [`${shape.label()} scaled by ${Shape.formatNumber(factor)}`];
  }

  undo(): string[] {
    const shape = this.session.requireDocument().require(this.shapeId);
    this.before?.restore();

    return [`${shape.label()} scaled back by ${Shape.formatNumber(1 / this.factor)}`];
  }
}
