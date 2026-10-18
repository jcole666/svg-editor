import * as fs from 'node:fs';

import { Circle } from '../model/Circle';
import { Document } from '../model/Document';
import { Ellipse } from '../model/Ellipse';
import { Group } from '../model/Group';
import { Line } from '../model/Line';
import { Rect } from '../model/Rect';
import type { Shape } from '../model/Shape';
import { TextShape } from '../model/TextShape';
import { CannotReadFileError } from './CannotReadFileError';
import type { XmlElement } from './XmlElement';
import { XmlParser } from './XmlParser';

export interface ReadResult {
  readonly document: Document;
  /** 自动补 id 等提示，按出现顺序返回。 */
  readonly warnings: readonly string[];
}

interface ReadContext {
  /** 文件里**显式声明**过的所有 id（用于避免自动补的 id 撞车）。 */
  readonly declaredIds: Set<string>;
  /** 已经被使用的 id（显式声明 + 自动分配）。 */
  readonly claimedIds: Set<string>;
  readonly counters: Map<string, number>;
  readonly warnings: string[];
}

const SUPPORTED_TAGS = new Set(['rect', 'circle', 'ellipse', 'line', 'text', 'g']);

/**
 * 把 SVG 文件读成 Document（反序列化）。
 *
 * 两个要点：
 *   - **自动补 id**：外部 SVG 的元素可能没有 id，而本 CLI 靠 id 定位所有图形，
 *     因此按 `标签名+序号` 分配并打印警告（§2 / §6）
 *   - **保住未知属性**：字体、锚点、transform 等没被内核解析的属性原样保留，
 *     save 时不丢（见文档"变化点假设"里的已知限制）
 */
export class SvgReader {
  private readonly parser = new XmlParser();

  readFile(path: string): ReadResult {
    let source: string;
    try {
      source = fs.readFileSync(path, 'utf8');
    } catch {
      throw new CannotReadFileError(path);
    }

    try {
      return this.readSource(source);
    } catch {
      throw new CannotReadFileError(path);
    }
  }

  readSource(source: string): ReadResult {
    const root = this.parser.parse(source);
    if (root.name !== 'svg') {
      throw new Error('root element is not <svg>');
    }

    // 第一遍：收集所有显式 id，保证后面自动分配的 id 不会撞上还没读到的元素
    const declaredIds = new Set<string>();
    SvgReader.collectIds(root, declaredIds);

    const context: ReadContext = {
      declaredIds,
      claimedIds: new Set<string>(),
      counters: new Map<string, number>(),
      warnings: [],
    };

    const document = new Document(
      SvgReader.canvasLength(root.attribute('width'), root.attribute('viewBox'), 0),
      SvgReader.canvasLength(root.attribute('height'), root.attribute('viewBox'), 1),
    );

    for (const child of root.children) {
      const shape = this.buildShape(child, context);
      if (shape !== null) {
        document.add(shape);
      }
    }

    return { document, warnings: context.warnings };
  }

  private buildShape(element: XmlElement, context: ReadContext): Shape | null {
    if (!SUPPORTED_TAGS.has(element.name)) {
      return null;
    }

    const id = this.ensureId(element, context);

    switch (element.name) {
      case 'rect':
        return this.buildRect(element, id);
      case 'circle':
        return this.buildCircle(element, id);
      case 'ellipse':
        return this.buildEllipse(element, id);
      case 'line':
        return this.buildLine(element, id);
      case 'text':
        return this.buildText(element, id);
      default:
        return this.buildGroup(element, id, context);
    }
  }

  private buildRect(element: XmlElement, id: string): Rect {
    const shape = new Rect(
      id,
      SvgReader.length(element.attribute('x')),
      SvgReader.length(element.attribute('y')),
      SvgReader.length(element.attribute('width')),
      SvgReader.length(element.attribute('height')),
    );
    SvgReader.copyExtraAttributes(element, shape, ['x', 'y', 'width', 'height']);
    return shape;
  }

  private buildCircle(element: XmlElement, id: string): Circle {
    const shape = new Circle(
      id,
      SvgReader.length(element.attribute('cx')),
      SvgReader.length(element.attribute('cy')),
      SvgReader.length(element.attribute('r')),
    );
    SvgReader.copyExtraAttributes(element, shape, ['cx', 'cy', 'r']);
    return shape;
  }

  private buildEllipse(element: XmlElement, id: string): Ellipse {
    const shape = new Ellipse(
      id,
      SvgReader.length(element.attribute('cx')),
      SvgReader.length(element.attribute('cy')),
      SvgReader.length(element.attribute('rx')),
      SvgReader.length(element.attribute('ry')),
    );
    SvgReader.copyExtraAttributes(element, shape, ['cx', 'cy', 'rx', 'ry']);
    return shape;
  }

  private buildLine(element: XmlElement, id: string): Line {
    const shape = new Line(
      id,
      SvgReader.length(element.attribute('x1')),
      SvgReader.length(element.attribute('y1')),
      SvgReader.length(element.attribute('x2')),
      SvgReader.length(element.attribute('y2')),
    );
    SvgReader.copyExtraAttributes(element, shape, ['x1', 'y1', 'x2', 'y2']);
    return shape;
  }

  private buildText(element: XmlElement, id: string): TextShape {
    const shape = new TextShape(
      id,
      SvgReader.length(element.attribute('x')),
      SvgReader.length(element.attribute('y')),
      element.text.trim(),
    );
    SvgReader.copyExtraAttributes(element, shape, ['x', 'y']);
    return shape;
  }

  private buildGroup(element: XmlElement, id: string, context: ReadContext): Group {
    const group = new Group(id);
    for (const child of element.children) {
      const shape = this.buildShape(child, context);
      if (shape !== null) {
        group.addChild(shape);
      }
    }
    SvgReader.copyExtraAttributes(element, group, []);
    return group;
  }

  /**
   * 取 id：有就用，没有就按 `标签名+序号` 分配并记一条警告。
   * 序号从 1 开始，跳过已经被占用（显式声明过或已分配）的 id。
   */
  private ensureId(element: XmlElement, context: ReadContext): string {
    const declared = element.attribute('id');
    if (declared !== undefined && declared.length > 0 && !context.claimedIds.has(declared)) {
      context.claimedIds.add(declared);
      return declared;
    }

    let counter = context.counters.get(element.name) ?? 0;
    let candidate = '';
    do {
      counter += 1;
      candidate = `${element.name}${counter}`;
    } while (context.declaredIds.has(candidate) || context.claimedIds.has(candidate));

    context.counters.set(element.name, counter);
    context.claimedIds.add(candidate);
    context.warnings.push(`warning: assigned id ${candidate} to unnamed <${element.name}>`);

    return candidate;
  }

  /** 除 id 与已解析的几何属性外，其它属性原样保留。 */
  private static copyExtraAttributes(
    element: XmlElement,
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

  private static collectIds(element: XmlElement, ids: Set<string>): void {
    for (const child of element.children) {
      const id = child.attribute('id');
      if (id !== undefined && id.length > 0) {
        ids.add(id);
      }
      SvgReader.collectIds(child, ids);
    }
  }

  private static canvasLength(
    attribute: string | undefined,
    viewBox: string | undefined,
    axis: number,
  ): number {
    const direct = SvgReader.parseLength(attribute);
    if (direct !== null) {
      return direct;
    }

    if (viewBox !== undefined) {
      const parts = viewBox.trim().split(/[\s,]+/).map(Number);
      const value = parts[2 + axis];
      if (Number.isFinite(value)) {
        return value;
      }
    }

    return axis === 0 ? 800 : 600;
  }

  private static parseLength(value: string | undefined): number | null {
    if (value === undefined) {
      return null;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  /** 几何属性缺省为 0（SVG 的默认值）。 */
  private static length(value: string | undefined): number {
    const parsed = SvgReader.parseLength(value);
    return parsed === null ? 0 : parsed;
  }
}
