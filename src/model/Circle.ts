import { Shape } from './Shape';
import { UnknownAttributeError } from './UnknownAttributeError';

/** <circle id cx cy r> */
export class Circle extends Shape {
  private cx: number;
  private cy: number;
  private radius: number;

  constructor(id: string, cx: number, cy: number, radius: number) {
    super(id);
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
  }

  typeName(): string {
    return 'circle';
  }

  toSvg(indent: number): string {
    const pad = ' '.repeat(indent);
    return (
      `${pad}<circle id="${this.id}"` +
      ` cx="${Shape.formatNumber(this.cx)}"` +
      ` cy="${Shape.formatNumber(this.cy)}"` +
      ` r="${Shape.formatNumber(this.radius)}"` +
      `${this.presentationMarkup()}/>`
    );
  }

  geometrySummary(): string {
    return (
      `cx=${Shape.formatNumber(this.cx)}` +
      ` cy=${Shape.formatNumber(this.cy)}` +
      ` r=${Shape.formatNumber(this.radius)}`
    );
  }

  referencePoint(): { x: number; y: number } {
    return { x: this.cx, y: this.cy };
  }

  moveBy(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  scaleBy(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.radius *= factor;
  }

  protected createCopy(): Shape {
    return new Circle(this.id, this.cx, this.cy, this.radius);
  }

  protected setGeometryAttr(name: string, value: string): void {
    switch (name) {
      case 'cx':
        this.cx = Shape.parseNumber(value);
        return;
      case 'cy':
        this.cy = Shape.parseNumber(value);
        return;
      case 'r':
        this.radius = Shape.parseNumber(value);
        return;
      default:
        throw new UnknownAttributeError(name);
    }
  }

  protected getGeometryAttr(name: string): string | undefined {
    switch (name) {
      case 'cx':
        return Shape.formatNumber(this.cx);
      case 'cy':
        return Shape.formatNumber(this.cy);
      case 'r':
        return Shape.formatNumber(this.radius);
      default:
        return undefined;
    }
  }
}
