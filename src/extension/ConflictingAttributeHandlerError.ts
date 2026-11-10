/** 一次 set 命中了两个处理器。按 ADR 的约定直接拒绝，不执行任何一个。 */
export class ConflictingAttributeHandlerError extends Error {
  constructor(attribute: string) {
    super(`conflicting attribute handlers: ${attribute}`);
    this.name = 'ConflictingAttributeHandlerError';
  }
}
