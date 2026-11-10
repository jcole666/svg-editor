import type { PluginContext } from '../../src/extension/PluginContext';
import { CircleProvider } from './CircleProvider';
import { EllipseProvider } from './EllipseProvider';
import { GroupProvider } from './GroupProvider';
import { LineProvider } from './LineProvider';
import { RectProvider } from './RectProvider';
import { TextProvider } from './TextProvider';

/** 六种内置图形。默认启动就会 activate，不依赖 plugins.config.json。 */
export default class BuiltinShapesPlugin {
  activate(ctx: PluginContext): void {
    ctx.registerShape(new RectProvider());
    ctx.registerShape(new CircleProvider());
    ctx.registerShape(new EllipseProvider());
    ctx.registerShape(new LineProvider());
    ctx.registerShape(new TextProvider());
    ctx.registerShape(new GroupProvider());
  }
}
