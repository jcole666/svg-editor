/**
 * 还没有 init / read 就执行需要文档的命令。
 * 对应任务书 §4.2：error: no document. use 'init' or 'read' first
 */
export class NoDocumentError extends Error {
  constructor() {
    super("no document. use 'init' or 'read' first");
    this.name = 'NoDocumentError';
  }
}
