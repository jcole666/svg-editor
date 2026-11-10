import type { Shape } from '../model/Shape';

/** apply 成功后要给用户看的两句。undo 用 undoSummary，不再自己猜改了什么。 */
export interface AttributeEffect {
  readonly summary: string;
  readonly undoSummary: string;
}

/**
 * 某个图形上某个属性的领域语义。
 * handles 不准改文档。两个处理器同时认领时由 SetCommand 拒绝，不让后注册的悄悄盖掉前一个。
 */
export interface AttributeHandler {
  readonly name: string;
  handles(shape: Shape, attribute: string): boolean;
  apply(shape: Shape, attribute: string, value: string): AttributeEffect;
}
