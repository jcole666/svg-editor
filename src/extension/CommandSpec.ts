import type { Session } from '../app/Session';
import type { Command } from '../app/Command';

/**
 * 一条命令的规格：名字、help 文案、怎么造出命令对象。
 * 从 commands 挪到这里，是为了注册表不再反向依赖具体命令。
 */
export interface CommandSpec {
  readonly name: string;
  readonly usage: string;
  readonly description: string;
  readonly create: (args: string[], session: Session) => Command;
}
