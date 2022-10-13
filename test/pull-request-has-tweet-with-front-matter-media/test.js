/**
 * This test checks the happy path of pull request adding a new *.tweet file
 */

const nock = require("nock");
const tap = require("tap");
const path = require("path");

// SETUP
process.env.GITHUB_EVENT_NAME = "pull_request";
process.env.GITHUB_TOKEN = "secret123";
process.env.GITHUB_EVENT_PATH = require.resolve("./event.json");

// set other env variables so action-toolkit is happy
process.env.GITHUB_REF = "";
process.env.GITHUB_WORKSPACE = path.dirname(process.env.GITHUB_EVENT_PATH);
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
    `diff --git a/media/cat.jpg b/media/cat.jpg
new file mode 100644
index 0000000..a10d505
Binary files /dev/null and b/media/cat.jpg differ
diff --git a/media/dog.jpg b/media/dog.jpg
new file mode 100644
index 0000000..7a25bfb
Binary files /dev/null and b/media/dog.jpg differ
diff --git a/tweets/media.tweet b/tweets/media.tweet
new file mode 100644
index 0000000..1715c04
--- /dev/null
+++ b/tweets/media.tweet
@@ -0,0 +1,9 @@
+---
+media:
+  - file: cat.jpg
+    alt: A cat
+  - file: dog.jpg
+    alt: A dog
+---
+
+Here are some cute animals!`
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

Uploading media:

A cat
<img src="https://raw.githubusercontent.com/twitter-together/action/undefined/media/cat.jpg" height="200" />

A dog
<img src="https://raw.githubusercontent.com/twitter-together/action/undefined/media/dog.jpg" height="200" />

> Here are some cute animals!`,
    });

    return true;
  })
  .reply(201);

process.on("exit", (code) => {
  tap.equal(code, 0);
  tap.same(nock.pendingMocks(), []);
});

require("../../lib");
