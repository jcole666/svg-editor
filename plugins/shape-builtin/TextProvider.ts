import type { ElementView } from '../../src/extension/ElementView';
import type { ShapeProvider } from '../../src/extension/ShapeProvider';
import { copyExtraAttributes, svgLength } from '../../src/io/svgValues';
import { Shape } from '../../src/model/Shape';
import { TextShape } from '../../src/model/TextShape';
import { expectArity } from './expectArity';

export class TextProvider implements ShapeProvider {
  readonly typeName = 'text';
  readonly svgTag = 'text';
  readonly kind = null;

  create(id: string, params: string[]): TextShape {
    expectArity(params, 3, 3, 'create text <id> <x> <y> "content"');
    return new TextShape(id, Shape.parseNumber(params[0]), Shape.parseNumber(params[1]), params[2]);
  }

  read(element: ElementView, id: string): TextShape {
    const shape = new TextShape(
      id,
      svgLength(element.attribute('x')),
      svgLength(element.attribute('y')),
      element.text.trim(),
    );
    copyExtraAttributes(element, shape, ['x', 'y']);
    return shape;
  }
}
