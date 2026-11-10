import { Session } from '../app/Session';
import { AttributeRegistry } from './AttributeRegistry';
import { CommandRegistry } from './CommandRegistry';
import { DecoratorRegistry } from './DecoratorRegistry';
import type { PluginContext } from './PluginContext';
import { ShapeCatalog } from './ShapeCatalog';

/** 一次进程里的四张表加会话。组合根和加载器共用它，命令执行时从这里取。 */
export class ExtensionHub {
  readonly session = new Session();
  readonly commands = new CommandRegistry();
  readonly shapes = new ShapeCatalog();
  readonly attributes = new AttributeRegistry();
  readonly decorators = new DecoratorRegistry();

  pluginContext(): PluginContext {
    return {
      session: this.session,
      registerShape: (provider) => this.shapes.register(provider),
      registerCommand: (spec) => this.commands.register(spec),
      registerDecorator: (decorator) => this.decorators.register(decorator),
      registerAttribute: (handler) => this.attributes.register(handler),
    };
  }
}
