/// <reference types="mocha" />

declare global {
  namespace Chai {
    interface Assertion {
      matchSnapshot(lang?: any, update?: boolean): Assertion;
    }
    interface AssertStatic {
      matchSnapshot(lang?: any, update?: boolean): Assertion;
    }
  }
}

export declare function addSerializer(plugin: any): void;
export declare function matchSnapshot(chai: any, utils: any): void;
