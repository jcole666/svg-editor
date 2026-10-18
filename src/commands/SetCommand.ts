import type { Session } from '../app/Session';
import type { Command } from './Command';
import { UsageError } from './UsageError';

/**
 * set <id> <attr> <value> —— 设置属性。
 *
 * 白名单由 Shape 负责（公共样式 + 各类型自身几何属性 + text 的文本内容），
 * 白名单外抛 UnknownAttributeError（§4.2 的 unknown attribute）。
 */
export class SetCommand implements Command {
  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.args.length !== 3) {
      throw new UsageError('set <id> <attr> <value>');
    }

    const shape = document.require(this.args[0]);
    const attribute = this.args[1];
    const value = this.args[2];

    shape.setAttr(attribute, value);

    // 文本内容是自由文本，回显时加引号（对齐 §6 的 updated: text="..."）
    const shownValue = attribute === 'text' ? `"${value}"` : value;
    return [`${shape.label()} updated: ${attribute}=${shownValue}`];
  }
}
