import type { ElementView } from '../../src/extension/ElementView';
import type { ShapeProvider } from '../../src/extension/ShapeProvider';
import { copyExtraAttributes, svgLength } from '../../src/io/svgValues';
import { Circle } from '../../src/model/Circle';
import { Shape } from '../../src/model/Shape';
import { expectArity } from './expectArity';

export class CircleProvider implements ShapeProvider {
  readonly typeName = 'circle';
  readonly svgTag = 'circle';
  readonly kind = null;

  create(id: string, params: string[]): Circle {
    expectArity(params, 3, 4, 'create circle <id> <cx> <cy> <r> [fill]');
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
  }

  read(element: ElementView, id: string): Circle {
    const shape = new Circle(
      id,
      svgLength(element.attribute('cx')),
      svgLength(element.attribute('cy')),
      svgLength(element.attribute('r')),
    );
    copyExtraAttributes(element, shape, ['cx', 'cy', 'r']);
    return shape;
  }
}
