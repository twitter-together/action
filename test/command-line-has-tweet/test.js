/**
 * This test checks the ability to invoke a tweet using the `--file` command line flag.
 */

const nock = require("nock");
const tap = require("tap");

// MOCK
nock("https://api.twitter.com")
  .post("/1.1/statuses/update.json", (body) => {
    tap.equal(body.status, "Hello, world!\n");
    return true;
  })
  .reply(201, {
    id_str: "0000000000000000001",
    user: {
      screen_name: "gr2m",
    },
  });

process.chdir(__dirname);
process.argv = ["node", "lib/index.js", "--file", "tweets/hello-world.tweet"];

process.on("exit", (code) => {
  tap.equal(code, 0);
  tap.same(nock.pendingMocks(), []);
});

require("../../lib");
