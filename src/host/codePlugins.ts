import { ExtensionHub } from '../extension/ExtensionHub';
import { PluginLoader, repoRoot, type LoaderLog } from './PluginLoader';

/** 方式 A 要装的可选插件。顺序就是注册顺序，也是树标签的拼接顺序。 */
export const CODED_PLUGINS = [
];

export async function activateCodedPlugins(hub: ExtensionHub, log?: LoaderLog): Promise<void> {
  const loader = new PluginLoader(log);
  const root = repoRoot();
  for (const specifier of CODED_PLUGINS) {
    await loader.loadSpecifier(`./${specifier}`, root, hub);
  }
}
