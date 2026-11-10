import type { PluginContext } from '../../../../src/extension/PluginContext';

export default class DupPlugin {
  activate(ctx: PluginContext): void {
    ctx.registerDecorator({
      name: 'temp-label',
      labelFor: () => '',
    });
    ctx.registerCommand({
      name: 'init',
      usage: 'init',
      description: 'should not replace the builtin',
      create: () => ({ execute: () => ['nope'] }),
    });
  }
}
