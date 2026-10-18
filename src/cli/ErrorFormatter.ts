/**
 * 把异常转成 CLI 上看到的那一行。
 *
 * 任务书 §2 规定错误统一前缀 `error:`，§4.2 逐条给出了具体文案。
 * 抽成独立类的原因：Repl 与"§4.2 对照测试"必须走**同一个**格式化路径，
 * 否则测试断言的是 `message`、线上打印的是 `error: message`，容易漏。
 */
export class ErrorFormatter {
  private constructor() {}

  static toLine(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return `error: ${message}`;
  }
}
