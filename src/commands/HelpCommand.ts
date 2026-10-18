import type { Command } from '../app/Command';
import type { CommandSpec } from './CommandSpec';

/**
 * help —— 显示全部命令与语法。
 *
 * 命令清单从注册表读取（传一个 provider 而不是数组），
 * 这样后续阶段新增命令时 help 自动更新，不需要再改这里。
 */
export class HelpCommand implements Command {
  constructor(private readonly specsProvider: () => CommandSpec[]) {}

  execute(): string[] {
    const entries = this.specsProvider().map((spec) => ({
      usage: spec.usage,
      description: spec.description,
    }));
    entries.push({
      usage: 'exit | quit',
      description: '退出 REPL（也可以按 Ctrl+D）',
    });

    const usageWidth = entries.reduce((max, entry) => Math.max(max, entry.usage.length), 0) + 2;
    const lines = ['commands:'];
    for (const entry of entries) {
      lines.push(`  ${entry.usage.padEnd(usageWidth)}${entry.description}`);
    }
    return lines;
  }
}
