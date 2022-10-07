/**
 * This test checks the ability to invoke a tweet using the `--file` command line flag
 * which is in a custom directory and has front matter that includes media.
 */

const nock = require("nock");
const tap = require("tap");

// MOCK
nock("https://api.twitter.com")
  .post("/1.1/statuses/update.json", (body) => {
    tap.equal(body.status, "Cuddly :)\n");
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

process.chdir(__dirname);
process.argv = [
  "node",
  "lib/index.js",
  "--file",
  "custom/tweets/hello-world.tweet",
];

process.on("exit", (code) => {
  tap.equal(code, 0);
  tap.same(nock.pendingMocks(), []);
});

require("../../lib");
