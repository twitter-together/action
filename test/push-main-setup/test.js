/**
 * This test checks the setup routine that occurs on a push to main
 * when the `tweets/` folder does not yet exist
 */

const assert = require("assert");
const path = require("path");

const nock = require("nock");
const tap = require("tap");

// SETUP
process.env.GITHUB_EVENT_NAME = "push";
process.env.GITHUB_TOKEN = "secret123";
process.env.GITHUB_EVENT_PATH = require.resolve("./event.json");
process.env.GITHUB_REF = "refs/heads/main";
process.env.GITHUB_WORKSPACE = path.dirname(process.env.GITHUB_EVENT_PATH);
process.env.GITHUB_SHA = "0000000000000000000000000000000000000002";

// set other env variables so action-toolkit is happy
process.env.GITHUB_WORKFLOW = "";
process.env.GITHUB_ACTION = "twitter-together";
process.env.GITHUB_ACTOR = "";
process.env.GITHUB_REPOSITORY = "";

// MOCK
nock("https://api.github.com", {
  reqheaders: {
    authorization: "token secret123",
  },
})
  // check if twitter-together-setup branch exists
  .head("/repos/gr2m/twitter-together/git/refs/heads/twitter-together-setup")
  .reply(404)

  // Create the "twitter-together-setup" branch
  .post("/repos/gr2m/twitter-together/git/refs", (body) => {
    tap.equal(body.ref, "refs/heads/twitter-together-setup");
    tap.equal(body.sha, "0000000000000000000000000000000000000002");

    return true;
  })
  .reply(201)

  // Read contents of tweets/README.md file in gr2m/twitter-together
  .get("/repos/gr2m/twitter-together/contents/tweets/README.md")
  .reply(200, "contents of tweets/README.md")

  // Create tweets/README.md file
  .put("/repos/gr2m/twitter-together/contents/tweets/README.md", (body) => {
    tap.equal(
      body.content,
      Buffer.from("contents of tweets/README.md").toString("base64")
    );
    tap.equal(body.branch, "twitter-together-setup");
    tap.equal(body.message, "twitter-together setup");

    return true;
  })
  .reply(201)

  // Create pull request
  .post("/repos/gr2m/twitter-together/pulls", (body) => {
    tap.equal(body.title, "🐦 twitter-together setup");
    tap.match(
      body.body,
      /This pull request creates the `tweets\/` folder where your `\*\.tweet` files go into/
    );
    tap.equal(body.head, "twitter-together-setup");
    tap.equal(body.base, "main");

    return true;
  })
  .reply(201, {
    html_url: "https://github.com/gr2m/twitter-together/pull/123",
  });

process.on("exit", (code) => {
  assert.equal(code, 0);
  assert.deepEqual(nock.pendingMocks(), []);
});

require("../../lib");
