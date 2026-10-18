import type { Document } from '../model/Document';

/**
 * 快照式撤销历史 —— P5 的**第一版实现**，刻意选择最直白的做法。
 *
 * 做法：每次编辑命令执行前，保存整份文档的深拷贝（snapshot）；
 * undo 时把整份文档换回上一个快照，redo 同理。
 *
 * 它能在十几分钟内让 undo 跑起来，但有两个代价（实测见文档"过程记录"）：
 *   1. 时间 / 内存：一步撤销要深拷贝整棵树，代价与文档规模成正比
 *   2. 语义：它只知道"整份文档变回了某个样子"，不知道**哪条命令被撤销**，
 *      因此生成不出任务书 §6 要求的反馈（如 `circle#c1 moved back to (100,100)`）
 *
 * 第 2 点是致命的——下一版会重构成 Command 模式。
 */
export class SnapshotHistory {
  private readonly undoStack: Document[] = [];
  private readonly redoStack: Document[] = [];
  private ioBlocked = false;

  /** 编辑命令执行前调用：记下"执行前的整份文档"。 */
  recordBeforeEdit(snapshot: Document): void {
    this.undoStack.push(snapshot);
    this.redoStack.length = 0;
    this.ioBlocked = false;
  }

  /** 文档类命令执行后调用：清空历史并禁止 undo/redo，直到下一次编辑。 */
  markIoCommand(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.ioBlocked = true;
  }

  undo(current: Document): Document | null {
    const previous = this.undoStack.pop();
    if (previous === undefined) {
      return null;
    }
    this.redoStack.push(current.clone());
    return previous;
  }

  redo(current: Document): Document | null {
    const next = this.redoStack.pop();
    if (next === undefined) {
      return null;
    }
    this.undoStack.push(current.clone());
    return next;
  }

  get isIoBlocked(): boolean {
    return this.ioBlocked;
  }
}
