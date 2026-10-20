import type { Shape } from '../model/Shape';

interface Entry {
  readonly shape: Shape;
  readonly values: ReadonlyArray<readonly [string, string]>;
}

/**
 * 几何快照：记下**一棵子树里每个节点的几何属性值**，用于精确还原。
 *
 * 与"整份文档快照"的区别：
 *   - 范围：只覆盖被这条命令改动的那棵子树（移动一个叶子 = 1 个节点）
 *   - 内容：只存几何属性，不复制对象，也不涉及结构与样式
 *
 * 为什么不用"反向运算"（moveBy(-dx,-dy) / scaleBy(1/f)）：
 * 浮点运算不保证可逆（如 10 × 3 ÷ 3 可能得到 9.999999999999998）。
 * 记下旧值再写回去，才能保证 undo 后与原文逐位一致。
 */
export class GeometrySnapshot {
  private readonly entries: Entry[] = [];

  static capture(root: Shape): GeometrySnapshot {
    const snapshot = new GeometrySnapshot();
    snapshot.collect(root);
    return snapshot;
  }

  /** 把记录下来的几何值写回原对象（对象身份不变，因此其它引用仍然有效）。 */
  restore(): void {
    for (const entry of this.entries) {
      for (const [name, value] of entry.values) {
        entry.shape.setAttr(name, value);
      }
    }
  }

  private collect(shape: Shape): void {
    this.entries.push({
      shape,
      values: shape.geometryAttributes().map((name) => [name, shape.getAttr(name) ?? ''] as const),
    });

    for (const child of shape.childShapes()) {
      this.collect(child);
    }
  }
}
