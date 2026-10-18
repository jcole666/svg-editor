import { DuplicateIdError } from './DuplicateIdError';
import { Group } from './Group';
import { NoSuchShapeError } from './NoSuchShapeError';
import { Shape } from './Shape';

/** remove() 的结果：图形本身 + 它原来的父子位置。 */
export interface RemovedShape {
  readonly shape: Shape;
  readonly parent: Group | null;
  readonly index: number;
}

/**
 * 当前打开的文档 —— 命令模式里的 Receiver（业务层）。
 *
 * 它知道"怎么改数据"：持有画布尺寸、根级图形列表、以及 id → 图形的索引。
 * 命令对象只负责把请求转发到这里（对应命令模式 p17「命令只做转发」）。
 */
export class Document {
  private canvasWidth: number;
  private canvasHeight: number;
  private readonly rootShapes: Shape[] = [];
  private readonly shapesById = new Map<string, Shape>();
  private sourceFilePath: string | null = null;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  get width(): number {
    return this.canvasWidth;
  }

  get height(): number {
    return this.canvasHeight;
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /** read 打开的文件路径；save 无参数时用它。 */
  get sourcePath(): string | null {
    return this.sourceFilePath;
  }

  setSourcePath(path: string | null): void {
    this.sourceFilePath = path;
  }

  children(): readonly Shape[] {
    return this.rootShapes;
  }

  has(id: string): boolean {
    return this.shapesById.has(id);
  }

  find(id: string): Shape | undefined {
    return this.shapesById.get(id);
  }

  require(id: string): Shape {
    const shape = this.find(id);
    if (!shape) {
      throw new NoSuchShapeError(id);
    }
    return shape;
  }

  /**
   * 登记图形（含全部子孙）并挂到父容器；parent 省略时挂到画布根。
   * id 重复时抛 DuplicateIdError，且不改变任何状态（先校验后修改）。
   */
  add(shape: Shape, parent?: Group): void {
    this.registerSubtree(shape);
    if (parent) {
      parent.addChild(shape);
    } else {
      this.rootShapes.push(shape);
    }
  }

  /**
   * 摘除图形（含子孙），返回它原来的父子位置。
   *
   * 返回 parent / index 是给 P5 的 undo 用的：恢复时必须放回原父容器的原位，
   * 否则兄弟顺序变了，z-order 就错了。
   */
  remove(id: string): RemovedShape {
    const shape = this.require(id);
    const parent = shape.parent;
    const siblings = parent === null ? this.rootShapes : parent.children();
    const index = siblings.indexOf(shape);

    if (parent === null) {
      const rootIndex = this.rootShapes.indexOf(shape);
      if (rootIndex >= 0) {
        this.rootShapes.splice(rootIndex, 1);
      }
    } else {
      parent.removeChild(shape);
    }

    this.unregisterSubtree(shape);
    return { shape, parent, index };
  }

  countShapes(): number {
    return this.shapesById.size;
  }

  /** 渲染整份文档（不含 XML 声明，由写入器补）。 */
  toSvg(): string {
    const width = Shape.formatNumber(this.canvasWidth);
    const height = Shape.formatNumber(this.canvasHeight);
    const open =
      `<svg xmlns="http://www.w3.org/2000/svg"` +
      ` width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`;

    if (this.rootShapes.length === 0) {
      return `${open}/>`;
    }
    const inner = this.rootShapes.map((shape) => shape.toSvg(2)).join('\n');
    return `${open}>\n${inner}\n</svg>`;
  }

  private registerSubtree(shape: Shape): void {
    if (this.shapesById.has(shape.id)) {
      throw new DuplicateIdError(shape.id);
    }
    this.shapesById.set(shape.id, shape);
    if (shape instanceof Group) {
      for (const child of shape.children()) {
        this.registerSubtree(child);
      }
    }
  }

  private unregisterSubtree(shape: Shape): void {
    this.shapesById.delete(shape.id);
    if (shape instanceof Group) {
      for (const child of shape.children()) {
        this.unregisterSubtree(child);
      }
    }
  }
}
