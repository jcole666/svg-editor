import { DuplicateIdError } from './DuplicateIdError';
import { Group } from './Group';
import { NoSuchShapeError } from './NoSuchShapeError';
import { Shape } from './Shape';

/** 某个图形在树中的位置。 */
export interface ShapePosition {
  readonly parent: Group | null;
  readonly index: number;
}

/** remove() 的结果：图形本身 + 它原来的位置。 */
export interface RemovedShape extends ShapePosition {
  readonly shape: Shape;
}

/**
 * 当前打开的文档 —— 命令模式里的 Receiver（业务层）。
 *
 * 它知道"怎么改数据"：持有画布尺寸、根级图形列表、以及 id → 图形的索引。
 * 命令对象只负责把请求转发到这里（对应命令模式 p17「命令只做转发」）。
 *
 * 两套操作要分清：
 *   - add / insert / remove：**登记或注销 id 索引**，用于新建、删除
 *   - detach / reparent    ：**只调整树结构**，用于移动图形（id 不变，不能重复登记）
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

  /** 图形在当前父容器（或画布根）里的下标。 */
  indexOf(shape: Shape): number {
    const parent = shape.parent;
    return parent === null ? this.rootShapes.indexOf(shape) : parent.children().indexOf(shape);
  }

  /** 给定父容器下的兄弟数量。 */
  siblingCount(parent: Group | null): number {
    return parent === null ? this.rootShapes.length : parent.children().length;
  }

  /**
   * 登记图形（含全部子孙）并追加到父容器末尾（parent 省略时挂到画布根）。
   * id 重复时抛 DuplicateIdError，且不改变任何状态（先校验后修改）。
   */
  add(shape: Shape, parent?: Group): void {
    this.registerSubtree(shape);
    this.attach(shape, parent ?? null, parent === undefined ? this.rootShapes.length : parent.children().length);
  }

  /**
   * 在指定位置插入图形（含子孙），并登记 id。
   * index 越界时退化为追加到末尾。
   */
  insert(shape: Shape, parent: Group | null, index: number): void {
    this.registerSubtree(shape);
    this.attach(shape, parent, index);
  }

  /**
   * 只调整结构位置，**不**重新登记 id —— 用于移动一个已经在文档里的图形。
   * 与 insert 的区别正是 GroupCommand / AddToCommand / ungroup 需要的地方。
   */
  reparent(shape: Shape, parent: Group | null, index: number): void {
    this.attach(shape, parent, index);
  }

  /**
   * 从父容器（或画布根）摘除，但**保留 id 索引**。
   * 返回它原来的位置，供 undo 原位恢复。
   */
  detach(shape: Shape): ShapePosition {
    const parent = shape.parent;
    const index = this.indexOf(shape);

    if (parent === null) {
      const rootIndex = this.rootShapes.indexOf(shape);
      if (rootIndex >= 0) {
        this.rootShapes.splice(rootIndex, 1);
      }
    } else {
      parent.removeChild(shape);
    }

    return { parent, index };
  }

  /** 摘除图形（含子孙）并从索引中注销，返回它原来的位置。 */
  remove(id: string): RemovedShape {
    const shape = this.require(id);
    const position = this.detach(shape);
    this.unregisterSubtree(shape);
    return { shape, parent: position.parent, index: position.index };
  }

  countShapes(): number {
    return this.shapesById.size;
  }

  /** 深拷贝整份文档（测试与工具用；撤销已改为 Command 模式，不再依赖它）。 */
  clone(): Document {
    const copy = new Document(this.canvasWidth, this.canvasHeight);
    copy.sourceFilePath = this.sourceFilePath;
    for (const shape of this.rootShapes) {
      copy.add(shape.clone());
    }
    return copy;
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

  /** 只挂接结构：设置父子指针并插入到指定下标。 */
  private attach(shape: Shape, parent: Group | null, index: number): void {
    if (parent === null) {
      const position = Document.clamp(index, this.rootShapes.length);
      this.rootShapes.splice(position, 0, shape);
      shape.attachTo(null);
      return;
    }
    parent.addChild(shape, Document.clamp(index, parent.children().length));
  }

  private static clamp(index: number, max: number): number {
    if (index < 0) {
      return 0;
    }
    return index > max ? max : index;
  }

  private registerSubtree(shape: Shape): void {
    if (this.shapesById.has(shape.id)) {
      throw new DuplicateIdError(shape.id);
    }
    this.shapesById.set(shape.id, shape);
    for (const child of shape.childShapes()) {
      this.registerSubtree(child);
    }
  }

  private unregisterSubtree(shape: Shape): void {
    this.shapesById.delete(shape.id);
    for (const child of shape.childShapes()) {
      this.unregisterSubtree(child);
    }
  }
}
