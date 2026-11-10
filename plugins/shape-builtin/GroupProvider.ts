import type { ElementView } from '../../src/extension/ElementView';
import type { Shape } from '../../src/model/Shape';
import type { ShapeProvider } from '../../src/extension/ShapeProvider';
import { copyExtraAttributes } from '../../src/io/svgValues';
import { Group } from '../../src/model/Group';
import { expectArity } from './expectArity';

export class GroupProvider implements ShapeProvider {
  readonly typeName = 'g';
  readonly svgTag = 'g';
  readonly kind = null;

  create(id: string, params: string[]): Group {
    expectArity(params, 0, 0, 'create g <id>');
    return new Group(id);
  }

  read(element: ElementView, id: string, readChild: (element: ElementView) => Shape | null): Group {
    const group = new Group(id);
    for (const child of element.children) {
      const shape = readChild(child);
      if (shape !== null) {
        group.addChild(shape);
      }
    }
    copyExtraAttributes(element, group, []);
    return group;
  }
}
