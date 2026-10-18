import type { Command } from '../commands/Command';

/**
 * 可撤销命令：在 Command 之上增加"反向执行"。
 *
 * 只有编辑类命令实现这个接口——显示类（tree/show）和文档类（init/save）
 * 不需要，也不该被塞进撤销栈（§4.3）。
 */
export interface UndoableCommand extends Command {
  readonly kind: 'edit';
  /** 反向执行；返回要打印给用户的反馈。 */
  undo(): string[];
}
