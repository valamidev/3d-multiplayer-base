export function Singleton<T extends { new (...args: any[]): {} }>(
  constructor: T
): T {
  let instance: any;

  return class extends constructor {
    constructor(...args: any[]) {
      if (instance) {
        return instance;
      }

      super(...args);
      instance = this;
    }
  };
}
