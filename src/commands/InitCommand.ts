import type { Session } from '../app/Session';
import { Document } from '../model/Document';
import { Shape } from '../model/Shape';
import type { Command } from './Command';
import { UsageError } from './UsageError';

/**
 * init [w] [h] —— 新建空画布，作为当前文档（默认 800x600）。
 *
 * 属于"文档类"命令：执行后 undo/redo 应被禁止（§4.3），P5 接入命令栈时处理。
 */
export class InitCommand implements Command {
  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    if (this.args.length > 2) {
      throw new UsageError('init [w] [h]');
    }

    const width = this.args.length >= 1 ? Shape.parseNumber(this.args[0]) : 800;
    const height = this.args.length >= 2 ? Shape.parseNumber(this.args[1]) : 600;

    this.session.setDocument(new Document(width, height));

    return [`canvas ${Shape.formatNumber(width)}x${Shape.formatNumber(height)} created`];
  }
}
