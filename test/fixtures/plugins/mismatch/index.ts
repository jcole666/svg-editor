import type { PluginContext } from '../../../../src/extension/PluginContext';

export default class MismatchPlugin {
  activate(ctx: PluginContext): void {
    ctx.registerCommand({
      name: 'actual',
      usage: 'actual',
      description: 'actual',
      create: () => ({ execute: () => ['actual'] }),
    });
  }
}
