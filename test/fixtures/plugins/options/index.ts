import type { PluginContext } from '../../../../src/extension/PluginContext';

export default class OptionsPlugin {
  activate(ctx: PluginContext, options?: unknown): void {
    const fill =
      options !== null && typeof options === 'object' && 'fill' in options
        ? String((options as { fill: unknown }).fill)
        : '';
    ctx.registerCommand({
      name: 'opt',
      usage: 'opt',
      description: fill,
      create: () => ({ execute: () => [fill] }),
    });
  }
}
