module.exports = tweet

const Twitter = require('twitter')

async function tweet (state, tweet) {
  const client = new Twitter(state.twitterCredential)

  return new Promise((resolve, reject) => {
    client.post('statuses/update', { status: tweet }, (error, result) => {
      if (error) {
        return reject(error)
      }

      resolve({
        text: tweet,
        url: `https://twitter.com/${result.user.screen_name}/status/${result.id_str}`
      })
    })
  })
}
