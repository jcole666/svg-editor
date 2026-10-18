import type { Document } from '../model/Document';
import { NoDocumentError } from '../model/NoDocumentError';

/**
 * 一次 REPL 会话的状态：当前打开的是哪份文档。
 *
 * P5 之后 undo/redo 的命令栈也挂在这里，Repl 只负责把命令交给它。
 */
export class Session {
  private currentDocument: Document | null = null;

  get document(): Document | null {
    return this.currentDocument;
  }

  setDocument(document: Document | null): void {
    this.currentDocument = document;
  }

  /** 取当前文档；没有就抛 NoDocumentError（对应 §4.2 的文案）。 */
  requireDocument(): Document {
    if (this.currentDocument === null) {
      throw new NoDocumentError();
    }
    return this.currentDocument;
  }
}
