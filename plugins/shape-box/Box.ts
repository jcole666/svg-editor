import { Group } from '../../src/model/Group';
import { Rect } from '../../src/model/Rect';
import { Shape } from '../../src/model/Shape';
import { TextShape } from '../../src/model/TextShape';

/**
 * 带标题的矩形框。序列化仍是 <g data-kind="box">，
 * tree 上显示 g#id，命令反馈用 box#id。
 */
export class Box extends Group {
  constructor(id: string) {
    super(id);
    this.restoreAttribute('data-kind', 'box');
  }

  typeName(): string {
    return 'box';
  }

  treeLabel(): string {
    return `g#${this.id}`;
  }

  canUngroup(): boolean {
    return false;
  }

  /** 矩形和文字是框的一部分，不能单独拿走。别的子节点可以。 */
  canDetach(child: Shape): boolean {
    return child.id !== `${this.id}-rect` && child.id !== `${this.id}-label`;
  }

  creationSummary(): string {
    return `box#${this.id} created (g#${this.id} + rect#${this.id}-rect + text#${this.id}-label)`;
  }

  protected createCopy(): Shape {
    const copy = new Box(this.id);
    for (const child of this.childShapes()) {
      copy.addChild(child.clone());
    }
    return copy;
  }

  static build(id: string, x: number, y: number, width: number, height: number, title: string): Box {
    const box = new Box(id);
    const rect = new Rect(id + '-rect', x, y, width, height);
    rect.setAttr('fill', '#4a90d9');
    const text = new TextShape(id + '-label', x + 20, y + height / 2 + 5, title);
    box.addChild(rect);
    box.addChild(text);
    return box;
  }
}
