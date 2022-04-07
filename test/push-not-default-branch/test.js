/**
 * This test checks the happy path of a commit to the main branch (main)
 * which includes a new *.tweet file.
 */

const tap = require("tap");

// SETUP
process.env.GITHUB_EVENT_NAME = "push";
process.env.GITHUB_REF = "refs/heads/patch";
process.env.GITHUB_EVENT_PATH = require.resolve("./event.json");
process.env.GITHUB_TOKEN = "secret123";

// set other env variables so action-toolkit is happy
process.env.GITHUB_WORKSPACE = "";
process.env.GITHUB_WORKFLOW = "";
process.env.GITHUB_ACTION = "twitter-together";
process.env.GITHUB_ACTOR = "";
process.env.GITHUB_REPOSITORY = "";
process.env.GITHUB_SHA = "";

process.on("exit", (code) => {
  tap.equal(code, 0);

  // for some reason, tap fails with "Suites:   1 failed" if we don't exit explicitly
  process.exit(0);
});

require("../../lib");
