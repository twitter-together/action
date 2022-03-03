/**
 * This test checks the happy path of a commit to the main branch (master)
 * which includes a new *.tweet file that is making use of the front matter.
 *
 * Only thread-delimiter and poll are actively used in the front matter currently.
 * (Threads aren't supported, but the delimiter is used to separate the first tweet).
 */

const assert = require("assert");
const path = require("path");

const nock = require("nock");
const tap = require("tap");

// SETUP
process.env.GITHUB_EVENT_NAME = "push";
process.env.GITHUB_TOKEN = "secret123";
process.env.GITHUB_EVENT_PATH = require.resolve("./event.json");
process.env.GITHUB_REF = "refs/heads/master";
process.env.GITHUB_WORKSPACE = path.dirname(process.env.GITHUB_EVENT_PATH);

// set other env variables so action-toolkit is happy
process.env.GITHUB_WORKFLOW = "";
process.env.GITHUB_ACTION = "twitter-together";
process.env.GITHUB_ACTOR = "";
process.env.GITHUB_REPOSITORY = "";
process.env.GITHUB_SHA = "";

// Needed for polls only
process.env.TWITTER_ACCOUNT_ID = "account123";

// MOCK
nock("https://api.github.com", {
  reqheaders: {
    authorization: "token secret123",
  },
})
  // get changed files
  .get(
    "/repos/gr2m/twitter-together/compare/0000000000000000000000000000000000000001...0000000000000000000000000000000000000002"
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
    "/repos/gr2m/twitter-together/commits/0000000000000000000000000000000000000002/comments",
    (body) => {
      tap.equal(
        body.body,
        "Tweeted:\n\n- https://twitter.com/gr2m/status/0000000000000000001"
      );
      return true;
    }
  )
  .reply(201);

// lookup user ID
nock("https://ads-api.twitter.com")
    .post("/8/accounts/account123/cards/poll", (body) => {
      tap.equal(body.name, "tweets/hello-world.tweet");
      tap.equal(body.duration_in_minutes, "1440"); // two days
      tap.equal(body.first_choice, "a");
      tap.equal(body.second_choice, "b");
      return true;
    })
    .reply(201, { data: { card_uri: "card://123" } });

nock("https://api.twitter.com")
    .post("/1.1/statuses/update.json", (body) => {
      tap.equal(body.card_uri, "card://123");
      tap.equal(body.status, "Hello, world!");
      return true;
    })
    .reply(201, {
      id_str: "0000000000000000001",
      user: {
        screen_name: "gr2m",
      },
    });

process.on("exit", (code) => {
  assert.equal(code, 0);
  assert.deepEqual(nock.pendingMocks(), []);
});

require("../../lib");
