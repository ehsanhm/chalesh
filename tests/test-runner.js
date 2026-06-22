/**
 * Minimal test runner — runs in browser, reports pass/fail.
 * Usage: runTests([{ name: "...", fn: function() { assert(...); } }])
 */
(function () {
  "use strict";
  window.runTests = function (suites) {
    let passed = 0;
    let failed = 0;
    const logs = [];

    function log(msg, isError) {
      logs.push({ msg, isError: !!isError });
      try { console.log(msg); } catch {}
    }

    function assert(cond, msg) {
      if (!cond) throw new Error(msg || "Assertion failed");
    }

    function assertEqual(actual, expected, msg) {
      const ok = actual === expected;
      if (!ok) throw new Error((msg || "Expected equal") + ": " + JSON.stringify(actual) + " !== " + JSON.stringify(expected));
    }

    function assertDeepEqual(actual, expected, msg) {
      const ok = JSON.stringify(actual) === JSON.stringify(expected);
      if (!ok) throw new Error((msg || "Expected deep equal") + ": " + JSON.stringify(actual) + " !== " + JSON.stringify(expected));
    }

    for (const suite of suites) {
      const tests = Array.isArray(suite.tests) ? suite.tests : (suite.fn ? [{ name: suite.name || "test", fn: suite.fn }] : []);
      const name = suite.name || "suite";
      for (const t of tests) {
        try {
          t.fn({ assert, assertEqual, assertDeepEqual });
          passed++;
          log("  ✓ " + (t.name || "test"));
        } catch (e) {
          failed++;
          log("  ✗ " + (t.name || "test") + ": " + (e && e.message), true);
        }
      }
    }

    const total = passed + failed;
    const summary = total + " tests: " + passed + " passed, " + failed + " failed";
    log("\n" + summary, failed > 0);
    return { passed, failed, total, logs };
  };
})();
