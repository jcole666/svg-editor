import * as readline from 'node:readline';

import { CommandExecutor } from '../app/CommandExecutor';
import { Session } from '../app/Session';
import { CommandRegistry } from '../commands/CommandRegistry';
import { ErrorFormatter } from './ErrorFormatter';
import { Tokenizer } from './Tokenizer';

/** 允许替换输入输出流，方便端到端测试（默认用进程的 stdio）。 */
export interface ReplStreams {
  readonly input?: NodeJS.ReadableStream;
  readonly output?: NodeJS.WritableStream;
}

/**
 * REPL（Read-Eval-Print Loop）：读一行 -> 分词 -> 找命令 -> 执行 -> 打印 -> 循环。
 *
 * 在命令模式里，Repl 承担 Invoker 的角色：
 *   - 负责"发起"请求，不负责"怎么改图形"（那是 Document / Receiver 的事）
 *   - 命令对象由 CommandRegistry 造出来
 *   - 执行与撤销历史的衔接交给 CommandExecutor
 *
 * 输入输出通过构造参数注入：这是"可测试的两个条件"里的
 * **控制输入 + 观测输出**（TDD 课件 p14），也让端到端测试不必启动真实终端。
 */
export class Repl {
  private readonly tokenizer = new Tokenizer();
  private readonly session = new Session();
  private readonly registry = new CommandRegistry();
  private readonly executor = new CommandExecutor(this.session);
  private readonly output: NodeJS.WritableStream;
  private readonly rl: readline.Interface;
  private stopped = false;

  constructor(streams: ReplStreams = {}) {
    this.output = streams.output ?? process.stdout;
    this.rl = readline.createInterface({
      input: streams.input ?? process.stdin,
      output: this.output,
      prompt: 'svg> ',
    });
  }

  /** 启动 REPL；返回的 Promise 在输入流结束（或 exit）时 resolve。 */
  start(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.print("svg-editor 0.1 — type 'help' for commands");
      this.rl.prompt();

      this.rl.on('line', (line: string) => {
        if (this.stopped) {
          return;
        }
        this.handleLine(line);
        if (!this.stopped) {
          this.rl.prompt();
        }
      });

      this.rl.on('close', () => {
        this.output.write('\n');
        resolve();
      });
    });
  }

  private handleLine(line: string): void {
    const tokens = this.tokenizer.tokenize(line);
    if (tokens.length === 0) {
      return;
    }

    const name = tokens[0];

    if (name === 'exit' || name === 'quit') {
      this.stop();
      return;
    }

    const spec = this.registry.get(name);
    if (spec === undefined) {
      this.print(`error: unknown command: ${name}`);
      return;
    }

    const args = tokens.slice(1);
    try {
      const command = spec.create(args, this.session);
      for (const outputLine of this.executor.execute(command)) {
        this.print(outputLine);
      }
    } catch (error) {
      this.print(ErrorFormatter.toLine(error));
    }
  }

  private stop(): void {
    this.stopped = true;
    this.rl.close();
  }

  private print(line: string): void {
    this.output.write(`${line}\n`);
  }
}
