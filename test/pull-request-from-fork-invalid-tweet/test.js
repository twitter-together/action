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
@@ -0,0 +1 @@
+Cupcake ipsum dolor sit amet chupa chups candy halvah I love. Apple pie gummi bears chupa chups jujubes I love cake jelly. Jelly candy canes pudding jujubes caramels sweet roll I love. Sweet fruitcake oat cake I love brownie sesame snaps apple pie lollipop. Pie dragée I love apple pie cotton candy candy chocolate bar.`
  );

process.on("exit", (code) => {
  tap.equal(code, 1);
  tap.same(nock.pendingMocks(), []);

  // above code exits with 1 (error), but tap expects 0.
  // Tap adds the "process.exitCode" property for that purpose.
  process.exitCode = 0;
});

require("../../lib");
