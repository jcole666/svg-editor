import type { PluginContext } from '../../src/extension/PluginContext';
import { DirCommand } from './DirCommand';
import { NodeFsDirectoryListing } from './NodeFsDirectoryListing';

export default class DirPlugin {
  activate(ctx: PluginContext, options?: unknown): void {
    const cwdOption = readCwd(options);
    const cwd = cwdOption === undefined ? () => process.cwd() : () => cwdOption;
    const listing = new NodeFsDirectoryListing();
    ctx.registerCommand({
      name: 'dir',
      usage: 'dir',
      description: '列出当前工作目录下的文件和子目录',
      create: (args) => new DirCommand(args, listing, cwd),
    });
  }
}

function readCwd(options: unknown): string | undefined {
  if (options === null || typeof options !== 'object' || !('cwd' in options)) {
    return undefined;
  }
  const cwd = (options as { cwd?: unknown }).cwd;
  return typeof cwd === 'string' && cwd.length > 0 ? cwd : undefined;
}
