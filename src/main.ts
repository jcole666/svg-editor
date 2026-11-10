import { Repl } from './cli/Repl';
import { activateCodedPlugins } from './host/codePlugins';
import { createBuiltinHub } from './host/builtinHub';
import { PluginLoader } from './host/PluginLoader';

async function main(): Promise<void> {
  const hub = createBuiltinHub();
  const args = process.argv.slice(2);
  const configIndex = args.indexOf('--config');

  if (configIndex >= 0) {
    const configPath = args[configIndex + 1];
    if (configPath === undefined) {
      console.log('error: invalid plugin config');
    } else {
      await new PluginLoader().loadConfig(configPath, hub);
    }
  } else if (args.includes('--code-plugins')) {
    await activateCodedPlugins(hub);
  }

  const repl = new Repl({}, hub);
  await repl.start();
}

void main();
