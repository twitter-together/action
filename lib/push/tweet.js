module.exports = tweet;

const Twitter = require("twitter");

const parseTweetFileContent = require("../common/parse-tweet-file-content");

async function tweet({ twitterCredentials }, tweetFile) {
  const client = new Twitter(twitterCredentials);
  const tweet = parseTweetFileContent(tweetFile.text);
  return handleTweet(client, tweet, tweetFile.filename);
}

async function handleTweet(client, tweet, name) {
  const tweetData = {
    status: tweet.text,
  };

  if (tweet.poll) {
    /* istanbul ignore if */
    if (!process.env.TWITTER_ACCOUNT_ID) {
      throw new Error(`TWITTER_ACCOUNT_ID environment variable must be set`);
    }

    tweetData.card_uri = await createPoll(client, {
      name,
      pollOptions: tweet.poll,
    }).then((poll) => poll.card_uri);
  }

  if (tweet.reply) {
    // TODO: Should this throw if an invalid reply is passed and there is no match?
    const match = tweet.reply.match(
      /^https:\/\/twitter\.com\/[^/]+\/status\/(\d+)$/
    );
    if (match) {
      tweetData.in_reply_to_status_id = match[1];
      tweetData.auto_populate_reply_metadata = true;
    }
  }

  const tweetResult = await createTweet(client, tweetData);
  if (tweet.thread)
    tweetResult.thread = await handleTweet(
      client,
      { ...tweet.thread, reply: tweetResult.url },
      name
    );

  return tweetResult;
}

function createPoll(
  client,
  {
    name,
    text,
    pollOptions: [first_choice, second_choice, third_choice, fourth_choice],
  }
) {
  return new Promise((resolve, reject) => {
    // https://developer.twitter.com/en/docs/ads/creatives/api-reference/poll#post-accounts-account-id-cards-poll
    client.post(
      `https://ads-api.twitter.com/8/accounts/${process.env.TWITTER_ACCOUNT_ID}/cards/poll`,
      {
        name,
        duration_in_minutes: 1440, // two days
        first_choice,
        second_choice,
        third_choice,
        fourth_choice,
        text,
      },
      (error, result) => {
        /* istanbul ignore if */
        if (error) {
          return reject(error);
        }

        resolve({ card_uri: result.data.card_uri });
      }
    );
  });
}

function createTweet(client, options) {
  return new Promise((resolve, reject) => {
    client.post("statuses/update", options, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve({
        text: options.status,
        url: `https://twitter.com/${result.user.screen_name}/status/${result.id_str}`,
      });
    });
  });
}
