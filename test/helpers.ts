import { Session } from '../src/app/Session';
import { Tokenizer } from '../src/cli/Tokenizer';
import { CommandRegistry } from '../src/commands/CommandRegistry';

/**
 * 测试用驱动器：模拟 Repl 的那一步"分词 → 查注册表 → 造命令 → 执行"，
 * 但跳过 readline，方便直接断言输出。
 */
export function createRunner(): (line: string) => string[] {
  const session = new Session();
  const registry = new CommandRegistry();
  const tokenizer = new Tokenizer();

  return (line: string): string[] => {
    const tokens = tokenizer.tokenize(line);
    const [name, ...args] = tokens;
    const spec = registry.get(name);
    if (spec === undefined) {
      throw new Error(`unknown command: ${name}`);
    }
    return spec.create(args, session).execute();
  };
}
