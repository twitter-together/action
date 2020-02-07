module.exports = tweet;

const Twitter = require("twitter");

const parseTweetFileContent = require("../common/parse-tweet-file-content");

function tweet({ twitterCredentials }, tweetFile) {
  const client = new Twitter(twitterCredentials);

  const tweet = parseTweetFileContent(tweetFile.text);

  if (!tweet.poll) {
    return createTweet(client, { status: tweet.text });
  }

  /* istanbul ignore if */
  if (!process.env.TWITTER_ACCOUNT_ID) {
    throw new Error(`TWITTER_ACCOUNT_ID environment variable must be set`);
  }

  /* istanbul ignore if */
  if (!process.env.TWITTER_USERNAME) {
    throw new Error(`TWITTER_USERNAME environment variable must be set`);
  }

  return createTweetWithPollCard(client, {
    name: tweetFile.filename,
    text: tweet.text,
    pollOptions: tweet.poll
  });
}

function createTweetWithPollCard(
  client,
  {
    name,
    text,
    pollOptions: [first_choice, second_choice, third_choice, fourth_choice]
  }
) {
  return new Promise((resolve, reject) => {
    // https://developer.twitter.com/en/docs/accounts-and-users/follow-search-get-users/api-reference/get-users-lookup
    // We need the twitter user ID for the request to create the tweet later
    client.get(
      "users/lookup",
      {
        screen_name: process.env.TWITTER_USERNAME
      },
      (error, result) => {
        /* istanbul ignore if */
        if (error) {
          return reject(error);
        }

        /* istanbul ignore if */
        if (!result[0]) {
          return reject(
            `Twitter account for username "${process.env.TWITTER_USERNAME}" not found`
          );
        }

        const userId = result[0].id;

        // https://developer.twitter.com/en/docs/ads/creatives/api-reference/poll#post-accounts-account-id-cards-poll
        client.post(
          `https://ads-api.twitter.com/6/accounts/${process.env.TWITTER_ACCOUNT_ID}/cards/poll`,
          {
            name,
            duration_in_minutes: 1440, // two days
            first_choice,
            second_choice,
            third_choice,
            fourth_choice,
            text
          },
          (error, result) => {
            /* istanbul ignore if */
            if (error) {
              return reject(error);
            }

            const card_uri = result.data.card_uri;

            // https://developer.twitter.com/en/docs/ads/creatives/api-reference/tweets#post-accounts-account-id-tweet
            client.post(
              `https://ads-api.twitter.com/6/accounts/${process.env.TWITTER_ACCOUNT_ID}/cards/poll`,
              {
                as_user_id: userId,
                text,
                card_uri
              },
              (error, result) => {
                /* istanbul ignore if */
                if (error) {
                  return reject(error);
                }

                resolve({
                  text,
                  url: `https://twitter.com/${process.env.TWITTER_USERNAME}/status/${result.data.id_str}`
                });
              }
            );
          }
        );
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
        url: `https://twitter.com/${result.user.screen_name}/status/${result.id_str}`
      });
    });
  });
}
