import type { AttributeEffect, AttributeHandler } from '../../src/extension/AttributeHandler';
import type { Shape } from '../../src/model/Shape';

/** fill 改内部矩形，label 改内部文字。字段仍然封装在子图形里。 */
export class BoxAttributeHandler implements AttributeHandler {
  readonly name = 'box-attributes';

  handles(shape: Shape, attribute: string): boolean {
    return shape.typeName() === 'box' && (attribute === 'fill' || attribute === 'label');
  }

  apply(shape: Shape, attribute: string, value: string): AttributeEffect {
    if (attribute === 'fill') {
      const rect = this.part(shape, 'rect', 'rect');
      rect.setAttr('fill', value);
      return {
        summary: `${shape.label()} fill propagated to ${shape.id}-rect`,
        undoSummary: `${shape.label()} fill restored on ${shape.id}-rect`,
      };
    }

    const text = this.part(shape, 'label', 'text');
    const previous = text.getAttr('text') ?? '';
    text.setAttr('text', value);
    return {
      summary: `${shape.label()} label updated: "${value}"`,
      undoSummary: `${shape.label()} label restored: "${previous}"`,
    };
  }

  private part(shape: Shape, suffix: string, typeName: string): Shape {
    const id = `${shape.id}-${suffix}`;
    const found = shape.childShapes().find((child) => child.id === id);
    if (found === undefined || found.typeName() !== typeName) {
      throw new Error(`box ${shape.id} is missing ${id}`);
    }
    return found;
  }
}
