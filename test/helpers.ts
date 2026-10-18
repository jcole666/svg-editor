import { CommandExecutor } from '../src/app/CommandExecutor';
import { Session } from '../src/app/Session';
import { ErrorFormatter } from '../src/cli/ErrorFormatter';
import { Tokenizer } from '../src/cli/Tokenizer';
import { CommandRegistry } from '../src/commands/CommandRegistry';

/**
 * 测试用驱动器：模拟 Repl 的那一步"分词 → 查注册表 → 造命令 → 交给执行器"，
 * 但跳过 readline，方便直接断言输出。
 *
 * 走的是和 Repl 相同的 CommandExecutor，因此撤销历史的行为与线上一致。
 */
export function createRunner(): (line: string) => string[] {
  const session = new Session();
  const registry = new CommandRegistry();
  const tokenizer = new Tokenizer();
  const executor = new CommandExecutor(session);

  return (line: string): string[] => {
    const tokens = tokenizer.tokenize(line);
    const [name, ...args] = tokens;
    const spec = registry.get(name);
    if (spec === undefined) {
      throw new Error(`unknown command: ${name}`);
    }
    return executor.execute(spec.create(args, session));
  };
}

/**
 * 执行一条应当失败的命令，返回 CLI 上会打印的那一行（含 `error: ` 前缀）。
 * 如果命令没失败，测试直接报错。
 */
export function errorLine(run: (line: string) => string[], line: string): string {
  try {
    run(line);
  } catch (error) {
    return ErrorFormatter.toLine(error);
  }
  throw new Error(`expected command to fail but it succeeded: ${line}`);
}
