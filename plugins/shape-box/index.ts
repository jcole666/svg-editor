import type { PluginContext } from '../../src/extension/PluginContext';
import { BoxAttributeHandler } from './BoxAttributeHandler';
import { BoxLabel } from './BoxLabel';
import { BoxProvider } from './BoxProvider';

export default class BoxPlugin {
  activate(ctx: PluginContext): void {
    ctx.registerShape(new BoxProvider());
    ctx.registerAttribute(new BoxAttributeHandler());
    ctx.registerDecorator(new BoxLabel());
  }
}
