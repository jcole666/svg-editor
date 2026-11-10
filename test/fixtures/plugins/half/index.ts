import type { PluginContext } from '../../../../src/extension/PluginContext';

export default class HalfPlugin {
  activate(ctx: PluginContext): void {
    ctx.registerCommand({
      name: 'half',
      usage: 'half',
      description: 'half',
      create: () => ({ execute: () => ['half'] }),
    });
    throw new Error('boom');
  }
}
