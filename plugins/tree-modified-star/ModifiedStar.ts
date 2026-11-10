import type { Document } from '../../src/model/Document';
import type { Shape } from '../../src/model/Shape';
import type { TreeDecorator, TreeTarget } from '../../src/extension/TreeDecorator';
import type { Session } from '../../src/app/Session';

/**
 * 和上次保存（或 init / read 刚完成时）内容不一致的行尾加 *。
 * 比较放在这个对象的字段里，不用模块级变量。
 * 子节点变了，祖先那一行也标，因为只看子树才能在树上看出没保存。
 */
export class ModifiedStar implements TreeDecorator {
  readonly name = 'modified-star';
  private readonly baseline = new Map<string, string>();
  private canvas = '';
  private ready = false;

  constructor(session: Session) {
    this.capture(session.document);
    session.onBaseline((document) => this.capture(document));
  }

  labelFor(target: TreeTarget): string {
    if (!this.ready) {
      return '';
    }
    if (target.shape === null) {
      const canvas = `${target.document.width}x${target.document.height}`;
      if (canvas !== this.canvas || this.anyDirty(target.document.children())) {
        return '*';
      }
      return '';
    }
    return this.isDirty(target.shape) ? '*' : '';
  }

  private capture(document: Document | null): void {
    this.baseline.clear();
    if (document === null) {
      this.ready = false;
      this.canvas = '';
      return;
    }
    this.canvas = `${document.width}x${document.height}`;
    this.walk(document.children());
    this.ready = true;
  }

  private walk(shapes: readonly Shape[]): void {
    for (const shape of shapes) {
      this.baseline.set(shape.id, shape.stateKey());
      this.walk(shape.childShapes());
    }
  }

  private anyDirty(shapes: readonly Shape[]): boolean {
    return shapes.some((shape) => this.isDirty(shape));
  }

  private isDirty(shape: Shape): boolean {
    if (this.baseline.get(shape.id) !== shape.stateKey()) {
      return true;
    }
    return this.anyDirty(shape.childShapes());
  }
}
