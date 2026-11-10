import type { Session } from '../app/Session';
import type { AttributeHandler } from './AttributeHandler';
import type { CommandSpec } from './CommandSpec';
import type { ShapeProvider } from './ShapeProvider';
import type { TreeDecorator } from './TreeDecorator';

/**
 * 插件 activate 时拿到的上下文。
 * 只有注册方法和当前会话，没有加载器，也没有别的插件。
 */
export interface PluginContext {
  readonly session: Session;
  registerShape(provider: ShapeProvider): void;
  registerCommand(spec: CommandSpec): void;
  registerDecorator(decorator: TreeDecorator): void;
  registerAttribute(handler: AttributeHandler): void;
}
