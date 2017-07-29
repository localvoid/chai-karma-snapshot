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
    dirty: snapshotState.dirty,
    suite: {
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
      }
      else {
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
    for (var i = 0; i < path.length - 1; i++) {
      var key = path[i];
      var s = suite.children[key];
      if (s === undefined) {
        suite.children[key] = suite = {
          children: {},
          snapshots: {},
        };
      }
      else {
        suite = s;
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
    var obj = serialize(chai.util.flag(this, "object"));
    var ssfi = chai.util.flag(this, "ssfi");
    var path = snapshotPath(context.runnable);
    var snapshot = getSnapshot(path, context.index);
    var dirty = false;
    if (!update && !snapshotState.update && snapshot) {
      if (obj !== snapshot.code) {
        throw new chai.AssertionError("Received value does not match stored snapshot.", {
          actual: obj,
          expected: snapshot.code,
          showDiff: true
        }, ssfi);
      }
    }
    else {
      dirty = true;
      newSnapshotState.dirty = true;
    }
    addSnapshot(path, context.index, lang === undefined ? null : lang, obj, dirty);
  });
}

exports.addSerializer = addSerializer;
exports.matchSnapshot = matchSnapshot;
