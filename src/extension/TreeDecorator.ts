import type { Document } from '../model/Document';
import type { Shape } from '../model/Shape';

/** shape 为 null 时是最上面那行 `svg (800x600)`。 */
export interface TreeTarget {
  readonly document: Document;
  readonly shape: Shape | null;
}

/**
 * 结构树每一行行尾的标签。返回空串表示这一行不加。
 * 渲染器按注册顺序拼接，插件之间不互相引用。
 */
export interface TreeDecorator {
  readonly name: string;
  labelFor(target: TreeTarget): string;
}
