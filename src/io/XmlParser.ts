import { XmlElement } from './XmlElement';

/**
 * 极简 XML 解析器：只覆盖 SVG 文件实际需要的子集。
 *
 * 支持：XML 声明、注释、DOCTYPE、自闭合标签、嵌套元素、
 * 单/双引号属性、文本节点、常用实体（&amp; &lt; &#NN; 等）。
 * 不支持：CDATA、命名空间前缀解析、DTD 实体定义。
 *
 * 为什么自己写而不引第三方库：本项目的依赖越少，构建与提交越可控；
 * 而 SVG 子集的语法量级完全在可控范围内。
 */
export class XmlParser {
  private text = '';
  private pos = 0;

  parse(source: string): XmlElement {
    this.text = source;
    this.pos = 0;

    const root = this.readRoot();
    if (root === null) {
      throw new Error('no root element');
    }
    return root;
  }

  private readRoot(): XmlElement | null {
    for (;;) {
      this.skipWhitespace();
      if (this.pos >= this.text.length) {
        return null;
      }
      if (this.text.startsWith('<?', this.pos)) {
        this.skipUntil('?>');
        continue;
      }
      if (this.text.startsWith('<!--', this.pos)) {
        this.skipUntil('-->');
        continue;
      }
      if (this.text.startsWith('<!', this.pos)) {
        this.skipUntil('>');
        continue;
      }
      if (this.text[this.pos] === '<') {
        return this.readElement();
      }
      return null;
    }
  }

  private readElement(): XmlElement {
    this.expect('<');

    if (this.text[this.pos] === '/') {
      throw new Error('unexpected closing tag');
    }

    const name = this.readName();
    const attributes = this.readAttributes();
    this.skipWhitespace();

    if (this.text.startsWith('/>', this.pos)) {
      this.pos += 2;
      return new XmlElement(name, attributes);
    }

    this.expect('>');

    const element = new XmlElement(name, attributes);
    for (;;) {
      if (this.pos >= this.text.length) {
        throw new Error(`unclosed element: ${name}`);
      }

      if (this.text.startsWith('<!--', this.pos)) {
        this.skipUntil('-->');
        continue;
      }

      if (this.text.startsWith('</', this.pos)) {
        this.pos += 2;
        const closing = this.readName();
        this.skipWhitespace();
        this.expect('>');
        if (closing !== name) {
          throw new Error(`mismatched tag: expected </${name}> but found </${closing}>`);
        }
        return element;
      }

      if (this.text[this.pos] === '<') {
        element.children.push(this.readElement());
        continue;
      }

      const start = this.pos;
      while (this.pos < this.text.length && this.text[this.pos] !== '<') {
        this.pos += 1;
      }
      element.text += XmlParser.decodeEntities(this.text.slice(start, this.pos));
    }
  }

  private readName(): string {
    const start = this.pos;
    while (this.pos < this.text.length && XmlParser.isNameChar(this.text[this.pos])) {
      this.pos += 1;
    }
    if (this.pos === start) {
      throw new Error(`unexpected character at ${start}`);
    }
    return this.text.slice(start, this.pos);
  }

  private readAttributes(): Map<string, string> {
    const attributes = new Map<string, string>();

    for (;;) {
      this.skipWhitespace();
      if (this.pos >= this.text.length) {
        throw new Error('unexpected end of input in attributes');
      }

      const ch = this.text[this.pos];
      if (ch === '>' || ch === '/') {
        return attributes;
      }

      const name = this.readName();
      this.skipWhitespace();
      this.expect('=');
      this.skipWhitespace();

      const quote = this.text[this.pos];
      if (quote !== '"' && quote !== "'") {
        throw new Error(`attribute value must be quoted: ${name}`);
      }
      this.pos += 1;

      const start = this.pos;
      while (this.pos < this.text.length && this.text[this.pos] !== quote) {
        this.pos += 1;
      }
      if (this.pos >= this.text.length) {
        throw new Error(`unterminated attribute value: ${name}`);
      }

      const raw = this.text.slice(start, this.pos);
      this.pos += 1;
      attributes.set(name, XmlParser.decodeEntities(raw));
    }
  }

  private skipWhitespace(): void {
    while (this.pos < this.text.length && /\s/.test(this.text[this.pos])) {
      this.pos += 1;
    }
  }

  private expect(ch: string): void {
    if (this.text[this.pos] !== ch) {
      throw new Error(`expected '${ch}' at ${this.pos}`);
    }
    this.pos += 1;
  }

  private skipUntil(marker: string): void {
    const index = this.text.indexOf(marker, this.pos);
    this.pos = index < 0 ? this.text.length : index + marker.length;
  }

  private static isNameChar(ch: string): boolean {
    return /[A-Za-z0-9_:.-]/.test(ch);
  }

  private static decodeEntities(raw: string): string {
    return raw.replace(/&(#x?[0-9A-Fa-f]+|[A-Za-z]+);/g, (match, body: string) => {
      switch (body) {
        case 'lt':
          return '<';
        case 'gt':
          return '>';
        case 'amp':
          return '&';
        case 'quot':
          return '"';
        case 'apos':
          return "'";
        default:
          break;
      }
      if (body.startsWith('#x') || body.startsWith('#X')) {
        const code = Number.parseInt(body.slice(2), 16);
        return Number.isNaN(code) ? match : String.fromCodePoint(code);
      }
      if (body.startsWith('#')) {
        const code = Number.parseInt(body.slice(1), 10);
        return Number.isNaN(code) ? match : String.fromCodePoint(code);
      }
      return match;
    });
  }
}
