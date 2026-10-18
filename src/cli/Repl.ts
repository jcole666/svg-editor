import * as readline from 'node:readline';
import { Tokenizer } from './Tokenizer';

/**
 * REPL（Read-Eval-Print Loop）：读一行 -> 解析 -> 执行 -> 打印 -> 循环。
 *
 * 在命令模式里，Repl 承担 Invoker 的角色：
 *   - 它负责"发起"请求
 *   - 它不负责"怎么改图形"（那是 Document / Receiver 的事）
 *   - undo / redo 的栈也归它持有（P5 阶段接入）
 */
export class Repl {
  private readonly tokenizer: Tokenizer;
  private readonly rl: readline.Interface;
  private stopped = false;

  constructor() {
    this.tokenizer = new Tokenizer();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'svg> ',
    });
  }

  /** 启动 REPL：打印横幅，然后进入逐行循环。 */
  start(): void {
    console.log("svg-editor 0.1 — type 'help' for commands");
    this.rl.prompt();

    this.rl.on('line', (line: string) => {
      if (this.stopped) {
        return;
      }
      this.handleLine(line);
      // 命令可能已经关掉了 REPL（exit / quit），此时不能再 prompt
      if (!this.stopped) {
        this.rl.prompt();
      }
    });

    this.rl.on('close', () => {
      process.stdout.write('\n');
    });
  }

  /**
   * 处理一行输入。
   * P0 阶段：只做分词和"还不认识"的兜底；具体命令在 P2 / P3 逐步接入。
   */
  private handleLine(line: string): void {
    const tokens = this.tokenizer.tokenize(line);

    // 空行或整行注释：什么都不做，直接回到提示符
    if (tokens.length === 0) {
      return;
    }

    const name = tokens[0];

    if (name === 'exit' || name === 'quit') {
      this.stop();
      return;
    }

    if (name === 'help') {
      console.log('svg-editor 0.1 — 命令将在后续阶段接入');
      return;
    }

    console.log(`error: unknown command: ${name}`);
  }

  /** 关闭输入流，结束 REPL。 */
  private stop(): void {
    this.stopped = true;
    this.rl.close();
  }
}
