"use strict";
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define("chai-karma-snapshot", ['pretty-format', "exports"], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory(require('pretty-format'), exports);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(root.prettyFormat);
    }
}(this, function (prettyFormat, exports) {

  Object.defineProperty(exports, "__esModule", { value: true });

  /**
   * Serialization code were copied from Jest.
   *
   * https://github.com/facebook/jest/blob/6979b8e27e88735bfed997d84393f291c8a0a21d/packages/jest-snapshot/src/plugins.js#L23-L30
   */
  var serializationPlugins = [
    prettyFormat.plugins.DOMCollection,
    prettyFormat.plugins.DOMElement,
    prettyFormat.plugins.Immutable,
    prettyFormat.plugins.ReactElement,
    prettyFormat.plugins.ReactTestComponent,
  ];

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
      var index = context.index++;
      var path;

      // For a hook, use the currentTest for path
      if (context.runnable.type === "hook") {
        path = snapshotPath(context.runnable.ctx.currentTest);
      } else {
        path = snapshotPath(context.runnable);
      }

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

}));
