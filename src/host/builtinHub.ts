import { ExtensionHub } from '../extension/ExtensionHub';
import BuiltinShapesPlugin from '../../plugins/shape-builtin/index';
import { registerBuiltinCommands } from './registerBuiltins';

/** 不加载可选插件时的默认装配：六种图形 + 19 条命令。 */
export function createBuiltinHub(): ExtensionHub {
  const hub = new ExtensionHub();
  new BuiltinShapesPlugin().activate(hub.pluginContext());
  registerBuiltinCommands(hub);
  return hub;
}
