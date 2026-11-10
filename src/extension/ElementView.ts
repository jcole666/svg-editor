/**
 * 读 SVG 时插件能看到的元素。XmlElement 满足这个形状，
 * 扩展点这边不直接依赖解析器，免得 io 和 extension 互相 import。
 */
export interface ElementView {
  readonly name: string;
  readonly text: string;
  readonly children: readonly ElementView[];
  readonly attributes: ReadonlyMap<string, string>;
  attribute(name: string): string | undefined;
}
