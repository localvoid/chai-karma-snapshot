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

function addSerializer(plugin) {
  serializationPlugins = [plugin].concat(serializationPlugins);
}

function serialize(data) {
  return prettyFormat(data, {
    escapeRegex: true,
    plugins: serializationPlugins,
    printFunctionName: false,
  });
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

  utils.addMethod(chai.Assertion.prototype, "matchSnapshot", function (lang, update) {
    if (lang === void 0) {
      lang = undefined;
    }

    var obj = serialize(chai.util.flag(this, "object"));
    var path = snapshotPath(context.runnable);
    var index = context.index++;

    if (update || snapshotState.update) {
      snapshotState.set(path, index, obj, lang);
    } else {
      var snapshot = snapshotState.get(path, index);
      if (!snapshot) {
      } else {
        snapshotState.set(path, index, obj, lang);
        if (obj !== snapshot.code) {
          throw new chai.AssertionError("Received value does not match stored snapshot " + index, {
            actual: obj,
            expected: snapshot.code,
            showDiff: true
          }, chai.util.flag(this, "ssfi"));
        }
      }
    }
  });
}

exports.addSerializer = addSerializer;
exports.matchSnapshot = matchSnapshot;
