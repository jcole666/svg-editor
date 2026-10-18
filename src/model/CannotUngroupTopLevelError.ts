/**
 * 画布根级的容器不能 ungroup（§4.2）。
 * 对应任务书：error: cannot ungroup top-level container: scene
 */
export class CannotUngroupTopLevelError extends Error {
  constructor(id: string) {
    super(`cannot ungroup top-level container: ${id}`);
    this.name = 'CannotUngroupTopLevelError';
  }
}
