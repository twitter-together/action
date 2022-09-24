/**
 * This test checks the ability to invoke a tweet using the `--file` command line flag
 * which has front matter that includes media.
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
    tap.equal(body.text, "Cuddly :)");
    tap.type(body.media, "object");
    tap.hasProp(body.media, "media_ids");
    tap.same(body.media.media_ids, ["0000000000000000002"]);
    return true;
  })
  .reply(201, {
    data: {
      id: "0000000000000000001",
      text: "Cuddly :) https://t.co/abcdeFGHIJ",
    },
  });

nock("https://upload.twitter.com")
  .post("/1.1/media/upload.json", (body) => {
    tap.match(
      body,
      'Content-Disposition: form-data; name="command"\r\n\r\nINIT'
    );
    tap.match(
      body,
      'Content-Disposition: form-data; name="total_bytes"\r\n\r\n107352'
    );
    tap.match(
      body,
      'Content-Disposition: form-data; name="media_type"\r\n\r\nimage/png'
    );
    return true;
  })
  .reply(202, {
    media_id_string: "0000000000000000002",
    expires_after_secs: 86400,
    media_key: "3_0000000000000000002",
  })

  .post("/1.1/media/upload.json")
  .reply(204)

  .post("/1.1/media/upload.json", (body) => {
    tap.match(
      body,
      'Content-Disposition: form-data; name="command"\r\n\r\nFINALIZE'
    );
    tap.match(
      body,
      'Content-Disposition: form-data; name="media_id"\r\n\r\n0000000000000000002'
    );
    return true;
  })
  .reply(201, {
    media_id_string: "0000000000000000002",
    media_key: "3_0000000000000000002",
    size: 107352,
    expires_after_secs: 86400,
    image: {
      image_type: "image/png",
      w: 640,
      h: 360,
    },
  })

  .post("/1.1/media/metadata/create.json", (body) => {
    tap.equal(body.media_id, "0000000000000000002");
    tap.type(body.alt_text, "object");
    tap.hasProp(body.alt_text, "text");
    tap.equal(body.alt_text.text, "Blahaj!");
    return true;
  })
  .reply(200);

process.chdir(__dirname);
process.argv = ["node", "lib/index.js", "--file", "tweets/hello-world.tweet"];

process.on("exit", (code) => {
  tap.equal(code, 0);
  tap.same(nock.pendingMocks(), []);
});

require("../../lib");
