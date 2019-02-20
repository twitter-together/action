const { Toolkit } = require('actions-toolkit')
const { context: { payload }, github: { request } } = new Toolkit()

const getNewTweets = require('./lib/get-new-tweets')
const tweet = require('./lib/tweet')

main()

async function main () {
  if (!process.env.GITHUB_REF) {
    console.log('GITHUB_REF not set')
    return
  }

  if (!process.env.GITHUB_REF.startsWith('refs/heads/')) {
    console.log(`GITHUB_REF is not a branch: ${process.env.GITHUB_REF}`)
    return
  }

  const branch = process.env.GITHUB_REF.substr('refs/heads/'.length)
  const defaultBranch = payload.repository.default_branch
  const newTweets = await getNewTweets(request, payload)

  if (newTweets.length === 0) {
    console.log('No new tweets')
    return
  }

  if (branch === defaultBranch) {
    console.log(`"${branch}" is the default branch`)

    console.log(`TODO: show preview of new tweets (${newTweets.length})`)

    for (let i = 0; i < newTweets.length; i++) {
      if (newTweets[i].length > 240) {
        console.log(`TODO: tweet is too long - create failing status run: ${newTweets[i]}`)
      }
    }
    return
  }

  for (let i = 0; i < newTweets.length; i++) {
    console.log(`1st tweet: ${newTweets[i]}`)
    try {
      const result = await tweet({
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        accessTokenKey: process.env.TWITTER_ACCESS_TOKEN,
        accessTokenSecret: process.env.TWITTER_ACCESS_SECRET,
        tweet: newTweets[i]
      })

      console.log(`tweeted: ${newTweets[i]}`)
      console.log(`-------- result -------- `)
      console.log(JSON.stringify(result, null, 2))
    } catch (error) {
      console.error(error[0])
    }
  }
}
