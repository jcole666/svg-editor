import type { Shape } from '../model/Shape';
import type { AttributeHandler } from './AttributeHandler';
import { DuplicateRegistrationError } from './DuplicateRegistrationError';

/** 属性处理器表。命中几个由 SetCommand 决定，这里只负责按注册顺序收集。 */
export class AttributeRegistry {
  private readonly handlers: AttributeHandler[] = [];

  register(handler: AttributeHandler): void {
    if (this.handlers.some((item) => item.name === handler.name)) {
      throw new DuplicateRegistrationError('attributes', handler.name);
    }
    this.handlers.push(handler);
  }

  unregister(name: string): void {
    const index = this.handlers.findIndex((item) => item.name === name);
    if (index >= 0) {
      this.handlers.splice(index, 1);
    }
  }

  matching(shape: Shape, attribute: string): AttributeHandler[] {
    return this.handlers.filter((handler) => handler.handles(shape, attribute));
  }

  names(): string[] {
    return this.handlers.map((handler) => handler.name);
  }
}
