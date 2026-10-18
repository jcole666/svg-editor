/** 重做栈为空（任务书未规定文案，给出可读提示）。 */
export class NothingToRedoError extends Error {
  constructor() {
    super('nothing to redo');
    this.name = 'NothingToRedoError';
  }
}
