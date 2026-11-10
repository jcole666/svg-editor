import type { ElementView } from '../../src/extension/ElementView';
import type { ShapeProvider } from '../../src/extension/ShapeProvider';
import { copyExtraAttributes, svgLength } from '../../src/io/svgValues';
import { Line } from '../../src/model/Line';
import { Shape } from '../../src/model/Shape';
import { expectArity } from './expectArity';

export class LineProvider implements ShapeProvider {
  readonly typeName = 'line';
  readonly svgTag = 'line';
  readonly kind = null;

  create(id: string, params: string[]): Line {
    expectArity(params, 4, 5, 'create line <id> <x1> <y1> <x2> <y2> [stroke]');
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
  }

  read(element: ElementView, id: string): Line {
    const shape = new Line(
      id,
      svgLength(element.attribute('x1')),
      svgLength(element.attribute('y1')),
      svgLength(element.attribute('x2')),
      svgLength(element.attribute('y2')),
    );
    copyExtraAttributes(element, shape, ['x1', 'y1', 'x2', 'y2']);
    return shape;
  }
}
