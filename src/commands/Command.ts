/**
 * 一条命令对"撤销历史"的影响类别。
 * - edit    : 图形编辑类，可 undo/redo，执行后进入命令栈
 * - display : 显示类，不进入命令栈，也不改变状态
 * - io      : 文档类，执行后 undo/redo 被禁止（§4.3）
 */
export type CommandKind = 'edit' | 'display' | 'io';

/**
 * 一条命令。
 *
 * 执行后返回要打印给用户的行——命令本身不直接写控制台，
 * 这样命令可以被单元测试直接断言输出。
 *
 * kind 省略时按 display 处理。
 */
export interface Command {
  readonly kind?: CommandKind;
  execute(): string[];
}
