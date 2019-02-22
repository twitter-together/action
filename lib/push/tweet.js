module.exports = tweet

const Twitter = require('twitter')

async function tweet (options) {
  const client = new Twitter({
    consumer_key: options.consumerKey,
    consumer_secret: options.consumerSecret,
    access_token_key: options.accessTokenKey,
    access_token_secret: options.accessTokenSecret
  })

  return new Promise((resolve, reject) => {
    client.post('statuses/update', { status: options.tweet }, (error, result) => {
      if (error) {
        return reject(error)
      }

      resolve({
        url: `https://twitter.com/${result.user.screen_name}/status/${result.id_str}`
      })
    })
  })
}
