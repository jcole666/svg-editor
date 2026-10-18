import * as fs from 'node:fs';

import type { Document } from '../model/Document';
import { CannotWriteFileError } from './CannotWriteFileError';

/**
 * 把 Document 写成 SVG 文件（序列化）。
 *
 * 输出 = XML 声明 + Document 渲染的 <svg> 元素 + 结尾换行。
 * 每个图形自己负责 `toSvg()`（Composite 语义），这里只拼外壳与落盘。
 */
export class SvgWriter {
  toText(document: Document): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n${document.toSvg()}\n`;
  }

  writeFile(document: Document, path: string): void {
    try {
      fs.writeFileSync(path, this.toText(document), 'utf8');
    } catch {
      throw new CannotWriteFileError(path);
    }
  }
}
