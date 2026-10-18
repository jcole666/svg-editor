import { Shape } from './Shape';
import { UnknownAttributeError } from './UnknownAttributeError';

/** <rect id x y width height> */
export class Rect extends Shape {
  private x: number;
  private y: number;
  private width: number;
  private height: number;

  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id);
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  typeName(): string {
    return 'rect';
  }

  toSvg(indent: number): string {
    const pad = ' '.repeat(indent);
    return (
      `${pad}<rect id="${this.id}"` +
      ` x="${Shape.formatNumber(this.x)}"` +
      ` y="${Shape.formatNumber(this.y)}"` +
      ` width="${Shape.formatNumber(this.width)}"` +
      ` height="${Shape.formatNumber(this.height)}"` +
      `${this.presentationMarkup()}/>`
    );
  }

  geometrySummary(): string {
    return (
      `x=${Shape.formatNumber(this.x)}` +
      ` y=${Shape.formatNumber(this.y)}` +
      ` w=${Shape.formatNumber(this.width)}` +
      ` h=${Shape.formatNumber(this.height)}`
    );
  }

  moveBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  scaleBy(factor: number): void {
    this.x *= factor;
    this.y *= factor;
    this.width *= factor;
    this.height *= factor;
  }

  protected createCopy(): Shape {
    return new Rect(this.id, this.x, this.y, this.width, this.height);
  }

  protected setGeometryAttr(name: string, value: string): void {
    switch (name) {
      case 'x':
        this.x = Shape.parseNumber(value);
        return;
      case 'y':
        this.y = Shape.parseNumber(value);
        return;
      case 'width':
        this.width = Shape.parseNumber(value);
        return;
      case 'height':
        this.height = Shape.parseNumber(value);
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
      case 'width':
        return Shape.formatNumber(this.width);
      case 'height':
        return Shape.formatNumber(this.height);
      default:
        return undefined;
    }
  }
}
