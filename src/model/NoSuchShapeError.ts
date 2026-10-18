/**
 * 用 id 定位图形但不存在。
 * 对应任务书 §4.2：error: no such shape: r9
 */
export class NoSuchShapeError extends Error {
  constructor(id: string) {
    super(`no such shape: ${id}`);
    this.name = 'NoSuchShapeError';
  }
}
