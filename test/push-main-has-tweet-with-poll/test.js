/**
 * This test checks the happy path of a commit to the main branch (main)
 * which includes a new *.tweet file.
 */

const path = require("path");

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
    "/repos/twitter-together/action/compare/0000000000000000000000000000000000000001...0000000000000000000000000000000000000002"
  )
  .reply(200, {
    files: [
      {
        status: "added",
        filename: "tweets/my-poll.tweet",
      },
    ],
  })

  // post comment
  .post(
    "/repos/twitter-together/action/commits/0000000000000000000000000000000000000002/comments",
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
  .post("/11/accounts/account123/cards/poll", (body) => {
    tap.equal(body.name, "tweets/my-poll.tweet");
    tap.equal(body.duration_in_minutes, "1440"); // two days
    tap.equal(body.first_choice, "option 1");
    tap.equal(body.second_choice, "option 2");
    tap.equal(body.third_choice, "option 3");
    tap.equal(body.fourth_choice, "option 4");
    return true;
  })
  .reply(201, { data: { card_uri: "card://123" } });

nock("https://api.twitter.com")
  .post("/1.1/statuses/update.json", (body) => {
    tap.equal(body.card_uri, "card://123");
    tap.equal(body.status, "Here is my poll");
    return true;
  })
  .reply(201, {
    id_str: "0000000000000000001",
    user: {
      screen_name: "gr2m",
    },
  });

process.on("exit", (code) => {
  tap.equal(code, 0);
  tap.same(nock.pendingMocks(), []);
});

require("../../lib");
