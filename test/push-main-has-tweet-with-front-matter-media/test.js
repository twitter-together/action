/**
 * This test checks the happy path of a commit to the main branch
 * which includes a new *.tweet file that is making use of the front matter to quote retweet.
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
      {
        status: "added",
        filename: "media/blahaj.png",
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

nock("https://api.twitter.com")
  .post("/1.1/statuses/update.json", (body) => {
    tap.equal(body.status, "Cuddly :)");
    tap.equal(body.media_ids, "0000000000000000002");
    return true;
  })
  .reply(201, {
    id_str: "0000000000000000001",
    user: {
      screen_name: "gr2m",
    },
  });

nock("https://upload.twitter.com")
  .post("/1.1/media/upload.json", (body) => {
    tap.equal(body.command, "INIT");
    tap.equal(body.total_bytes, "107352");
    tap.equal(body.media_type, "image/png");
    return true;
  })
  .reply(201, {
    media_id_string: "0000000000000000002",
  })

  .post("/1.1/media/upload.json", () => {
    // TODO: Body just seems to be a string here, not an object.
    // tap.equal(body.command, "APPEND");
    // tap.equal(body.media_id, "0000000000000000002");
    // tap.equal(body.media_type, "");
    // tap.equal(body.media, "");
    // tap.equal(body.segment_index, 0);
    return true;
  })
  .reply(201)

  .post("/1.1/media/upload.json", (body) => {
    tap.equal(body.command, "FINALIZE");
    tap.equal(body.media_id, "0000000000000000002");
    return true;
  })
  .reply(201);

// TODO: Support alt text (twitter library does not support JSON payloads)
//       https://github.com/desmondmorris/node-twitter/issues/347
// .post("/1.1/media/metadata/create.json", (body) => {
//   tap.equal(body.media_id, "0000000000000000002");
//   tap.equal(body.alt_text.text, "Blahaj!");
//   return true;
// })
// .reply(201);

process.on("exit", (code) => {
  tap.equal(code, 0);
  tap.same(nock.pendingMocks(), []);
});

require("../../lib");
