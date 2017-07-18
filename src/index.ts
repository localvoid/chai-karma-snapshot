import { IRunnable } from "mocha";

declare global {
  interface Window {
    __mocha_context__: {
      runnable: IRunnable,
      index: number,
    };
    __snapshot_state__: {
      update: boolean,
      dirty: boolean,
      visited: { [key: string]: boolean },
    };
    __snapshot__: { [key: string]: any };
  }

  namespace Chai {
    interface Assertion {
      matchSnapshot(update?: boolean): Assertion;
    }
  }
}

export function matchSnapshot(chai: any, utils: any): void {
  const context = window.__mocha_context__;
  const snapshotState = window.__snapshot_state__;
  const snapshot = window.__snapshot__;

  utils.addMethod(chai.Assertion.prototype, "matchSnapshot", function (this: any, update?: boolean) {
    const obj = chai.util.flag(this, "object");
    const ssfi = chai.util.flag(this, "ssfi")

    const snapshotName = context.runnable.title + " " + context.index++;
    snapshotState.visited[snapshotName] = true;

    if (!update && !snapshotState.update && snapshot.hasOwnProperty(snapshotName)) {
      const s = snapshot[snapshotName];
      if (obj !== s) {
        throw new chai.AssertionError(
          `Received value does not match stored snapshot ${snapshotName}.`,
          {
            actual: obj,
            expected: s,
            showDiff: true
          },
          ssfi,
        );
      }
    } else {
      snapshotState.dirty = true;
      snapshot[snapshotName] = obj;
    }
  });
}