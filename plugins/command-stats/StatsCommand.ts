import type { Command } from '../../src/app/Command';
import type { Session } from '../../src/app/Session';
import type { Shape } from '../../src/model/Shape';

/** stats —— 按当前子节点顺序深度优先数叶子。g 和 box 只算容器。 */
export class StatsCommand implements Command {
  constructor(
    private readonly args: string[],
    private readonly session: Session,
  ) {}

  execute(): string[] {
    if (this.args.length !== 0) {
      throw new Error('usage: stats');
    }

    const document = this.session.requireDocument();
    const counts = new Map<string, number>();
    let containers = 0;
    let total = 0;

    const visit = (shape: Shape): void => {
      if (shape.isContainer()) {
        containers += 1;
        for (const child of shape.childShapes()) {
          visit(child);
        }
        return;
      }
      total += 1;
      counts.set(shape.typeName(), (counts.get(shape.typeName()) ?? 0) + 1);
    };

    for (const child of document.children()) {
      visit(child);
    }

    const parts = [...counts.entries()].map(([typeName, count]) => `${typeName}: ${count}`);
    parts.push(`(total ${total}, containers ${containers})`);
    return [parts.join('  ')];
  }
}
