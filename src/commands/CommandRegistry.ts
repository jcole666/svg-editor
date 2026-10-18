import { CanvasCommand } from './CanvasCommand';
import type { CommandSpec } from './CommandSpec';
import { HelpCommand } from './HelpCommand';
import { InitCommand } from './InitCommand';
import { ShowCommand } from './ShowCommand';
import { TreeCommand } from './TreeCommand';

/**
 * 命令注册表：命令名 → 规格（含工厂）。
 *
 * 这是任务书 §2.1 允许的**按名字分派处之一**（命令分发）。
 * 架构文档里须标注它为"待重构项"——按 §2.1 要求，插槽化之后
 * 这一处应改为插件注册，而不是内核里写死。
 */
export class CommandRegistry {
  private readonly specs = new Map<string, CommandSpec>();

  constructor() {
    this.registerDefaults();
  }

  get(name: string): CommandSpec | undefined {
    return this.specs.get(name);
  }

  all(): CommandSpec[] {
    return [...this.specs.values()];
  }

  private register(spec: CommandSpec): void {
    this.specs.set(spec.name, spec);
  }

  private registerDefaults(): void {
    // ---- 文档类（执行后 undo/redo 禁止，见 §4.3）----
    this.register({
      name: 'init',
      usage: 'init [w] [h]',
      description: '新建空画布（默认 800x600），作为当前文档',
      create: (args, session) => new InitCommand(args, session),
    });
    this.register({
      name: 'canvas',
      usage: 'canvas [w] [h]',
      description: '无参数显示画布尺寸；带参数修改尺寸',
      create: (args, session) => new CanvasCommand(args, session),
    });

    // ---- 显示类（不进入 undo 栈）----
    this.register({
      name: 'tree',
      usage: 'tree [id]',
      description: '显示结构树（默认全文档）',
      create: (args, session) => new TreeCommand(args, session),
    });
    this.register({
      name: 'show',
      usage: 'show <id>',
      description: '显示单个图形的属性明细',
      create: (args, session) => new ShowCommand(args, session),
    });
    this.register({
      name: 'help',
      usage: 'help',
      description: '显示全部命令与语法',
      create: (_args, _session) => new HelpCommand(() => this.all()),
    });
  }
}
