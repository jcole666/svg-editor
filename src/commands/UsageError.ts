/**
 * 参数个数 / 形式不符合语法。
 * 任务书 §4.2 没有列这一类，这里给出可操作的提示（带正确用法）。
 */
export class UsageError extends Error {
  constructor(usage: string) {
    super(`usage: ${usage}`);
    this.name = 'UsageError';
  }
}
