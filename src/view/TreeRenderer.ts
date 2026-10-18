import type { Document } from '../model/Document';
import { Group } from '../model/Group';
import { Shape } from '../model/Shape';

/**
 * tree 命令的文本渲染（对齐任务书 §5.1）。
 *
 * 对齐规则：同一组兄弟节点按"最宽 label + 2 空格"对齐；
 * 容器没有属性时不补尾随空格。任务书示例中的列宽并不完全一致，
 * 这里取一条可复现的规则，避免输出随 label 长度抖动。
 */
export class TreeRenderer {
  renderDocument(document: Document): string[] {
    const width = Shape.formatNumber(document.width);
    const height = Shape.formatNumber(document.height);
    const lines: string[] = [`svg (${width}x${height})`];
    this.renderChildren(document.children(), '', lines);
    return lines;
  }

  renderSubtree(shape: Shape): string[] {
    const attributes = shape.attributeSummary();
    const lines: string[] = [
      attributes.length > 0 ? `${shape.label()}  ${attributes}` : shape.label(),
    ];
    if (shape instanceof Group) {
      this.renderChildren(shape.children(), '', lines);
    }
    return lines;
  }

  private renderChildren(children: readonly Shape[], prefix: string, lines: string[]): void {
    if (children.length === 0) {
      return;
    }

    const labelWidth = children.reduce((max, child) => Math.max(max, child.label().length), 0);
    const column = labelWidth + 2;

    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      const branch = isLast ? '└── ' : '├── ';
      const attributes = child.attributeSummary();

      if (attributes.length > 0) {
        lines.push(`${prefix}${branch}${child.label().padEnd(column)}${attributes}`);
      } else {
        lines.push(`${prefix}${branch}${child.label()}`);
      }

      if (child instanceof Group) {
        this.renderChildren(child.children(), `${prefix}${isLast ? '    ' : '│   '}`, lines);
      }
    });
  }
}
