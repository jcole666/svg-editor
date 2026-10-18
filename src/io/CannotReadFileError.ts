/**
 * 读取 SVG 文件失败。
 * 对应任务书 §4.2：error: cannot read file: a.svg
 */
export class CannotReadFileError extends Error {
  constructor(path: string) {
    super(`cannot read file: ${path}`);
    this.name = 'CannotReadFileError';
  }
}
