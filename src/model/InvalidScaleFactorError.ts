/**
 * scale 的因子必须为正数。
 * 对应任务书 §4.2：error: scale factor must be positive
 */
export class InvalidScaleFactorError extends Error {
  constructor() {
    super('scale factor must be positive');
    this.name = 'InvalidScaleFactorError';
  }
}
