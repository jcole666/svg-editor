import type { Session } from '../app/Session';
import { ShapeDetailRenderer } from '../view/ShapeDetailRenderer';
import type { Command } from './Command';
import { UsageError } from './UsageError';

/**
 * show <id> —— 显示单个图形的属性明细。
 *
 * 显示类命令：不进入 undo 栈，也不改变任何状态。
 */
export class ShowCommand implements Command {
  private readonly renderer = new ShapeDetailRenderer();

  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.args.length !== 1) {
      throw new UsageError('show <id>');
    }

    return this.renderer.render(document.require(this.args[0]));
  }
}
