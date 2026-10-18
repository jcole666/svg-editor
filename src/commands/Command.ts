/**
 * 一条命令。
 *
 * 执行后返回要打印给用户的行——命令本身不直接写控制台，
 * 这样命令可以被单元测试直接断言输出。
 *
 * 注意：本阶段只要求"能执行"。编辑类命令的 undo() 接口在 P5 引入，
 * 届时用 `UndoableCommand extends Command` 承载，避免给显示类 / 文档类命令
 * 装上无意义的 undo。
 */
export interface Command {
  execute(): string[];
}
