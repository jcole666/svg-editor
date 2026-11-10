import type { PluginContext } from '../../src/extension/PluginContext';
import { ModifiedStar } from './ModifiedStar';

export default class ModifiedStarPlugin {
  activate(ctx: PluginContext): void {
    ctx.registerDecorator(new ModifiedStar(ctx.session));
  }
}
