module.exports = tweet;

const Twitter = require("twitter");

const parseTweetFileContent = require("../common/parse-tweet-file-content");

async function tweet({ twitterCredentials }, tweetFile) {
  const client = new Twitter(twitterCredentials);

  const tweet = parseTweetFileContent(tweetFile.text);

  if (!tweet.poll) {
    return createTweet(client, { status: tweet.text });
  }

  /* istanbul ignore if */
  if (!process.env.TWITTER_ACCOUNT_ID) {
    throw new Error(`TWITTER_ACCOUNT_ID environment variable must be set`);
  }

  const { card_uri } = await createPoll(client, {
    name: tweetFile.filename,
    pollOptions: tweet.poll,
  });

  return createTweet(client, { status: tweet.text, card_uri });
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
