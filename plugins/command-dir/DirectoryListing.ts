export type DirectoryKind = 'dir' | 'file' | 'link';

export interface DirectoryEntry {
  readonly name: string;
  readonly kind: DirectoryKind;
}

/**
 * dir 用的目录访问端口。
 * 命令只认这个接口；真正去读磁盘的是 NodeFsDirectoryListing。
 */
export interface DirectoryListing {
  list(directory: string): DirectoryEntry[];
}
