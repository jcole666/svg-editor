import type { Group } from './Group';
import { InvalidNumberError } from './InvalidNumberError';

/**
 * 所有图形的抽象基类。
 *
 * 设计要点（对应课件与任务书）：
 * 1. 多态替代 switch：每种图形的"画成 SVG / 移动 / 缩放 / 设属性"都由子类自己实现，
 *    上层命令只面向 Shape 调用 —— 对应 OOP 回顾 p28-32（instanceof 反例 vs 抽象方法正例）。
 * 2. Composite：容器 Group 与叶子图形共用同一个 Shape 接口，
 *    move / scale / delete 对二者一视同仁 —— 对应任务书 §2.1。
 * 3. 一类一文件、文件名 = 类名 —— 对应任务书 §2.1。
 */
export abstract class Shape {
  /** 所有图形都支持的样式属性（set 白名单的公共部分）。 */
  private static readonly STYLE_ATTRIBUTES: ReadonlySet<string> = new Set([
    'fill',
    'stroke',
    'stroke-width',
  ]);

  private readonly shapeId: string;
  private parentGroup: Group | null = null;
  /** 非几何属性：fill / stroke / stroke-width，以及从外部 SVG 保留的原始属性。 */
  private readonly presentation = new Map<string, string>();

  constructor(id: string) {
    this.shapeId = id;
  }

  get id(): string {
    return this.shapeId;
  }

  get parent(): Group | null {
    return this.parentGroup;
  }

  /** 维护父子双向指针；只应由 Group 在挂载 / 摘除子节点时调用。 */
  attachTo(parent: Group | null): void {
    this.parentGroup = parent;
  }

  // ---- 子类必须实现的多态行为 ----

  /** SVG 标签名，也是 create 的类型名：rect / circle / ellipse / line / text / g */
  abstract typeName(): string;

  /** 把自己（含子孙）渲染成 SVG 文本；indent 为前置空格数。 */
  abstract toSvg(indent: number): string;

  /** 几何部分的紧凑摘要，用于 tree / show。 */
  abstract geometrySummary(): string;

  /** 平移（增量）。容器递归到每个子孙。 */
  abstract moveBy(dx: number, dy: number): void;

  /** 等比缩放：factor 同乘到全部几何属性。容器递归到每个子孙。 */
  abstract scaleBy(factor: number): void;

  /** 复制几何数据，供 clone() 的模板方法调用。 */
  protected abstract createCopy(): Shape;

  /** 设置本类型自己的几何属性；不在白名单时抛 UnknownAttributeError。 */
  protected abstract setGeometryAttr(name: string, value: string): void;

  /** 读取本类型自己的几何属性（用于 undo 记忆、show 明细）。 */
  protected abstract getGeometryAttr(name: string): string | undefined;

  // ---- 所有图形共用的模板方法 ----

  /**
   * set 命令的统一入口：先判断公共样式属性，再交给子类判断几何属性。
   * 白名单外的属性会由子类抛出 UnknownAttributeError。
   */
  setAttr(name: string, value: string): void {
    if (Shape.STYLE_ATTRIBUTES.has(name)) {
      this.presentation.set(name, value);
      return;
    }
    this.setGeometryAttr(name, value);
  }

  /** 读取属性；不存在时返回 undefined。 */
  getAttr(name: string): string | undefined {
    if (Shape.STYLE_ATTRIBUTES.has(name)) {
      return this.presentation.get(name);
    }
    return this.getGeometryAttr(name);
  }

  /** 从外部 SVG 还原属性时使用：绕过 set 白名单，原样保留。 */
  restoreAttribute(name: string, value: string): void {
    this.presentation.set(name, value);
  }

  /**
   * 模板方法：几何数据的复制由子类 createCopy() 负责，
   * 属性复制与对象装配在这里统一完成。
   */
  clone(): Shape {
    const copy = this.createCopy();
    this.copyPresentationTo(copy);
    return copy;
  }

  protected copyPresentationTo(target: Shape): void {
    for (const [name, value] of this.presentation) {
      target.presentation.set(name, value);
    }
  }

  label(): string {
    return `${this.typeName()}#${this.id}`;
  }

  /**
   * tree 的行内摘要：几何 + fill。
   *
   * 关于 stroke：任务书 §6.1 的 line 以 stroke=black 创建，但 tree 输出中只显示
   * `(280,130) -> (520,130)`，不含 stroke。因此 tree 只内联 fill，
   * stroke / stroke-width 保留在 show 明细里。
   */
  attributeSummary(): string {
    const parts: string[] = [];
    const geometry = this.geometrySummary();
    if (geometry.length > 0) {
      parts.push(geometry);
    }
    const fill = this.presentation.get('fill');
    if (fill !== undefined) {
      parts.push(`fill=${fill}`);
    }
    return parts.join(' ');
  }

  /** show 的明细行：几何一行，之后每个属性一行。 */
  detailLines(): string[] {
    const lines: string[] = [];
    const geometry = this.geometrySummary();
    if (geometry.length > 0) {
      lines.push(geometry);
    }
    for (const [name, value] of this.presentation) {
      lines.push(`${name}=${value}`);
    }
    return lines;
  }

  /** 把非几何属性渲染成 ` fill="#fff"` 这样的片段。 */
  protected presentationMarkup(): string {
    let markup = '';
    for (const [name, value] of this.presentation) {
      markup += ` ${name}="${Shape.escapeAttribute(value)}"`;
    }
    return markup;
  }

  protected static formatNumber(value: number): string {
    if (!Number.isFinite(value)) {
      throw new InvalidNumberError(String(value));
    }
    if (Number.isInteger(value)) {
      return String(value);
    }
    return String(Math.round(value * 1e6) / 1e6);
  }

  protected static parseNumber(value: string): number {
    if (value.trim().length === 0) {
      throw new InvalidNumberError(value);
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      throw new InvalidNumberError(value);
    }
    return parsed;
  }

  protected static escapeAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  protected static escapeText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
