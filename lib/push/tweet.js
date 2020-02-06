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

  const { card_uri } = await createPollCard(client, {
    name: tweetFile.filename,
    pollOptions: tweet.poll
  });
  return createTweet(client, { status: tweet.text, card_uri });
}

function createPollCard(
  client,
  {
    name,
    pollOptions: [first_choice, second_choice, third_choice, fourth_choice]
  }
) {
  return new Promise((resolve, reject) => {
    client.post(
      `https://ads-api.twitter.com/6/accounts/${process.env.TWITTER_ACCOUNT_ID}/cards/poll`,
      {
        name,
        duration_in_minutes: 1440, // two days
        first_choice,
        second_choice,
        third_choice,
        fourth_choice
      },
      (error, result) => {
        /* istanbul ignore if */
        if (error) {
          return reject(error);
        }

        resolve(result.data);

        // result looks like this:
        // {
        //   request: {
        //     params: {
        //       name: 'foo-bar-1',
        //       first_choice: 'foo',
        //       third_choice: 'daz',
        //       fourth_choice: 'daz',
        //       second_choice: 'bar',
        //       duration_in_minutes: 120
        //     }
        //   },
        //   data: {
        //     name: 'foo-bar-1',
        //     start_time: '2020-01-07T22:42:50Z',
        //     first_choice: 'foo',
        //     third_choice: 'daz',
        //     fourth_choice: 'daz',
        //     second_choice: 'bar',
        //     end_time: '2020-01-08T00:42:50Z',
        //     id: '8r115',
        //     created_at: '2020-01-07T22:42:50Z',
        //     duration_in_minutes: '120',
        //     card_uri: 'card://1214678808315351040',
        //     updated_at: '2020-01-07T22:42:50Z',
        //     deleted: false,
        //     card_type: 'TEXT_POLLS'
        //   }
        // }
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
        text: tweet,
        url: `https://twitter.com/${result.user.screen_name}/status/${result.id_str}`
      });
    });
  });
}
