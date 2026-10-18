/**
 * create 的类型名不在工厂注册表里。
 * 对应任务书 §4.2：error: unknown shape type: hexagon (is the plugin loaded?)
 */
export class UnknownShapeTypeError extends Error {
  constructor(typeName: string) {
    super(`unknown shape type: ${typeName} (is the plugin loaded?)`);
    this.name = 'UnknownShapeTypeError';
  }
}
