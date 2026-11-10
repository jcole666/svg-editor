import { DuplicateRegistrationError } from './DuplicateRegistrationError';
import type { TreeDecorator } from './TreeDecorator';

/** 树标签表。all() 的顺序就是行尾拼接的顺序。 */
export class DecoratorRegistry {
  private readonly decorators: TreeDecorator[] = [];

  register(decorator: TreeDecorator): void {
    if (this.decorators.some((item) => item.name === decorator.name)) {
      throw new DuplicateRegistrationError('decorators', decorator.name);
    }
    this.decorators.push(decorator);
  }

  unregister(name: string): void {
    const index = this.decorators.findIndex((item) => item.name === name);
    if (index >= 0) {
      this.decorators.splice(index, 1);
    }
  }

  all(): readonly TreeDecorator[] {
    return this.decorators;
  }

  names(): string[] {
    return this.decorators.map((decorator) => decorator.name);
  }
}
