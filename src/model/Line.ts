import { Shape } from './Shape';
import { UnknownAttributeError } from './UnknownAttributeError';

/** <line id x1 y1 x2 y2> */
export class Line extends Shape {
  private x1: number;
  private y1: number;
  private x2: number;
  private y2: number;

  constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id);
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  typeName(): string {
    return 'line';
  }

  toSvg(indent: number): string {
    const pad = ' '.repeat(indent);
    return (
      `${pad}<line id="${this.id}"` +
      ` x1="${Shape.formatNumber(this.x1)}"` +
      ` y1="${Shape.formatNumber(this.y1)}"` +
      ` x2="${Shape.formatNumber(this.x2)}"` +
      ` y2="${Shape.formatNumber(this.y2)}"` +
      `${this.presentationMarkup()}/>`
    );
  }

  geometrySummary(): string {
    return (
      `(${Shape.formatNumber(this.x1)},${Shape.formatNumber(this.y1)})` +
      ` -> (${Shape.formatNumber(this.x2)},${Shape.formatNumber(this.y2)})`
    );
  }

  geometryAttributes(): string[] {
    return ['x1', 'y1', 'x2', 'y2'];
  }

  referencePoint(): { x: number; y: number } {
    return { x: this.x1, y: this.y1 };
  }

  moveBy(dx: number, dy: number): void {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
  }

  scaleBy(factor: number): void {
    this.x1 *= factor;
    this.y1 *= factor;
    this.x2 *= factor;
    this.y2 *= factor;
  }

  protected createCopy(): Shape {
    return new Line(this.id, this.x1, this.y1, this.x2, this.y2);
  }

  protected setGeometryAttr(name: string, value: string): void {
    switch (name) {
      case 'x1':
        this.x1 = Shape.parseNumber(value);
        return;
      case 'y1':
        this.y1 = Shape.parseNumber(value);
        return;
      case 'x2':
        this.x2 = Shape.parseNumber(value);
        return;
      case 'y2':
        this.y2 = Shape.parseNumber(value);
        return;
      default:
        throw new UnknownAttributeError(name);
    }
  }

  protected getGeometryAttr(name: string): string | undefined {
    switch (name) {
      case 'x1':
        return Shape.formatNumber(this.x1);
      case 'y1':
        return Shape.formatNumber(this.y1);
      case 'x2':
        return Shape.formatNumber(this.x2);
      case 'y2':
        return Shape.formatNumber(this.y2);
      default:
        return undefined;
    }
  }
}
