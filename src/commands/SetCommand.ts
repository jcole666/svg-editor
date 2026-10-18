import type { Session } from '../app/Session';
import type { UndoableCommand } from '../app/UndoableCommand';
import { UsageError } from './UsageError';

/**
 * set <id> <attr> <value> —— 设置属性。
 *
 * 白名单由 Shape 负责（公共样式 + 各类型自身几何属性 + text 的文本内容），
 * 白名单外抛 UnknownAttributeError（§4.2 的 unknown attribute）。
 *
 * undo：记下"改之前这个属性是什么"。若原本**没有**该属性（例如没设过 fill），
 * undo 要把它整个删掉，而不是设成空值——否则 SVG 输出会多出 fill=""。
 */
export class SetCommand implements UndoableCommand {
  readonly kind = 'edit' as const;
  private shapeId = '';
  private attribute = '';
  private previousValue: string | undefined;
  private hadPrevious = false;

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

    this.shapeId = shape.id;
    this.attribute = attribute;
    this.hadPrevious = shape.hasAttribute(attribute);
    this.previousValue = shape.getAttr(attribute);

    shape.setAttr(attribute, value);

    return [`${shape.label()} updated: ${attribute}=${SetCommand.render(attribute, value)}`];
  }

  undo(): string[] {
    const shape = this.session.requireDocument().require(this.shapeId);

    if (this.hadPrevious && this.previousValue !== undefined) {
      shape.setAttr(this.attribute, this.previousValue);
      return [
        `${shape.label()} updated: ${this.attribute}=${SetCommand.render(
          this.attribute,
          this.previousValue,
        )}`,
      ];
    }

    shape.removeAttribute(this.attribute);
    return [`${shape.label()} updated: ${this.attribute} removed`];
  }

  /** 文本内容是自由文本，回显时加引号（对齐 §6 的 updated: text="..."）。 */
  private static render(attribute: string, value: string): string {
    return attribute === 'text' ? `"${value}"` : value;
  }
}
