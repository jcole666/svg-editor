import type { PluginContext } from '../../src/extension/PluginContext';
import { StatsCommand } from './StatsCommand';

export default class StatsPlugin {
  activate(ctx: PluginContext): void {
    ctx.registerCommand({
      name: 'stats',
      usage: 'stats',
      description: '统计叶子图形数量；g 和 box 只计入容器',
      create: (args, session) => new StatsCommand(args, session),
    });
  }
}
