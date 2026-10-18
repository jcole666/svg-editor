/**
 * 试图把一个容器和它自己的子孙分到同一组（会造成"自己包含自己"）。
 * 对应任务书 §4.2：error: cannot group a container into its own descendant: g1
 */
export class CannotGroupDescendantError extends Error {
  constructor(id: string) {
    super(`cannot group a container into its own descendant: ${id}`);
    this.name = 'CannotGroupDescendantError';
  }
}
