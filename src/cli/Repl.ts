import * as readline from 'node:readline';

import { CommandExecutor } from '../app/CommandExecutor';
import { Session } from '../app/Session';
import { CommandRegistry } from '../commands/CommandRegistry';
import { Tokenizer } from './Tokenizer';

/**
 * REPL（Read-Eval-Print Loop）：读一行 -> 分词 -> 找命令 -> 执行 -> 打印 -> 循环。
 *
 * 在命令模式里，Repl 承担 Invoker 的角色：
 *   - 负责"发起"请求，不负责"怎么改图形"（那是 Document / Receiver 的事）
 *   - 命令对象由 CommandRegistry 造出来
 *   - 执行与撤销历史的衔接交给 CommandExecutor
 */
export class Repl {
  private readonly tokenizer = new Tokenizer();
  private readonly session = new Session();
  private readonly registry = new CommandRegistry();
  private readonly executor = new CommandExecutor(this.session);
  private readonly rl: readline.Interface;
  private stopped = false;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'svg> ',
    });
  }

  start(): void {
    console.log("svg-editor 0.1 — type 'help' for commands");
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
      process.stdout.write('\n');
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
      console.log(`error: unknown command: ${name}`);
      return;
    }

    const args = tokens.slice(1);
    try {
      const command = spec.create(args, this.session);
      for (const outputLine of this.executor.execute(command)) {
        console.log(outputLine);
      }
    } catch (error) {
      console.log(`error: ${Repl.messageOf(error)}`);
    }
  }

  private stop(): void {
    this.stopped = true;
    this.rl.close();
  }

  private static messageOf(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
