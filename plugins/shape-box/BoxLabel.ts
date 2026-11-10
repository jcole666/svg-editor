import type { TreeDecorator, TreeTarget } from '../../src/extension/TreeDecorator';

/** 只给 box 那一行加 (box)。不关心别的标签写了什么。 */
export class BoxLabel implements TreeDecorator {
  readonly name = 'box-type-label';

  labelFor(target: TreeTarget): string {
    if (target.shape !== null && target.shape.typeName() === 'box') {
      return '(box)';
    }
    return '';
  }
}
