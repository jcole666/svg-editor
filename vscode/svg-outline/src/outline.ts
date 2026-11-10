export interface OutlineNode {
  name: string;
  startLine: number;
  startCharacter: number;
  endLine: number;
  endCharacter: number;
  children: OutlineNode[];
}

/** 给大纲用的小解析器。XML 不完整时返回空，不把异常抛给 VSCode。 */
export function parseOutline(source: string): OutlineNode[] {
  try {
    return new OutlineParser(source).parse();
  } catch {
    return [];
  }
}

class OutlineParser {
  private index = 0;
  private line = 0;
  private character = 0;

  constructor(private readonly source: string) {}

  parse(): OutlineNode[] {
    const nodes: OutlineNode[] = [];
    while (this.skipToTag()) {
      if (this.peek(1) === '/') {
        throw new Error('unexpected close tag');
      }
      nodes.push(this.parseElement());
    }
    return nodes;
  }

  private parseElement(): OutlineNode {
    const startLine = this.line;
    const startCharacter = this.character;
    this.expect('<');
    const tag = this.readName();
    const attributes = this.readAttributes();
    const selfClosing = this.consumeSlash();
    this.expect('>');

    const children: OutlineNode[] = [];
    if (!selfClosing) {
      while (this.skipToTag()) {
        if (this.peek(1) === '/') {
          break;
        }
        children.push(this.parseElement());
      }
      this.expect('<');
      this.expect('/');
      const close = this.readName();
      if (close !== tag) {
        throw new Error('mismatched tag');
      }
      this.skipSpace();
      this.expect('>');
    }

    const id = attributes.get('id');
    return {
      name: id !== undefined && id.length > 0 ? `${tag}#${id}` : tag,
      startLine,
      startCharacter,
      endLine: this.line,
      endCharacter: this.character,
      children,
    };
  }

  /** 停在下一个 `<`。没有了就返回 false。注释和声明直接跳过。 */
  private skipToTag(): boolean {
    while (this.index < this.source.length) {
      if (this.peek(0) !== '<') {
        this.advance();
        continue;
      }
      if (this.source.startsWith('<!--', this.index)) {
        this.skipUntil('-->');
        continue;
      }
      if (this.source.startsWith('<?', this.index) || this.source.startsWith('<!', this.index)) {
        this.skipUntil('>');
        continue;
      }
      return true;
    }
    return false;
  }

  private readAttributes(): Map<string, string> {
    const attributes = new Map<string, string>();
    for (;;) {
      this.skipSpace();
      const ch = this.peek(0);
      if (ch === '>' || ch === '/' || ch === '') {
        return attributes;
      }
      const name = this.readName();
      this.skipSpace();
      if (this.peek(0) !== '=') {
        attributes.set(name, '');
        continue;
      }
      this.advance();
      this.skipSpace();
      attributes.set(name, this.readValue());
    }
  }

  private readValue(): string {
    const quote = this.peek(0);
    if (quote !== '"' && quote !== "'") {
      throw new Error('bad attribute');
    }
    this.advance();
    let value = '';
    while (this.index < this.source.length && this.peek(0) !== quote) {
      value += this.advance();
    }
    if (this.peek(0) !== quote) {
      throw new Error('unclosed attribute');
    }
    this.advance();
    return value;
  }

  private readName(): string {
    let name = '';
    while (this.index < this.source.length && /[A-Za-z0-9:_-]/.test(this.peek(0))) {
      name += this.advance();
    }
    if (name.length === 0) {
      throw new Error('missing name');
    }
    return name;
  }

  private consumeSlash(): boolean {
    this.skipSpace();
    if (this.peek(0) !== '/') {
      return false;
    }
    this.advance();
    return true;
  }

  private skipSpace(): void {
    while (this.index < this.source.length && /\s/.test(this.peek(0))) {
      this.advance();
    }
  }

  private skipUntil(token: string): void {
    const at = this.source.indexOf(token, this.index);
    if (at < 0) {
      throw new Error('unclosed');
    }
    while (this.index < at + token.length) {
      this.advance();
    }
  }

  private expect(ch: string): void {
    if (this.peek(0) !== ch) {
      throw new Error(`expected ${ch}`);
    }
    this.advance();
  }

  private peek(offset: number): string {
    return this.source[this.index + offset] ?? '';
  }

  private advance(): string {
    const ch = this.source[this.index] ?? '';
    this.index += 1;
    if (ch === '\n') {
      this.line += 1;
      this.character = 0;
    } else {
      this.character += 1;
    }
    return ch;
  }
}
