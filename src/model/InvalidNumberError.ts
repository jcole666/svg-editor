/**
 * 数值参数无法解析时抛出（例如 set rect x abc）。
 * 任务书未规定这条错误文案，先给出可读消息，P8 再统一对齐。
 */
export class InvalidNumberError extends Error {
  constructor(rawValue: string) {
    super(`invalid number: ${rawValue}`);
    this.name = 'InvalidNumberError';
  }
}
