/** 撤销栈为空（任务书未规定文案，给出可读提示）。 */
export class NothingToUndoError extends Error {
  constructor() {
    super('nothing to undo');
    this.name = 'NothingToUndoError';
  }
}
