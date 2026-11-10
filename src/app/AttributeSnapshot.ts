import type { Shape } from '../model/Shape';

interface NodeState {
  readonly shape: Shape;
  readonly geometry: ReadonlyArray<readonly [string, string]>;
  readonly presentation: ReadonlyArray<readonly [string, string]>;
}

/**
 * set 走属性处理器时用的快照。
 * 一次 set 可能改到多个子部件，记整棵子树，undo 一次就能全部回去。
 * 处理器中途抛错也用同一份快照恢复，这样不会留下改了一半的文档。
 */
export class AttributeSnapshot {
  private readonly nodes: NodeState[] = [];

  static capture(root: Shape): AttributeSnapshot {
    const snapshot = new AttributeSnapshot();
    snapshot.collect(root);
    return snapshot;
  }

  restore(): void {
    for (const node of this.nodes) {
      node.shape.restorePresentation(node.presentation);
      for (const [name, value] of node.geometry) {
        node.shape.setAttr(name, value);
      }
    }
  }

  private collect(shape: Shape): void {
    this.nodes.push({
      shape,
      geometry: shape.geometryAttributes().map((name) => [name, shape.getAttr(name) ?? ''] as const),
      presentation: shape.capturePresentation(),
    });
    for (const child of shape.childShapes()) {
      this.collect(child);
    }
  }
}
