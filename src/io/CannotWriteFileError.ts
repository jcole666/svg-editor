/**
 * 写出 SVG 文件失败。
 * 对应任务书 §4.2：error: cannot write file: a.svg
 */
export class CannotWriteFileError extends Error {
  constructor(path: string) {
    super(`cannot write file: ${path}`);
    this.name = 'CannotWriteFileError';
  }
}
