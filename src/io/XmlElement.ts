/**
 * 解析出来的 XML 元素节点（只保留 SVG 子集需要的信息）。
 */
export class XmlElement {
  readonly name: string;
  readonly attributes: ReadonlyMap<string, string>;
  readonly children: XmlElement[] = [];
  /** 直接文本内容（已做实体解码），用于 <text>。 */
  text = '';

  constructor(name: string, attributes: Map<string, string>) {
    this.name = name;
    this.attributes = attributes;
  }

  attribute(name: string): string | undefined {
    return this.attributes.get(name);
  }
}
