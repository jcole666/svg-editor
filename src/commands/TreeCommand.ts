import type { Session } from '../app/Session';
import { TreeRenderer } from '../view/TreeRenderer';
import type { Command } from '../app/Command';
import { UsageError } from './UsageError';

/**
 * tree [id] —— 显示结构树；带 id 时只显示以它为根的子树。
 *
 * 显示类命令：不进入 undo 栈，也不改变任何状态。
 */
export class TreeCommand implements Command {
  private readonly renderer = new TreeRenderer();

  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.args.length === 0) {
      return this.renderer.renderDocument(document);
    }

    if (this.args.length !== 1) {
      throw new UsageError('tree [id]');
    }

    return this.renderer.renderSubtree(document.require(this.args[0]));
  }
}
