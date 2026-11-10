import * as fs from 'node:fs';

import type { ShapeCatalog } from '../extension/ShapeCatalog';
import { Document } from '../model/Document';
import { DuplicateIdError } from '../model/DuplicateIdError';
import type { Shape } from '../model/Shape';
import { CannotReadFileError } from './CannotReadFileError';
import { ReadRejectedError } from './ReadRejectedError';
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

/**
 * 把 SVG 文件读成 Document。
 *
 * 具体图形怎么建交给 ShapeCatalog。这里只负责补 id、跳过不认识的标签，
 * 以及在插件明确拒绝时不要把错误吞成"文件打不开"。
 */
export class SvgReader {
  private readonly parser = new XmlParser();

  constructor(private readonly shapes: ShapeCatalog) {}

  readFile(path: string): ReadResult {
    let source: string;
    try {
      source = fs.readFileSync(path, 'utf8');
    } catch {
      throw new CannotReadFileError(path);
    }

    try {
      return this.readSource(source);
    } catch (error) {
      if (error instanceof DuplicateIdError || error instanceof ReadRejectedError) {
        throw error;
      }
      throw new CannotReadFileError(path);
    }
  }

  readSource(source: string): ReadResult {
    const root = this.parser.parse(source);
    if (root.name !== 'svg') {
      throw new Error('root element is not <svg>');
    }

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
    const provider = this.shapes.readerFor(element);
    if (provider === null) {
      return null;
    }

    const id = this.ensureId(element, context);
    return provider.read(element, id, (child) => this.buildShape(child as XmlElement, context));
  }

  /**
   * 取 id：有就用，没有就按 `标签名+序号` 分配并记一条警告。
   * 显式 id 重复时直接拒绝整份读入，不能靠再分配一个新 id 把冲突藏起来。
   */
  private ensureId(element: XmlElement, context: ReadContext): string {
    const declared = element.attribute('id');
    if (declared !== undefined && declared.length > 0) {
      if (context.claimedIds.has(declared)) {
        throw new DuplicateIdError(declared);
      }
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
}
