/**
 * `in <containerId>` 指向的 id 不存在。
 * 对应任务书 §4.2：error: no such container: node9
 */
export class NoSuchContainerError extends Error {
  constructor(id: string) {
    super(`no such container: ${id}`);
    this.name = 'NoSuchContainerError';
  }
}
