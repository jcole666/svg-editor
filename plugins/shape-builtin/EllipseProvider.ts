import type { ElementView } from '../../src/extension/ElementView';
import type { ShapeProvider } from '../../src/extension/ShapeProvider';
import { copyExtraAttributes, svgLength } from '../../src/io/svgValues';
import { Ellipse } from '../../src/model/Ellipse';
import { Shape } from '../../src/model/Shape';
import { expectArity } from './expectArity';

export class EllipseProvider implements ShapeProvider {
  readonly typeName = 'ellipse';
  readonly svgTag = 'ellipse';
  readonly kind = null;

  create(id: string, params: string[]): Ellipse {
    expectArity(params, 4, 5, 'create ellipse <id> <cx> <cy> <rx> <ry> [fill]');
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
  }

  read(element: ElementView, id: string): Ellipse {
    const shape = new Ellipse(
      id,
      svgLength(element.attribute('cx')),
      svgLength(element.attribute('cy')),
      svgLength(element.attribute('rx')),
      svgLength(element.attribute('ry')),
    );
    copyExtraAttributes(element, shape, ['cx', 'cy', 'rx', 'ry']);
    return shape;
  }
}
