/**
 * This test checks the happy path of a commit to the main branch
 * which includes a new *.tweet file that is making use of the front matter to retweet.
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
process.env.TWITTER_API_KEY = "key123";
process.env.TWITTER_API_SECRET_KEY = "keysecret123";
process.env.TWITTER_ACCESS_TOKEN = "token123";
process.env.TWITTER_ACCESS_TOKEN_SECRET = "tokensecret123";

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
        "Tweeted:\n\n- https://twitter.com/m2rg/status/0000000000000000001"
      );
      return true;
    }
  )
  .reply(201);

nock("https://api.twitter.com")
  .get("/2/users/me")
  .reply(200, {
    data: {
      id: "123",
      name: "gr2m",
      username: "gr2m",
    },
  })

  .post("/2/users/123/retweets", (body) => {
    tap.equal(body.tweet_id, "0000000000000000001");
    return true;
  })
  .reply(201, {
    data: {
      retweeted: true,
    },
  })

  .get("/2/tweets/0000000000000000001?expansions=author_id")
  .reply(200, {
    data: {
      id: "0000000000000000001",
      text: "",
      author_id: "456",
    },
    includes: {
      users: [
        {
          id: "456",
          name: "m2rg",
          username: "m2rg",
        },
      ],
    },
  });

process.on("exit", (code) => {
  tap.equal(code, 0);
  tap.same(nock.pendingMocks(), []);
});

require("../../lib");
