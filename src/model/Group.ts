import { Shape } from './Shape';
import { UnknownAttributeError } from './UnknownAttributeError';

/**
 * <g> 容器 —— Composite 模式里的"组合"节点。
 *
 * 关键点：Group 自己也是一个 Shape，所以 move / scale / delete / set
 * 对容器与叶子图形完全一致（任务书 §2.1「容器与叶子统一操作」）。
 * 差别只在实现：叶子改自己的坐标，容器把动作递归转发给每个子节点。
 */
export class Group extends Shape {
  private readonly childNodes: Shape[] = [];

  typeName(): string {
    return 'g';
  }

  /** 只读视图，防止外部绕过 addChild / removeChild 直接改数组。 */
  children(): readonly Shape[] {
    return this.childNodes;
  }

  /** 插入子节点；index 省略时追加到末尾（addto 的语义）。 */
  addChild(child: Shape, index?: number): void {
    const position = index ?? this.childNodes.length;
    this.childNodes.splice(position, 0, child);
    child.attachTo(this);
  }

  /** 摘除子节点，返回它原来的下标；不在本容器里则返回 -1。 */
  removeChild(child: Shape): number {
    const index = this.childNodes.indexOf(child);
    if (index >= 0) {
      this.childNodes.splice(index, 1);
      child.attachTo(null);
    }
    return index;
  }

  /** node 是否是本容器的子孙（含更深层），用于阻止把容器塞进自己的后代。 */
  contains(node: Shape): boolean {
    for (const child of this.childNodes) {
      if (child === node) {
        return true;
      }
      if (child instanceof Group && child.contains(node)) {
        return true;
      }
    }
    return false;
  }

  toSvg(indent: number): string {
    const pad = ' '.repeat(indent);
    const attributes = ` id="${this.id}"${this.presentationMarkup()}`;
    if (this.childNodes.length === 0) {
      return `${pad}<g${attributes}/>`;
    }
    const inner = this.childNodes.map((child) => child.toSvg(indent + 2)).join('\n');
    return `${pad}<g${attributes}>\n${inner}\n${pad}</g>`;
  }

  /** 容器自身没有几何属性，摘要里只可能出现样式（如 fill）。 */
  geometrySummary(): string {
    return '';
  }

  /** 容器自身没有几何属性；子孙各自的几何由快照逐节点记录。 */
  geometryAttributes(): string[] {
    return [];
  }

  /** 容器没有单一坐标，move 反馈改用 "moved by (dx,dy)"。 */
  referencePoint(): { x: number; y: number } | null {
    return null;
  }

  moveBy(dx: number, dy: number): void {
    for (const child of this.childNodes) {
      child.moveBy(dx, dy);
    }
  }

  scaleBy(factor: number): void {
    for (const child of this.childNodes) {
      child.scaleBy(factor);
    }
  }

  protected createCopy(): Shape {
    const copy = new Group(this.id);
    for (const child of this.childNodes) {
      copy.addChild(child.clone());
    }
    return copy;
  }

  protected setGeometryAttr(name: string, _value: string): void {
    // 容器没有几何属性；fill / stroke 由基类处理
    throw new UnknownAttributeError(name);
  }

  protected getGeometryAttr(_name: string): string | undefined {
    return undefined;
  }
}
