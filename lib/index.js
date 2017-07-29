"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prettyFormat = require("pretty-format");

/**
 * Serialization code were copied from Jest.
 */
var serializationPlugins = [
  prettyFormat.plugins.HTMLElement,
  prettyFormat.plugins.ReactElement,
  prettyFormat.plugins.ReactTestComponent,
].concat(prettyFormat.plugins.Immutable);

function normalizeNewlines(string) {
  return string.replace(/\r\n|\r/g, "\n");
}

function addSerializer(plugin) {
  serializationPlugins = [plugin].concat(serializationPlugins);
}

function serialize(data) {
  return normalizeNewlines(prettyFormat(data, {
    escapeRegex: true,
    plugins: serializationPlugins,
    printFunctionName: false,
  }));
}

function snapshotPath(node) {
  var path = [];
  while (node && node.parent) {
    path.push(node.title);
    node = node.parent;
  }
  return path.reverse();
}

function matchSnapshot(chai, utils) {
  var context = window.__mocha_context__;
  var snapshotState = window.__snapshot__;
  var newSnapshotState = window.__snapshot__ = {
    update: snapshotState.update,
    suite: {
      dirty: false,
      children: {},
      snapshots: {}
    }
  };

  function getSnapshot(path, index) {
    var suite = snapshotState.suite;
    for (var i = 0; i < path.length - 1; i++) {
      var key = path[i];
      var s = suite.children[key];
      if (s === undefined) {
        return undefined;
      } else {
        suite = s;
      }
    }
    var testName = path[path.length - 1];
    var snapshotList = suite.snapshots[testName];
    if (snapshotList !== undefined) {
      return snapshotList[index];
    }
    return undefined;
  }

  function addSnapshot(path, index, lang, code, dirty) {
    var suite = newSnapshotState.suite;
    if (dirty) {
      suite.dirty = true;
    }
    for (var i = 0; i < path.length - 1; i++) {
      var key = path[i];
      var s = suite.children[key];
      if (s === undefined) {
        suite.children[key] = suite = {
          dirty: dirty,
          children: {},
          snapshots: {},
        };
      } else {
        suite = s;
        if (dirty) {
          suite.dirty = true;
        }
      }
    }
    var testName = path[path.length - 1];
    var snapshotList = suite.snapshots[testName];
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

  utils.addMethod(chai.Assertion.prototype, "matchSnapshot", function (lang, update) {
    if (lang === void 0) {
      lang = null;
    }

    var obj = serialize(chai.util.flag(this, "object"));
    var path = snapshotPath(context.runnable);
    var snapshot = getSnapshot(path, context.index);

    if (!update && !snapshotState.update && snapshot) {
      addSnapshot(path, context.index, lang, snapshot.code, false);
      if (obj !== snapshot.code) {
        throw new chai.AssertionError("Received value does not match stored snapshot.", {
          actual: obj,
          expected: snapshot.code,
          showDiff: true
        }, chai.util.flag(this, "ssfi"));
      }
    } else {
      addSnapshot(path, context.index, lang, obj, true);
    }
  });
}

exports.addSerializer = addSerializer;
exports.matchSnapshot = matchSnapshot;
