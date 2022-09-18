/**
 * This test checks the happy path of pull request adding a new *.tweet file
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
  .reply(200, [
    {
      status: "added",
      filename: "tweets/hello-world.tweet",
    },
  ]);

// get pull request diff
nock("https://api.github.com", {
  reqheaders: {
    accept: "application/vnd.github.diff",
    authorization: "token secret123",
  },
})
  .get("/repos/twitter-together/action/pulls/123")
  .reply(
    200,
    `diff --git a/tweets/hello-world.tweet b/tweets/hello-world.tweet
new file mode 100644
index 0000000..0123456
--- /dev/null
+++ b/tweets/hello-world.tweet
@@ -0,0 +1,6 @@
+Here is my poll
+
+( ) option 1
+() option 2
+( )  option 3
+()  option 4`
  );

// create check run
nock("https://api.github.com")
  // get changed files
  .post("/repos/twitter-together/action/check-runs", (body) => {
    tap.equal(body.name, "preview");
    tap.equal(body.head_sha, "0000000000000000000000000000000000000002");
    tap.equal(body.status, "completed");
    tap.equal(body.conclusion, "success");
    tap.same(body.output, {
      title: "1 tweet(s)",
      summary: `### ✅ Valid

> Here is my poll

The tweet includes a poll:

> 🔘 option 1
> 🔘 option 2
> 🔘 option 3
> 🔘 option 4`,
    });

    return true;
  })
  .reply(201);

process.on("exit", (code) => {
  tap.equal(code, 0);
  tap.same(nock.pendingMocks(), []);
});

require("../../lib");
