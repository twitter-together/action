/**
 * This test checks the ability to invoke a tweet using the `--file` command line flag
 * but provides no actual filename so generates an error.
 */

const nock = require("nock");
const tap = require("tap");

// MOCK
process.chdir(__dirname);
process.argv = ["node", "lib/index.js", "--file"];

process.on("exit", (code) => {
  tap.equal(code, 1);
  tap.same(nock.pendingMocks(), []);

  // above code exits with 1 (error), but tap expects 0.
  // Tap adds the "process.exitCode" property for that purpose.
  process.exitCode = 0;
});

require("../../lib");
