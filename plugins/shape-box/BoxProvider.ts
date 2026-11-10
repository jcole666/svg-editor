import type { ElementView } from '../../src/extension/ElementView';
import type { ShapeProvider } from '../../src/extension/ShapeProvider';
import { copyExtraAttributes } from '../../src/io/svgValues';
import { ReadRejectedError } from '../../src/io/ReadRejectedError';
import type { Shape } from '../../src/model/Shape';
import { Shape as ShapeBase } from '../../src/model/Shape';
import { UsageError } from '../../src/commands/UsageError';
import { Box } from './Box';

export class BoxProvider implements ShapeProvider {
  readonly typeName = 'box';
  readonly svgTag = 'g';
  readonly kind = 'box';

  create(id: string, params: string[]): Box {
    if (params.length !== 5) {
      throw new UsageError('create box <id> <x> <y> <w> <h> "<title>"');
    }
    return Box.build(
      id,
      ShapeBase.parseNumber(params[0]),
      ShapeBase.parseNumber(params[1]),
      ShapeBase.parseNumber(params[2]),
      ShapeBase.parseNumber(params[3]),
      params[4],
    );
  }

  read(element: ElementView, id: string, readChild: (element: ElementView) => Shape | null): Box {
    const children: Shape[] = [];
    for (const child of element.children) {
      const shape = readChild(child);
      if (shape !== null) {
        children.push(shape);
      }
    }

    const rect = children.find((child) => child.id === `${id}-rect`);
    const label = children.find((child) => child.id === `${id}-label`);
    if (rect === undefined || rect.typeName() !== 'rect' || label === undefined || label.typeName() !== 'text') {
      throw new ReadRejectedError(`cannot read box: ${id}`);
    }

    const box = new Box(id);
    for (const child of children) {
      box.addChild(child);
    }
    copyExtraAttributes(element, box, []);
    return box;
  }
}
