import type { Document } from '../model/Document';
import { Shape } from '../model/Shape';
import type { TreeDecorator } from '../extension/TreeDecorator';

/**
 * tree 命令的文本渲染（对齐任务书 §5.1）。
 *
 * 对齐规则：同一组兄弟节点按"最宽 label + 2 空格"对齐；
 * 容器没有属性时不补尾随空格。任务书示例中的列宽并不完全一致，
 * 这里取一条可复现的规则，避免输出随 label 长度抖动。
 *
 * 行尾标签由装饰器提供。一个都没注册时，拼出来的字符串和以前一样。
 */
export class TreeRenderer {
  renderDocument(document: Document, decorators: readonly TreeDecorator[] = []): string[] {
    const width = Shape.formatNumber(document.width);
    const height = Shape.formatNumber(document.height);
    const lines: string[] = [this.finish(`svg (${width}x${height})`, null, document, decorators)];
    this.renderChildren(document.children(), '', lines, document, decorators);
    return lines;
  }

  renderSubtree(
    shape: Shape,
    document: Document | null = null,
    decorators: readonly TreeDecorator[] = [],
  ): string[] {
    const attributes = shape.attributeSummary();
    const head = attributes.length > 0 ? `${shape.treeLabel()}  ${attributes}` : shape.treeLabel();
    const lines: string[] = [this.finish(head, shape, document, decorators)];
    this.renderChildren(shape.childShapes(), '', lines, document, decorators);
    return lines;
  }

  private renderChildren(
    children: readonly Shape[],
    prefix: string,
    lines: string[],
    document: Document | null,
    decorators: readonly TreeDecorator[],
  ): void {
    if (children.length === 0) {
      return;
    }

    const labelWidth = children.reduce((max, child) => Math.max(max, child.treeLabel().length), 0);
    const column = labelWidth + 2;

    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      const branch = isLast ? '└── ' : '├── ';
      const attributes = child.attributeSummary();
      const body =
        attributes.length > 0
          ? `${prefix}${branch}${child.treeLabel().padEnd(column)}${attributes}`
          : `${prefix}${branch}${child.treeLabel()}`;

      lines.push(this.finish(body, child, document, decorators));
      this.renderChildren(
        child.childShapes(),
        `${prefix}${isLast ? '    ' : '│   '}`,
        lines,
        document,
        decorators,
      );
    });
  }

  private finish(
    line: string,
    shape: Shape | null,
    document: Document | null,
    decorators: readonly TreeDecorator[],
  ): string {
    if (document === null || decorators.length === 0) {
      return line;
    }

    const tags: string[] = [];
    for (const decorator of decorators) {
      const tag = decorator.labelFor({ document, shape });
      if (tag.length > 0) {
        tags.push(tag);
      }
    }
    if (tags.length === 0) {
      return line;
    }
    return `${line} ${tags.join(' ')}`;
  }
}
