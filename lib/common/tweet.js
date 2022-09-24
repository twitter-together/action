module.exports = tweet;

const { TwitterApi } = require("twitter-api-v2");
const mime = require("mime-types");

const TWEET_REGEX = /^https:\/\/twitter\.com\/[^/]+\/status\/(\d+)$/;

async function tweet({ twitterCredentials }, tweetData, tweetFile) {
  const client = new TwitterApi(twitterCredentials);

  const self = await client.v2.me();
  if (self.errors) throw self.errors;

  return handleTweet(client, self.data, tweetData, tweetFile);
}

async function handleTweet(client, self, tweet, name) {
  if (tweet.retweet && !tweet.text) {
    // TODO: Should this throw if an invalid tweet is passed and there is no match?
    const match = tweet.retweet.match(TWEET_REGEX);
    if (match) return createRetweet(client, self, match[1]);
  }

  const tweetData = {
    text: tweet.text,
  };

  if (tweet.poll) {
    tweetData.poll = {
      duration_minutes: 1440,
      options: tweet.poll,
    };
  }

  if (tweet.reply) {
    // TODO: Should this throw if an invalid reply is passed and there is no match?
    const match = tweet.reply.match(TWEET_REGEX);
    if (match) {
      tweetData.reply = {
        in_reply_to_tweet_id: match[1],
      };
    }
  }

  if (tweet.retweet) {
    // TODO: Should this throw if an invalid tweet is passed and there is no match?
    const match = tweet.retweet.match(TWEET_REGEX);
    if (match) tweetData.quote_tweet_id = match[1];
  }

  if (tweet.media?.length) {
    tweetData.media = {
      media_ids: await Promise.all(
        tweet.media.map((media) => createMedia(client, media))
      ),
    };
  }

  const tweetResult = await createTweet(client, self, tweetData);

  if (tweet.thread) {
    tweetResult.thread = await handleTweet(
      client,
      self,
      { ...tweet.thread, reply: tweetResult.url },
      name
    );
  }

  return tweetResult;
}

async function createMedia(client, { file, alt }) {
  const mediaId = await client.v1.uploadMedia(file, {
    mimeType: mime.lookup(file),
  });
  if (alt)
    await client.v1.createMediaMetadata(mediaId, { alt_text: { text: alt } });
  return mediaId;
}

async function createTweet(client, self, options) {
  return client.v2.tweet(options).then((data) => {
    if (data.errors) throw data.errors;
    return {
      text: data.data.text,
      url: `https://twitter.com/${self.username}/status/${data.data.id}`,
    };
  });
}

function createRetweet(client, self, id) {
  return client.v2.retweet(self.id, id).then(async (data) => {
    if (data.errors) throw data.errors;
    if (!data.data.retweeted) throw new Error("Retweet failed");

    const other = await client.v2.singleTweet(id, { expansions: "author_id" });
    if (other.errors) throw other.errors;
    const otherUser = other.includes.users.find(
      (user) => user.id === other.data.author_id
    );

    return {
      retweet: `https://twitter.com/${otherUser.username}/status/${id}`,
      url: `https://twitter.com/${otherUser.username}/status/${id}`, // TODO: Twitter does not return the id of the retweet itself
    };
  });
}
