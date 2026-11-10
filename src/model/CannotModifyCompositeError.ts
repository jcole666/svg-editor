/**
 * 想把 box 的矩形或文字单独删掉、挪走。
 * 复合图形的内部结构由插件管，内核不替它拆开。
 */
export class CannotModifyCompositeError extends Error {
  constructor(id: string) {
    super(`cannot modify composite shape structure: ${id}`);
    this.name = 'CannotModifyCompositeError';
  }
}
