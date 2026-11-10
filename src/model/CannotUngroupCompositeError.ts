/**
 * ungroup 打到 box 这类复合图形上。
 * 对应任务书：error: cannot ungroup composite shape: n1
 */
export class CannotUngroupCompositeError extends Error {
  constructor(id: string) {
    super(`cannot ungroup composite shape: ${id}`);
    this.name = 'CannotUngroupCompositeError';
  }
}
