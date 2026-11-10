/**
 * 读入时插件明确拒绝整份文件（比如 box 缺了子部件）。
 * 和"文件打不开"分开，调用方要保留原来的文档。
 */
export class ReadRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReadRejectedError';
  }
}
