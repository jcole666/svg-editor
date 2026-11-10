import type { ElementView } from '../extension/ElementView';
import type { Shape } from '../model/Shape';

/** 几何属性缺省按 0，和 SVG 的默认值一致。解析不了也按 0，避免读入中途崩掉。 */
export function svgLength(value: string | undefined): number {
  if (value === undefined) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** id 和已经写进字段的几何属性不再重复放进 presentation。 */
export function copyExtraAttributes(
  element: ElementView,
  shape: Shape,
  geometryAttributes: readonly string[],
): void {
  for (const [name, value] of element.attributes) {
    if (name === 'id' || geometryAttributes.includes(name)) {
      continue;
    }
    shape.restoreAttribute(name, value);
  }
}
