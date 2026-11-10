import type { Shape } from '../model/Shape';
import type { ElementView } from './ElementView';

/**
 * 一种图形类型。create 和 read 都走它。
 * 内核只按 typeName / svgTag / data-kind 查找，不认识具体的类。
 */
export interface ShapeProvider {
  readonly typeName: string;
  /** 对应的 SVG 标签。box 也是 g，靠 kind 和普通分组区分。 */
  readonly svgTag: string;
  /** 有值时只认 data-kind，不占用 svgTag。没有插件时读入会退回普通标签。 */
  readonly kind: string | null;
  create(id: string, params: string[]): Shape;
  read(element: ElementView, id: string, readChild: (element: ElementView) => Shape | null): Shape;
}
