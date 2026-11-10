import * as fs from 'node:fs';

import type { DirectoryEntry, DirectoryListing } from './DirectoryListing';

/** 适配器：把 node:fs 的 Dirent 收成 dir 命令能用的条目。符号链接不跟随。 */
export class NodeFsDirectoryListing implements DirectoryListing {
  list(directory: string): DirectoryEntry[] {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      throw new Error(`cannot read directory: ${directory}`);
    }

    return entries.map((entry) => ({
      name: entry.name,
      kind: entry.isSymbolicLink() ? 'link' : entry.isDirectory() ? 'dir' : 'file',
    }));
  }
}
