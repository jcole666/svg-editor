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
  private readonly baselineListeners: Array<(document: Document | null) => void> = [];
  readonly commandStack = new CommandStack();

  get document(): Document | null {
    return this.currentDocument;
  }

  setDocument(document: Document | null): void {
    this.currentDocument = document;
    this.emitBaseline();
  }

  /**
   * save 成功后调用。文档对象没换，但"上次保存的内容"要更新，
   * 树标签才知道星号该不该消掉。
   */
  markClean(): void {
    this.emitBaseline();
  }

  /** 插件在 activate 里订阅。状态放在插件自己的字段里，这里只负责通知。 */
  onBaseline(listener: (document: Document | null) => void): void {
    this.baselineListeners.push(listener);
  }

  private emitBaseline(): void {
    for (const listener of this.baselineListeners) {
      listener(this.currentDocument);
    }
  }

  /** 取当前文档；没有就抛 NoDocumentError（对应 §4.2 的文案）。 */
  requireDocument(): Document {
    if (this.currentDocument === null) {
      throw new NoDocumentError();
    }
    return this.currentDocument;
  }
}
