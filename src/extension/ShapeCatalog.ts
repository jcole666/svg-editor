import type { Shape } from '../model/Shape';
import { UnknownShapeTypeError } from '../model/UnknownShapeTypeError';
import { DuplicateRegistrationError } from './DuplicateRegistrationError';
import type { ElementView } from './ElementView';
import type { ShapeProvider } from './ShapeProvider';

/**
 * 图形类型注册表。create 按 typeName 找，read 先看 data-kind，没有再按标签。
 * 带 kind 的提供者（box）不占用 svgTag，这样没装插件时 <g data-kind="box"> 仍能当普通分组读。
 */
export class ShapeCatalog {
  private readonly byType = new Map<string, ShapeProvider>();
  private readonly byKind = new Map<string, ShapeProvider>();
  private readonly byTag = new Map<string, ShapeProvider>();

  register(provider: ShapeProvider): void {
    if (this.byType.has(provider.typeName)) {
      throw new DuplicateRegistrationError('shapes', provider.typeName);
    }
    if (provider.kind !== null) {
      if (this.byKind.has(provider.kind)) {
        throw new DuplicateRegistrationError('shapes', provider.kind);
      }
    } else if (this.byTag.has(provider.svgTag)) {
      throw new DuplicateRegistrationError('shapes', provider.svgTag);
    }

    this.byType.set(provider.typeName, provider);
    if (provider.kind !== null) {
      this.byKind.set(provider.kind, provider);
    } else {
      this.byTag.set(provider.svgTag, provider);
    }
  }

  unregister(typeName: string): void {
    const provider = this.byType.get(typeName);
    if (provider === undefined) {
      return;
    }
    this.byType.delete(typeName);
    if (provider.kind !== null) {
      this.byKind.delete(provider.kind);
    } else {
      this.byTag.delete(provider.svgTag);
    }
  }

  create(typeName: string, id: string, params: string[]): Shape {
    const provider = this.byType.get(typeName);
    if (provider === undefined) {
      throw new UnknownShapeTypeError(typeName);
    }
    return provider.create(id, params);
  }

  /** 没有对应提供者时返回 null，调用方跳过这个标签（defs 之类）。 */
  readerFor(element: ElementView): ShapeProvider | null {
    const kind = element.attribute('data-kind');
    if (kind !== undefined && kind.length > 0) {
      const matched = this.byKind.get(kind);
      if (matched !== undefined) {
        return matched;
      }
    }
    return this.byTag.get(element.name) ?? null;
  }

  typeNames(): string[] {
    return [...this.byType.keys()];
  }
}
