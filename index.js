console.log('tweet-together!')
console.log('Ref:', process.env.GITHUB_REF)

const Twitter = require('twitter')

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_SECRET
})

client.post('statuses/update', { status: 'Testing: ' + Math.random().toString(36).substr(2, 5) }, function (error, tweet, response) {
  if (error) {
    throw error
  }

  console.log(tweet) // Tweet body.
})
