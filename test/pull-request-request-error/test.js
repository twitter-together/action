/**
 * This test checks a 500 server response when crying to retrieve pull request files
 */

const nock = require("nock");
const tap = require("tap");

// SETUP
process.env.GITHUB_EVENT_NAME = "pull_request";
process.env.GITHUB_TOKEN = "secret123";
process.env.GITHUB_EVENT_PATH = require.resolve("./event.json");

// set other env variables so action-toolkit is happy
process.env.GITHUB_REF = "";
process.env.GITHUB_WORKSPACE = "";
process.env.GITHUB_WORKFLOW = "";
process.env.GITHUB_ACTION = "twitter-together";
process.env.GITHUB_ACTOR = "";
process.env.GITHUB_REPOSITORY = "";
process.env.GITHUB_SHA = "";

// MOCK
nock("https://api.github.com", {
  reqheaders: {
    authorization: "token secret123",
  },
})
  // get changed files
  .get("/repos/twitter-together/action/pulls/123/files")
  .reply(500);

process.on("exit", (code) => {
  tap.equal(code, 1);
  tap.same(nock.pendingMocks(), []);

  // above code exits with 1 (error), but tap expects 0.
  // Tap adds the "process.exitCode" property for that purpose.
  process.exitCode = 0;
});

require("../../lib");
