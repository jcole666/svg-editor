import { Circle } from '../model/Circle';
import { Ellipse } from '../model/Ellipse';
import { Group } from '../model/Group';
import { Line } from '../model/Line';
import { Rect } from '../model/Rect';
import { Shape } from '../model/Shape';
import { TextShape } from '../model/TextShape';
import { UnknownShapeTypeError } from '../model/UnknownShapeTypeError';
import { UsageError } from './UsageError';

type ShapeCreator = (id: string, params: string[]) => Shape;

/**
 * 图形工厂：类型名 → 造出对应图形的函数。
 *
 * 这是任务书 §2.1 允许的**第二处、也是最后一处**"按名字分派"
 * （图形工厂：类型名 → 类）。架构文档中已标注为待重构项：
 * 插件化阶段应由 ShapeProvider 注册表提供，内核不再认识具体类型。
 */
export class ShapeFactory {
  private readonly creators = new Map<string, ShapeCreator>();

  constructor() {
    this.registerDefaults();
  }

  create(typeName: string, id: string, params: string[]): Shape {
    const creator = this.creators.get(typeName);
    if (creator === undefined) {
      throw new UnknownShapeTypeError(typeName);
    }
    return creator(id, params);
  }

  typeNames(): string[] {
    return [...this.creators.keys()];
  }

  private register(typeName: string, creator: ShapeCreator): void {
    this.creators.set(typeName, creator);
  }

  private registerDefaults(): void {
    this.register('rect', (id, params) => {
      ShapeFactory.expectArity(params, 4, 5, 'create rect <id> <x> <y> <w> <h> [fill]');
      const shape = new Rect(
        id,
        Shape.parseNumber(params[0]),
        Shape.parseNumber(params[1]),
        Shape.parseNumber(params[2]),
        Shape.parseNumber(params[3]),
      );
      if (params.length === 5) {
        shape.setAttr('fill', params[4]);
      }
      return shape;
    });

    this.register('circle', (id, params) => {
      ShapeFactory.expectArity(params, 3, 4, 'create circle <id> <cx> <cy> <r> [fill]');
      const shape = new Circle(
        id,
        Shape.parseNumber(params[0]),
        Shape.parseNumber(params[1]),
        Shape.parseNumber(params[2]),
      );
      if (params.length === 4) {
        shape.setAttr('fill', params[3]);
      }
      return shape;
    });

    this.register('ellipse', (id, params) => {
      ShapeFactory.expectArity(params, 4, 5, 'create ellipse <id> <cx> <cy> <rx> <ry> [fill]');
      const shape = new Ellipse(
        id,
        Shape.parseNumber(params[0]),
        Shape.parseNumber(params[1]),
        Shape.parseNumber(params[2]),
        Shape.parseNumber(params[3]),
      );
      if (params.length === 5) {
        shape.setAttr('fill', params[4]);
      }
      return shape;
    });

    this.register('line', (id, params) => {
      ShapeFactory.expectArity(params, 4, 5, 'create line <id> <x1> <y1> <x2> <y2> [stroke]');
      const shape = new Line(
        id,
        Shape.parseNumber(params[0]),
        Shape.parseNumber(params[1]),
        Shape.parseNumber(params[2]),
        Shape.parseNumber(params[3]),
      );
      if (params.length === 5) {
        shape.setAttr('stroke', params[4]);
      }
      return shape;
    });

    this.register('text', (id, params) => {
      ShapeFactory.expectArity(params, 3, 3, 'create text <id> <x> <y> "content"');
      return new TextShape(id, Shape.parseNumber(params[0]), Shape.parseNumber(params[1]), params[2]);
    });

    this.register('g', (id, params) => {
      ShapeFactory.expectArity(params, 0, 0, 'create g <id>');
      return new Group(id);
    });
  }

  private static expectArity(
    params: string[],
    minimum: number,
    maximum: number,
    usage: string,
  ): void {
    if (params.length < minimum || params.length > maximum) {
      throw new UsageError(usage);
    }
  }
}
