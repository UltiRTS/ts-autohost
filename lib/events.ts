/** @format */

export class EventEmitter<T extends { [key: string]: any }> {
  private handlers: {
    [K in keyof T]?: ((data: T[K]) => void)[];
  } = {};

  on<E extends keyof T>(event: E, callback: (data: T[E]) => void) {
    if (!this.handlers[event]) {
      this.handlers[event] = [callback];
    } else {
      this.handlers[event]?.push(callback);
    }
  }

  emit<E extends keyof T>(event: E, data: T[E]) {
    this.handlers[event]?.forEach((callback) => {
      callback(data);
    });
  }
}
