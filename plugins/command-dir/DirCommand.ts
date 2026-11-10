import type { Command } from '../../src/app/Command';
import type { DirectoryEntry, DirectoryListing } from './DirectoryListing';

const RANK: Record<DirectoryEntry['kind'], number> = { dir: 0, file: 1, link: 2 };
const TAG: Record<DirectoryEntry['kind'], string> = { dir: '[DIR]', file: '[FILE]', link: '[LINK]' };

/**
 * dir —— 列出进程当前工作目录的直接子项。
 * 不碰 SVG 文档，所以没 init 也能用，也不会进 undo 栈。
 */
export class DirCommand implements Command {
  constructor(
    private readonly args: string[],
    private readonly listing: DirectoryListing,
    private readonly cwd: () => string,
  ) {}

  execute(): string[] {
    if (this.args.length !== 0) {
      throw new Error('usage: dir');
    }

    const entries = [...this.listing.list(this.cwd())];
    if (entries.length === 0) {
      return ['(empty directory)'];
    }

    entries.sort((left, right) => {
      if (RANK[left.kind] !== RANK[right.kind]) {
        return RANK[left.kind] - RANK[right.kind];
      }
      if (left.name < right.name) {
        return -1;
      }
      if (left.name > right.name) {
        return 1;
      }
      return 0;
    });

    return entries.map((entry) => `${TAG[entry.kind]}  ${entry.name}`);
  }
}
