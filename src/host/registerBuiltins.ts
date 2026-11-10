import { ExtensionHub } from '../extension/ExtensionHub';
import { AddToCommand } from '../commands/AddToCommand';
import { CanvasCommand } from '../commands/CanvasCommand';
import { CreateCommand } from '../commands/CreateCommand';
import { DeleteCommand } from '../commands/DeleteCommand';
import { GroupCommand } from '../commands/GroupCommand';
import { HelpCommand } from '../commands/HelpCommand';
import { InitCommand } from '../commands/InitCommand';
import { MoveCommand } from '../commands/MoveCommand';
import { ReadCommand } from '../commands/ReadCommand';
import { RedoCommand } from '../commands/RedoCommand';
import { SaveCommand } from '../commands/SaveCommand';
import { ScaleCommand } from '../commands/ScaleCommand';
import { SetCommand } from '../commands/SetCommand';
import { ShowCommand } from '../commands/ShowCommand';
import { TreeCommand } from '../commands/TreeCommand';
import { UndoCommand } from '../commands/UndoCommand';
import { UngroupCommand } from '../commands/UngroupCommand';
import { ZOrderCommand } from '../commands/ZOrderCommand';

/**
 * 把 Phase 1 的 19 条命令登记进注册表。
 * 放在 host 而不是注册表类里，这样内核不用认识这些具体类。
 */
export function registerBuiltinCommands(hub: ExtensionHub): void {
  const registry = hub.commands;

  registry.register({
    name: 'init',
    usage: 'init [w] [h]',
    description: '新建空画布（默认 800x600），作为当前文档',
    create: (args, session) => new InitCommand(args, session),
  });
  registry.register({
    name: 'read',
    usage: 'read <file.svg>',
    description: '读入 SVG 文件为当前文档；缺 id 时自动补并警告',
    create: (args, session) => new ReadCommand(args, session, hub.shapes),
  });
  registry.register({
    name: 'save',
    usage: 'save [file.svg]',
    description: '保存当前文档；无参数时保存到读入时的路径',
    create: (args, session) => new SaveCommand(args, session),
  });
  registry.register({
    name: 'canvas',
    usage: 'canvas [w] [h]',
    description: '无参数显示画布尺寸；带参数修改尺寸',
    create: (args, session) => new CanvasCommand(args, session),
  });

  registry.register({
    name: 'create',
    usage: 'create <type> <id> [params...] [in <containerId>]',
    description: '创建图形：rect/circle/ellipse/line/text/g',
    create: (args, session) => new CreateCommand(args, session, hub.shapes),
  });
  registry.register({
    name: 'move',
    usage: 'move <id> <dx> <dy>',
    description: '平移（增量）；作用于容器时整体平移',
    create: (args, session) => new MoveCommand(args, session),
  });
  registry.register({
    name: 'scale',
    usage: 'scale <id> <factor>',
    description: '等比缩放（因子须为正数）；作用于容器时递归到每个子孙',
    create: (args, session) => new ScaleCommand(args, session),
  });
  registry.register({
    name: 'set',
    usage: 'set <id> <attr> <value>',
    description: '设置属性：fill / stroke / stroke-width / 自身几何属性 / text',
    create: (args, session) => new SetCommand(args, session, hub.attributes),
  });
  registry.register({
    name: 'delete',
    usage: 'delete <id>',
    description: '删除图形（容器则连同全部子孙）',
    create: (args, session) => new DeleteCommand(args, session),
  });
  registry.register({
    name: 'group',
    usage: 'group <newGid> <id1> <id2>...',
    description: '新建容器并收入若干图形（从各自原父容器摘出，保持相对顺序）',
    create: (args, session) => new GroupCommand(args, session),
  });
  registry.register({
    name: 'ungroup',
    usage: 'ungroup <gid>',
    description: '解散容器，子图形提升到原容器的父级并占据其位置',
    create: (args, session) => new UngroupCommand(args, session),
  });
  registry.register({
    name: 'addto',
    usage: 'addto <gid> <id>',
    description: '把已有图形移入容器（作为最后一个子节点）',
    create: (args, session) => new AddToCommand(args, session),
  });
  registry.register({
    name: 'front',
    usage: 'front <id>',
    description: '调整 z-order：置于同级最前',
    create: (args, session) => new ZOrderCommand(args, session, 'front'),
  });
  registry.register({
    name: 'back',
    usage: 'back <id>',
    description: '调整 z-order：置于同级最后',
    create: (args, session) => new ZOrderCommand(args, session, 'back'),
  });

  registry.register({
    name: 'undo',
    usage: 'undo',
    description: '撤销上一次编辑命令',
    create: (_args, session) => new UndoCommand(session),
  });
  registry.register({
    name: 'redo',
    usage: 'redo',
    description: '重做；undo 后若有新编辑，redo 栈清空',
    create: (_args, session) => new RedoCommand(session),
  });

  registry.register({
    name: 'tree',
    usage: 'tree [id]',
    description: '显示结构树（默认全文档）',
    create: (args, session) => new TreeCommand(args, session, () => hub.decorators.all()),
  });
  registry.register({
    name: 'show',
    usage: 'show <id>',
    description: '显示单个图形的属性明细',
    create: (args, session) => new ShowCommand(args, session),
  });
  registry.register({
    name: 'help',
    usage: 'help',
    description: '显示全部命令与语法',
    create: () => new HelpCommand(() => registry.all()),
  });
}
