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

  utils.addMethod(chai.Assertion.prototype, "matchSnapshot", aMethodForExpect);
  chai.assert.matchSnapshot = aMethodForAssert;

  function aMethodForAssert(lang, update, msg) {
    // This basically wraps the 'expect' version of the assertion to allow using 'assert' syntax.
    return new chai.Assertion(lang, update, msg).to.matchSnapshot();
  }

  function aMethodForExpect(lang, update) {
    var obj = serialize(chai.util.flag(this, "object"));
    var path = snapshotPath(context.runnable);
    var index = context.index++;

    if (update || snapshotState.update) {
      snapshotState.set(path, index, obj, lang);
    } else {
      var snapshot = snapshotState.get(path, index);
      if (!snapshot) {
        snapshotState.set(path, index, obj, lang);
      } else {
        if (!snapshotState.match(obj, snapshot.code)) {
          throw new chai.AssertionError("Received value does not match stored snapshot " + index, {
            actual: obj,
            expected: snapshot.code,
            showDiff: true
          }, chai.util.flag(this, "ssfi"));
        }
      }
    }
  }
}

exports.addSerializer = addSerializer;
exports.matchSnapshot = matchSnapshot;
