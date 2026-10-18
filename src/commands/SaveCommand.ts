import type { Session } from '../app/Session';
import { SvgWriter } from '../io/SvgWriter';
import type { Command } from './Command';
import { UsageError } from './UsageError';

/**
 * save [file.svg] —— 保存当前文档；无参数时保存到 read 读入时的路径（§3）。
 *
 * 属于文档类命令：执行后 undo/redo 被禁止（§4.3）。
 * 保存到新路径后会把该路径记为当前路径，方便后续无参数 save。
 */
export class SaveCommand implements Command {
  readonly kind = 'io' as const;
  private readonly writer = new SvgWriter();

  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    if (this.args.length > 1) {
      throw new UsageError('save [file.svg]');
    }

    const document = this.session.requireDocument();
    const path = this.args[0] ?? document.sourcePath;

    if (path === null) {
      // 由 init 新建、从未 read / save 过的文档没有默认路径
      throw new UsageError('save <file.svg>');
    }

    this.writer.writeFile(document, path);
    document.setSourcePath(path);

    return [`saved to ${path} (${document.countShapes()} elements)`];
  }
}
