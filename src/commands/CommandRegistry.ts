import { AddToCommand } from './AddToCommand';
import { CanvasCommand } from './CanvasCommand';
import type { CommandSpec } from './CommandSpec';
import { CreateCommand } from './CreateCommand';
import { DeleteCommand } from './DeleteCommand';
import { GroupCommand } from './GroupCommand';
import { HelpCommand } from './HelpCommand';
import { InitCommand } from './InitCommand';
import { MoveCommand } from './MoveCommand';
import { RedoCommand } from './RedoCommand';
import { ScaleCommand } from './ScaleCommand';
import { SetCommand } from './SetCommand';
import { ShapeFactory } from './ShapeFactory';
import { ShowCommand } from './ShowCommand';
import { TreeCommand } from './TreeCommand';
import { UndoCommand } from './UndoCommand';
import { UngroupCommand } from './UngroupCommand';
import { ZOrderCommand } from './ZOrderCommand';

/**
 * 命令注册表：命令名 → 规格（含工厂）。
 *
 * 这是任务书 §2.1 允许的**按名字分派处之一**（命令分发）。
 * 架构文档里须标注它为"待重构项"——按 §2.1 要求，插槽化之后
 * 这一处应改为插件注册，而不是内核里写死。
 */
export class CommandRegistry {
  private readonly specs = new Map<string, CommandSpec>();
  private readonly shapeFactory = new ShapeFactory();

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

    // ---- 图形编辑类（可 undo/redo，P5 接入命令栈）----
    this.register({
      name: 'create',
      usage: 'create <type> <id> [params...] [in <containerId>]',
      description: '创建图形：rect/circle/ellipse/line/text/g',
      create: (args, session) => new CreateCommand(args, session, this.shapeFactory),
    });
    this.register({
      name: 'move',
      usage: 'move <id> <dx> <dy>',
      description: '平移（增量）；作用于容器时整体平移',
      create: (args, session) => new MoveCommand(args, session),
    });
    this.register({
      name: 'scale',
      usage: 'scale <id> <factor>',
      description: '等比缩放（因子须为正数）；作用于容器时递归到每个子孙',
      create: (args, session) => new ScaleCommand(args, session),
    });
    this.register({
      name: 'set',
      usage: 'set <id> <attr> <value>',
      description: '设置属性：fill / stroke / stroke-width / 自身几何属性 / text',
      create: (args, session) => new SetCommand(args, session),
    });
    this.register({
      name: 'delete',
      usage: 'delete <id>',
      description: '删除图形（容器则连同全部子孙）',
      create: (args, session) => new DeleteCommand(args, session),
    });
    this.register({
      name: 'group',
      usage: 'group <newGid> <id1> <id2>...',
      description: '新建容器并收入若干图形（从各自原父容器摘出，保持相对顺序）',
      create: (args, session) => new GroupCommand(args, session),
    });
    this.register({
      name: 'ungroup',
      usage: 'ungroup <gid>',
      description: '解散容器，子图形提升到原容器的父级并占据其位置',
      create: (args, session) => new UngroupCommand(args, session),
    });
    this.register({
      name: 'addto',
      usage: 'addto <gid> <id>',
      description: '把已有图形移入容器（作为最后一个子节点）',
      create: (args, session) => new AddToCommand(args, session),
    });
    this.register({
      name: 'front',
      usage: 'front <id>',
      description: '调整 z-order：置于同级最前',
      create: (args, session) => new ZOrderCommand(args, session, 'front'),
    });
    this.register({
      name: 'back',
      usage: 'back <id>',
      description: '调整 z-order：置于同级最后',
      create: (args, session) => new ZOrderCommand(args, session, 'back'),
    });

    // ---- 撤销重做（不进入 undo 栈）----
    this.register({
      name: 'undo',
      usage: 'undo',
      description: '撤销上一次编辑命令',
      create: (_args, session) => new UndoCommand(session),
    });
    this.register({
      name: 'redo',
      usage: 'redo',
      description: '重做；undo 后若有新编辑，redo 栈清空',
      create: (_args, session) => new RedoCommand(session),
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
