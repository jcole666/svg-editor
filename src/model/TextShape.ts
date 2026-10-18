import { Shape } from './Shape';
import { UnknownAttributeError } from './UnknownAttributeError';

/**
 * <text id x y>内容</text>
 *
 * 文本内容在 SVG 里是"子文本"，不是属性；因此 set 的属性名用任务书约定的 `text`。
 */
export class TextShape extends Shape {
  private x: number;
  private y: number;
  private content: string;

  constructor(id: string, x: number, y: number, content: string) {
    super(id);
    this.x = x;
    this.y = y;
    this.content = content;
  }

  typeName(): string {
    return 'text';
  }

  toSvg(indent: number): string {
    const pad = ' '.repeat(indent);
    return (
      `${pad}<text id="${this.id}"` +
      ` x="${Shape.formatNumber(this.x)}"` +
      ` y="${Shape.formatNumber(this.y)}"` +
      `${this.presentationMarkup()}>` +
      `${Shape.escapeText(this.content)}</text>`
    );
  }

  geometrySummary(): string {
    return (
      `(${Shape.formatNumber(this.x)},${Shape.formatNumber(this.y)})` +
      ` "${this.content}"`
    );
  }

  geometryAttributes(): string[] {
    return ['x', 'y', 'text'];
  }

  referencePoint(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  moveBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  /** 文本没有"尺寸"，缩放只作用于锚点，与其它图形保持同一套语义。 */
  scaleBy(factor: number): void {
    this.x *= factor;
    this.y *= factor;
  }

  protected createCopy(): Shape {
    return new TextShape(this.id, this.x, this.y, this.content);
  }

  protected setGeometryAttr(name: string, value: string): void {
    switch (name) {
      case 'x':
        this.x = Shape.parseNumber(value);
        return;
      case 'y':
        this.y = Shape.parseNumber(value);
        return;
      case 'text':
        this.content = value;
        return;
      default:
        throw new UnknownAttributeError(name);
    }
  }

  protected getGeometryAttr(name: string): string | undefined {
    switch (name) {
      case 'x':
        return Shape.formatNumber(this.x);
      case 'y':
        return Shape.formatNumber(this.y);
      case 'text':
        return this.content;
      default:
        return undefined;
    }
  }
}
