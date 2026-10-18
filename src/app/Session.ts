import type { Document } from '../model/Document';
import { NoDocumentError } from '../model/NoDocumentError';
import { SnapshotHistory } from './SnapshotHistory';

/**
 * 一次 REPL 会话的状态：当前文档 + 撤销历史。
 *
 * 命令对象只认识"当前文档"；undo/redo 的历史由这里统一持有，
 * Repl 负责把命令按 kind 分派给历史或直接执行。
 */
export class Session {
  private currentDocument: Document | null = null;
  readonly history = new SnapshotHistory();

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
