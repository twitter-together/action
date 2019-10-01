module.exports = tweet;

const Twitter = require("twitter");

async function tweet({ twitterCredentials }, tweet) {
  const client = new Twitter(twitterCredentials);

  return new Promise((resolve, reject) => {
    client.post("statuses/update", { status: tweet }, (error, result) => {
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
