import type { Document } from '../model/Document';
import { NoDocumentError } from '../model/NoDocumentError';
import { CommandStack } from './CommandStack';

/**
 * 一次 REPL 会话的状态：当前文档 + 命令栈。
 *
 * 命令对象只认识"当前文档"；撤销历史由 CommandStack 持有，
 * Repl 通过 CommandExecutor 把两者接起来。
 */
export class Session {
  private currentDocument: Document | null = null;
  readonly commandStack = new CommandStack();

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
