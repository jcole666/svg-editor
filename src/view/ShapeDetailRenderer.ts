import { Shape } from '../model/Shape';

/**
 * show 命令的文本渲染（对齐任务书 §5.2）。
 *
 * 首行是 `label  parent=xxx`，之后每个属性一行、两格缩进；
 * 根级图形的 parent 显示为 svg。
 */
export class ShapeDetailRenderer {
  render(shape: Shape): string[] {
    const parentLabel = shape.parent === null ? 'svg' : shape.parent.label();
    const lines: string[] = [`${shape.label()}  parent=${parentLabel}`];
    for (const detail of shape.detailLines()) {
      lines.push(`  ${detail}`);
    }
    return lines;
  }
}
