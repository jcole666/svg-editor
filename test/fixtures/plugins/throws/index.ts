export default class ThrowsPlugin {
  activate(): void {
    throw new Error('boom');
  }
}
