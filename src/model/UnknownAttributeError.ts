/**
 * 属性不在 set 命令的白名单里时抛出。
 * 对应任务书 §4.2：error: unknown attribute: <attr>
 */
export class UnknownAttributeError extends Error {
  constructor(attributeName: string) {
    super(`unknown attribute: ${attributeName}`);
    this.name = 'UnknownAttributeError';
  }
}
