module.exports = handlePush

const getNewTweets = require('./get-new-tweets')
const tweet = require('./tweet')

async function handlePush (toolkit) {
  const { exit, log, context: { payload, ref }, github: octokit } = toolkit

  if (!ref) {
    return exit.neutral('GITHUB_REF not set')
  }

  if (!ref.startsWith('refs/heads/')) {
    return exit.neutral(`GITHUB_REF is not a branch: ${ref}`)
  }

  const branch = process.env.GITHUB_REF.substr('refs/heads/'.length)
  if (branch !== payload.repository.default_branch) {
    return exit.neutral(`"${branch}" is not the default branch`)
  }

  const state = {
    defaultBranch: payload.repository.default_branch,
    octokit,
    getFile: toolkit.getFile.bind(toolkit),
    log: toolkit.log.bind(toolkit)
  }

  octokit.hook.error('request', (error) => {
    state.log.error(error)
  })

  const newTweets = await getNewTweets(state, {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    base: payload.before,
    head: payload.after
  })

  if (newTweets.length === 0) {
    return exit.neutral('No new tweets')
  }

  for (let i = 0; i < newTweets.length; i++) {
    state.log(`${i + 1}. ${newTweets[i].text}`)
    try {
      const result = await tweet({
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        accessTokenKey: process.env.TWITTER_ACCESS_TOKEN,
        accessTokenSecret: process.env.TWITTER_ACCESS_SECRET,
        tweet: newTweets[i].text
      })

      state.log(`tweeted: ${newTweets[i]}`)
      state.log(`-------- result -------- `)
      state.log(JSON.stringify(result, null, 2))
    } catch (error) {
      log.error(error[0])
    }
  }
}
