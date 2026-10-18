import { Shape } from './Shape';
import { UnknownAttributeError } from './UnknownAttributeError';

/** <ellipse id cx cy rx ry> */
export class Ellipse extends Shape {
  private cx: number;
  private cy: number;
  private rx: number;
  private ry: number;

  constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id);
    this.cx = cx;
    this.cy = cy;
    this.rx = rx;
    this.ry = ry;
  }

  typeName(): string {
    return 'ellipse';
  }

  toSvg(indent: number): string {
    const pad = ' '.repeat(indent);
    return (
      `${pad}<ellipse id="${this.id}"` +
      ` cx="${Shape.formatNumber(this.cx)}"` +
      ` cy="${Shape.formatNumber(this.cy)}"` +
      ` rx="${Shape.formatNumber(this.rx)}"` +
      ` ry="${Shape.formatNumber(this.ry)}"` +
      `${this.presentationMarkup()}/>`
    );
  }

  geometrySummary(): string {
    return (
      `cx=${Shape.formatNumber(this.cx)}` +
      ` cy=${Shape.formatNumber(this.cy)}` +
      ` rx=${Shape.formatNumber(this.rx)}` +
      ` ry=${Shape.formatNumber(this.ry)}`
    );
  }

  moveBy(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  scaleBy(factor: number): void {
    this.cx *= factor;
    this.cy *= factor;
    this.rx *= factor;
    this.ry *= factor;
  }

  protected createCopy(): Shape {
    return new Ellipse(this.id, this.cx, this.cy, this.rx, this.ry);
  }

  protected setGeometryAttr(name: string, value: string): void {
    switch (name) {
      case 'cx':
        this.cx = Shape.parseNumber(value);
        return;
      case 'cy':
        this.cy = Shape.parseNumber(value);
        return;
      case 'rx':
        this.rx = Shape.parseNumber(value);
        return;
      case 'ry':
        this.ry = Shape.parseNumber(value);
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
      case 'rx':
        return Shape.formatNumber(this.rx);
      case 'ry':
        return Shape.formatNumber(this.ry);
      default:
        return undefined;
    }
  }
}
