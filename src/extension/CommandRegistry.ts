import type { CommandSpec } from './CommandSpec';
import { DuplicateRegistrationError } from './DuplicateRegistrationError';

/**
 * 命令注册表。内核只按名字取出规格再调用，不 import 具体命令类。
 * 19 条内置命令也是启动时登记进来的，不是写死在这个类里。
 */
export class CommandRegistry {
  private readonly specs = new Map<string, CommandSpec>();

  register(spec: CommandSpec): void {
    if (this.specs.has(spec.name)) {
      throw new DuplicateRegistrationError('commands', spec.name);
    }
    this.specs.set(spec.name, spec);
  }

  unregister(name: string): void {
    this.specs.delete(name);
  }

  get(name: string): CommandSpec | undefined {
    return this.specs.get(name);
  }

  all(): CommandSpec[] {
    return [...this.specs.values()];
  }
}
