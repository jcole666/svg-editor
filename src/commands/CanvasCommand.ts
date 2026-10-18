import type { Session } from '../app/Session';
import { Shape } from '../model/Shape';
import type { Command } from './Command';
import { UsageError } from './UsageError';

/**
 * canvas [w] [h] —— 无参数显示画布尺寸；带参数修改尺寸。
 *
 * 属于"文档类"命令：修改尺寸后 undo/redo 应被禁止（§4.3）。
 */
export class CanvasCommand implements Command {
  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.args.length === 0) {
      return [CanvasCommand.describe(document.width, document.height)];
    }

    if (this.args.length !== 2) {
      throw new UsageError('canvas [w] [h]');
    }

    const width = Shape.parseNumber(this.args[0]);
    const height = Shape.parseNumber(this.args[1]);
    document.resize(width, height);

    return [CanvasCommand.describe(width, height)];
  }

  private static describe(width: number, height: number): string {
    return `canvas ${Shape.formatNumber(width)}x${Shape.formatNumber(height)}`;
  }
}
