import type { ElementView } from '../../src/extension/ElementView';
import type { ShapeProvider } from '../../src/extension/ShapeProvider';
import { copyExtraAttributes, svgLength } from '../../src/io/svgValues';
import { Rect } from '../../src/model/Rect';
import { Shape } from '../../src/model/Shape';
import { expectArity } from './expectArity';

export class RectProvider implements ShapeProvider {
  readonly typeName = 'rect';
  readonly svgTag = 'rect';
  readonly kind = null;

  create(id: string, params: string[]): Rect {
    expectArity(params, 4, 5, 'create rect <id> <x> <y> <w> <h> [fill]');
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
  }

  read(element: ElementView, id: string): Rect {
    const shape = new Rect(
      id,
      svgLength(element.attribute('x')),
      svgLength(element.attribute('y')),
      svgLength(element.attribute('width')),
      svgLength(element.attribute('height')),
    );
    copyExtraAttributes(element, shape, ['x', 'y', 'width', 'height']);
    return shape;
  }
}
