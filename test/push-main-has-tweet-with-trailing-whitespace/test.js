/**
 * This test checks the happy path of a commit to the main branch
 * which includes a new *.tweet file that has trailing whitespace on front matter and thread delimiters
 */

const path = require("path");
const fs = require("fs");

const nock = require("nock");
const tap = require("tap");

// SETUP
process.env.GITHUB_EVENT_NAME = "push";
process.env.GITHUB_TOKEN = "secret123";
process.env.GITHUB_EVENT_PATH = require.resolve("./event.json");
process.env.GITHUB_REF = "refs/heads/main";
process.env.GITHUB_WORKSPACE = path.dirname(process.env.GITHUB_EVENT_PATH);

// set other env variables so action-toolkit is happy
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
  .get(
    "/repos/twitter-together/action/compare/0000000000000000000000000000000000000001...0000000000000000000000000000000000000002"
  )
  .reply(200, {
    files: [
      {
        status: "added",
        filename: "tweets/hello-world.tweet",
      },
    ],
  })

  // post comment
  .post(
    "/repos/twitter-together/action/commits/0000000000000000000000000000000000000002/comments",
    (body) => {
      tap.equal(
        body.body,
        "Tweeted:\n\n- https://twitter.com/gr2m/status/0000000000000000002\n- https://twitter.com/gr2m/status/0000000000000000003"
      );
      return true;
    }
  )
  .reply(201);

nock("https://api.twitter.com")
  .post("/1.1/statuses/update.json", (body) => {
    tap.equal(body.status, "Hello, world!");
    tap.equal(body.in_reply_to_status_id, "0000000000000000001");
    tap.equal(body.auto_populate_reply_metadata, "true");
    return true;
  })
  .reply(201, {
    id_str: "0000000000000000002",
    user: {
      screen_name: "gr2m",
    },
  })

  .post("/1.1/statuses/update.json", (body) => {
    tap.equal(body.status, "Second Tweet!");
    tap.equal(body.in_reply_to_status_id, "0000000000000000002");
    tap.equal(body.auto_populate_reply_metadata, "true");
    return true;
  })
  .reply(201, {
    id_str: "0000000000000000003",
    user: {
      screen_name: "gr2m",
    },
  });

// Confirm there is whitespace
const contents = fs.readFileSync(path.join(__dirname, "tweets/hello-world.tweet"), "utf-8");
tap.match(contents, /^--- \n[\s\S]+\n--- \n[\s\S]+\n--- \n[\s\S]+$/);

process.on("exit", (code) => {
  tap.equal(code, 0);
  tap.same(nock.pendingMocks(), []);
});

require("../../lib");
