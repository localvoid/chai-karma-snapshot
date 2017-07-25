import { IRunnable } from "mocha";
import * as prettyFormat from "pretty-format";

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

// Extra line breaks at the beginning and at the end of the snapshot are useful
// to make the content of the snapshot easier to read
function addExtraLineBreaks(string: string) {
  return string.includes("\n") ? `\n${string}\n` : string;
}

function serialize(data: any): string {
  return addExtraLineBreaks(
    normalizeNewlines(
      prettyFormat(data, {
        escapeRegex: true,
        plugins: serializationPlugins,
        printFunctionName: false,
      }),
    ),
  );
}

export function matchSnapshot(chai: any, utils: any): void {
  const context = window.__mocha_context__;
  const snapshotState = window.__snapshot_state__;
  const snapshot = window.__snapshot__;

  utils.addMethod(chai.Assertion.prototype, "matchSnapshot", function (this: any, update?: boolean) {
    const obj = serialize(chai.util.flag(this, "object"));
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