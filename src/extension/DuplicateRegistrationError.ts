/** 同一类扩展点里名字撞了。加载器捕获后打印，并撤回这个插件已经登记的东西。 */
export class DuplicateRegistrationError extends Error {
  constructor(category: string, name: string) {
    super(`duplicate registration: ${category}/${name}`);
    this.name = 'DuplicateRegistrationError';
  }
}
