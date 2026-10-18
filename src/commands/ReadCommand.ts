import type { Session } from '../app/Session';
import { SvgReader } from '../io/SvgReader';
import type { Command } from './Command';
import { UsageError } from './UsageError';

/**
 * read <file.svg> —— 读入 SVG 文件为当前文档（§3）。
 *
 * 属于文档类命令：执行后 undo/redo 被禁止（§4.3）。
 * 自动补 id 的警告先打印，再打印读取摘要（对齐 §6）。
 */
export class ReadCommand implements Command {
  readonly kind = 'io' as const;
  private readonly reader = new SvgReader();

  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    if (this.args.length !== 1) {
      throw new UsageError('read <file.svg>');
    }

    const path = this.args[0];
    const result = this.reader.readFile(path);

    result.document.setSourcePath(path);
    this.session.setDocument(result.document);

    return [...result.warnings, `read ${path} (${result.document.countShapes()} elements)`];
  }
}
