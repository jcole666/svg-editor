import type { Session } from '../app/Session';
import { Group } from '../model/Group';
import { NoSuchContainerError } from '../model/NoSuchContainerError';
import { NotAContainerError } from '../model/NotAContainerError';
import type { Command } from './Command';
import type { ShapeFactory } from './ShapeFactory';
import { UsageError } from './UsageError';

/**
 * create <type> <id> [params…] [in <containerId>]
 *
 * 只做三件事：解析出 type / id / params / 可选容器、校验容器、交给工厂造出来。
 * "图形长什么样"和"参数怎么解析"都在 ShapeFactory 里，命令本身不含业务逻辑。
 */
export class CreateCommand implements Command {
  readonly kind = 'edit' as const;

  constructor(
    private readonly args: string[],
    private readonly session: Session,
    private readonly factory: ShapeFactory,
  ) {}

  execute(): string[] {
    const document = this.session.requireDocument();

    if (this.args.length < 2) {
      throw new UsageError('create <type> <id> [params...] [in <containerId>]');
    }

    const typeName = this.args[0];
    const id = this.args[1];
    const tail = this.args.slice(2);

    // `in <containerId>` 是尾缀：倒数第二个 token 是 "in" 时才成立。
    // 用位置而不是"包含 in"来判断，否则 create text t1 0 0 "in" 会被误判。
    const hasContainerClause = tail.length >= 2 && tail[tail.length - 2] === 'in';
    const containerId = hasContainerClause ? tail[tail.length - 1] : undefined;
    const params = hasContainerClause ? tail.slice(0, tail.length - 2) : tail;

    const container = containerId === undefined ? undefined : this.resolveContainer(containerId);
    const shape = this.factory.create(typeName, id, params);

    document.add(shape, container ?? undefined);

    return [
      container === undefined
        ? `${shape.label()} created`
        : `${shape.label()} created in ${container.label()}`,
    ];
  }

  private resolveContainer(containerId: string): Group {
    const document = this.session.requireDocument();
    const target = document.find(containerId);
    if (target === undefined) {
      throw new NoSuchContainerError(containerId);
    }
    if (!(target instanceof Group)) {
      throw new NotAContainerError(containerId);
    }
    return target;
  }
}
