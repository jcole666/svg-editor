import type { Session } from '../app/Session';
import type { UndoableCommand } from '../app/UndoableCommand';
import { CannotUngroupTopLevelError } from '../model/CannotUngroupTopLevelError';
import { Group } from '../model/Group';
import { NotAContainerError } from '../model/NotAContainerError';
import type { Shape } from '../model/Shape';
import { UsageError } from './UsageError';

/**
 * ungroup <gid> —— 解散容器，子图形提升到原容器的父级、占据原容器的位置（§3）。
 *
 * 画布根级的容器不允许解散（§4.2 的 cannot ungroup top-level container）。
 *
 * undo：按原来的父容器、下标与子节点顺序，把容器重新组装出来。
 */
export class UngroupCommand implements UndoableCommand {
  readonly kind = 'edit' as const;
  private container: Group | null = null;
  private parent: Group | null = null;
  private index = 0;
  private childOrder: Shape[] = [];

  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.args.length !== 1) {
      throw new UsageError('ungroup <gid>');
    }

    const container = document.require(this.args[0]);
    if (!container.isContainer()) {
      throw new NotAContainerError(this.args[0]);
    }

    const parent = container.parent;
    if (parent === null) {
      throw new CannotUngroupTopLevelError(container.id);
    }

    const index = document.indexOf(container);
    const children = [...container.children()];

    for (const child of children) {
      container.removeChild(child);
    }
    document.remove(container.id);

    let position = index;
    for (const child of children) {
      document.reparent(child, parent, position);
      position += 1;
    }

    this.container = container;
    this.parent = parent;
    this.index = index;
    this.childOrder = children;

    const count = children.length;
    return [
      `${container.label()} ungrouped into ${parent.label()} (${count} ${
        count === 1 ? 'child' : 'children'
      })`,
    ];
  }

  undo(): string[] {
    const container = this.container;
    if (container === null) {
      throw new Error('ungroup command has nothing to undo');
    }

    const document = this.session.requireDocument();

    // 必须放回**原来那个对象**，不能 new 一个新的：
    // 先前命令（delete / front / back / addto / group）的 undo 里存着
    // 指向这个容器的引用，换成新对象会让那些引用指向脱离文档树的孤儿节点。
    document.insert(container, this.parent, this.index);

    for (const child of this.childOrder) {
      document.detach(child);
    }
    for (const child of this.childOrder) {
      container.addChild(child);
    }

    const count = this.childOrder.length;
    return [
      `${container.label()} regrouped with ${count} ${count === 1 ? 'child' : 'children'}`,
    ];
  }
}
