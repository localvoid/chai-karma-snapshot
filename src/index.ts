import { IRunnable } from "mocha";
import * as prettyFormat from "pretty-format";

declare global {
  interface Suite {
    children: { [key: string]: Suite };
    snapshots: { [key: string]: Snapshot[] };
  }

  interface Snapshot {
    dirty: boolean;
    visited: boolean;
    lang: string | null;
    code: string;
  }

  interface Window {
    __mocha_context__: {
      runnable: IRunnable,
      index: number,
    };
    __snapshot__: {
      update: boolean;
      dirty: boolean;
      suite: Suite;
    };
  }

  namespace Chai {
    interface Assertion {
      matchSnapshot(lang?: string, update?: boolean): Assertion;
    }
  }
}

/**
 * Serialization code were copied from Jest.
 */
let serializationPlugins = [
  prettyFormat.plugins.HTMLElement,
  prettyFormat.plugins.ReactElement,
  prettyFormat.plugins.ReactTestComponent,
].concat(prettyFormat.plugins.Immutable);

function normalizeNewlines(string: string) {
  return string.replace(/\r\n|\r/g, "\n");
}

export function addSerializer(plugin: any) {
  serializationPlugins = [plugin].concat(serializationPlugins);
}

function serialize(data: any): string {
  return normalizeNewlines(
    prettyFormat(data, {
      escapeRegex: true,
      plugins: serializationPlugins,
      printFunctionName: false,
    }),
  );
}

function snapshotPath(node: any): string[] {
  let path = [];
  while (node && node.parent) {
    path.push(node.title);
    node = node.parent;
  }
  return path.reverse();
}

export function matchSnapshot(chai: any, utils: any): void {
  const context = window.__mocha_context__;
  const snapshotState = window.__snapshot__;
  const newSnapshotState = window.__snapshot__ = {
    update: snapshotState.update,
    dirty: snapshotState.dirty,
    suite: {
      children: {},
      snapshots: {}
    } as Suite
  };

  function getSnapshot(path: string[], index: number): Snapshot | undefined {
    let suite = snapshotState.suite;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      const s = suite.children[key];
      if (s === undefined) {
        return undefined;
      } else {
        suite = s;
      }
    }

    const testName = path[path.length - 1];
    let snapshotList = suite.snapshots[testName];
    if (snapshotList !== undefined) {
      return snapshotList[index];
    }
    return undefined;
  }

  function addSnapshot(path: string[], index: number, lang: string | null, code: string, dirty: boolean): void {
    let suite = newSnapshotState.suite;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      const s = suite.children[key];
      if (s === undefined) {
        suite.children[key] = suite = {
          children: {},
          snapshots: {},
        };
      } else {
        suite = s;
      }
    }

    const testName = path[path.length - 1];
    let snapshotList = suite.snapshots[testName];
    if (snapshotList === undefined) {
      suite.snapshots[testName] = snapshotList = [];
    }
    snapshotList[index] = {
      visited: true,
      dirty: dirty,
      lang: lang,
      code: code
    };
  }

  utils.addMethod(chai.Assertion.prototype, "matchSnapshot", function (this: any, lang?: string, update?: boolean) {
    const obj = serialize(chai.util.flag(this, "object"));
    const ssfi = chai.util.flag(this, "ssfi")

    const path = snapshotPath(context.runnable);
    const snapshot = getSnapshot(path, context.index);
    let dirty = false;

    if (!update && !snapshotState.update && snapshot) {
      if (obj !== snapshot.code) {
        throw new chai.AssertionError(
          `Received value does not match stored snapshot.`,
          {
            actual: obj,
            expected: snapshot.code,
            showDiff: true
          },
          ssfi,
        );
      }
    } else {
      dirty = true;
      newSnapshotState.dirty = true;
    }
    addSnapshot(path, context.index, lang === undefined ? null : lang, obj as string, dirty);
  });
}