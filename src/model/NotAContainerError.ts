/**
 * `in <containerId>` 指向的图形存在，但不是容器（<g>）。
 * 对应任务书 §4.2：error: not a container: start
 */
export class NotAContainerError extends Error {
  constructor(id: string) {
    super(`not a container: ${id}`);
    this.name = 'NotAContainerError';
  }
}
