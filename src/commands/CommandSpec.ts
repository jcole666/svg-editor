import type { Session } from '../app/Session';
import type { Command } from '../app/Command';

/**
 * 一条命令的"规格"：名字、语法、说明、以及怎么造出它。
 *
 * 这里是任务书 §2.1 允许的**按名字分派处之一**（命令分发：命令名 → 实现）。
 * 另一处是图形工厂（类型名 → 类），在 P3 建立。
 */
export interface CommandSpec {
  readonly name: string;
  readonly usage: string;
  readonly description: string;
  readonly create: (args: string[], session: Session) => Command;
}
