/**
 * This test checks the ability to invoke a tweet using the `--file` command line flag.
 */

const nock = require("nock");
const tap = require("tap");

// SETUP
process.env.TWITTER_API_KEY = "key123";
process.env.TWITTER_API_SECRET_KEY = "keysecret123";
process.env.TWITTER_ACCESS_TOKEN = "token123";
process.env.TWITTER_ACCESS_TOKEN_SECRET = "tokensecret123";

// MOCK
nock("https://api.twitter.com")
  .get("/2/users/me")
  .reply(200, {
    data: {
      id: "123",
      name: "gr2m",
      username: "gr2m",
    },
  })

  .post("/2/tweets", (body) => {
    tap.equal(body.text, "Hello, world!");
    return true;
  })
  .reply(201, {
    data: {
      id: "0000000000000000001",
      text: "Hello, world!",
    },
  });

process.chdir(__dirname);
process.argv = ["node", "lib/index.js", "--file", "tweets/hello-world.tweet"];

process.on("exit", (code) => {
  tap.equal(code, 0);
  tap.same(nock.pendingMocks(), []);
});

require("../../lib");
