/**
 * 文档类命令执行后，undo/redo 被禁止。
 * 对应任务书 §4.3：error: undo not allowed after io command
 */
export class UndoNotAllowedError extends Error {
  constructor() {
    super('undo not allowed after io command');
    this.name = 'UndoNotAllowedError';
  }
}
