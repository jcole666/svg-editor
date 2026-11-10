import type { PluginContext } from '../../../../src/extension/PluginContext';

export default class OkPlugin {
  activate(ctx: PluginContext): void {
    ctx.registerCommand({
      name: 'ok',
      usage: 'ok',
      description: 'ok',
      create: () => ({ execute: () => ['ok'] }),
    });
  }
}
