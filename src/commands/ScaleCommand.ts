import type { Session } from '../app/Session';
import { InvalidScaleFactorError } from '../model/InvalidScaleFactorError';
import { Shape } from '../model/Shape';
import type { Command } from './Command';
import { UsageError } from './UsageError';

/**
 * scale <id> <factor> —— 等比缩放：factor 同乘到图形的全部几何属性
 * （位置与尺寸）；作用于容器时递归到每个子孙。
 *
 * 因子必须为正数（§4.2）。
 */
export class ScaleCommand implements Command {
  readonly kind = 'edit' as const;

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

    shape.scaleBy(factor);

    return [`${shape.label()} scaled by ${Shape.formatNumber(factor)}`];
  }
}
