// Polyfill FinalizationRegistry for Hermes / environments that lack it.
// This file MUST be imported before any library that references
// FinalizationRegistry (e.g. Apollo Client).

if (typeof globalThis.FinalizationRegistry === 'undefined') {
  (globalThis as any).FinalizationRegistry = class FinalizationRegistry<T> {
    private _callback: (value: T) => void;
    constructor(callback: (value: T) => void) {
      this._callback = callback;
    }
    register(_target: object, _value: T, _unregisterToken?: object): void {}
    unregister(_unregisterToken: object): boolean {
      return false;
    }
    readonly [Symbol.toStringTag] = 'FinalizationRegistry';
  };
}
