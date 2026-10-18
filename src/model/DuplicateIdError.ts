/**
 * 图形 id 重复。
 * 对应任务书 §4.2：error: id already exists: r1
 */
export class DuplicateIdError extends Error {
  constructor(id: string) {
    super(`id already exists: ${id}`);
    this.name = 'DuplicateIdError';
  }
}
