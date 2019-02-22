module.exports = handlePush

const fs = require('fs')
const { resolve: resolvePath } = require('path')

const getNewTweets = require('./get-new-tweets')
const setup = require('./setup')
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
    toolkit
  }

  // make sure repository is already setup
  const tweetsFolderPath = resolvePath(toolkit.workspace, 'tweets')
  const isDirectory = await new Promise(resolve => {
    fs.stat(tweetsFolderPath, (error, stat) => {
      if (error) {
        return resolve(false)
      }

      resolve(stat.isDirectory())
    })
  })

  log.info(`${tweetsFolderPath} ${isDirectory ? 'exists' : 'does not yet exist'}`)

  if (!isDirectory) {
    return setup(state)
  }

  octokit.hook.error('request', (error) => {
    state.toolkit.log.info(error.request)
    state.toolkit.log.fatal(error)
    exit.failure(error.message)
  })

  // find tweets
  const newTweets = await getNewTweets(state, {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    base: payload.before,
    head: payload.after
  })

  if (newTweets.length === 0) {
    return exit.neutral('No new tweets')
  }

  // tweet all the tweets
  const tweetUrls = []
  for (let i = 0; i < newTweets.length; i++) {
    state.toolkit.log(`${i + 1}. ${newTweets[i].text}`)
    try {
      const result = await tweet({
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        accessTokenKey: process.env.TWITTER_ACCESS_TOKEN,
        accessTokenSecret: process.env.TWITTER_ACCESS_SECRET,
        tweet: newTweets[i].text
      })

      state.toolkit.log(`tweeted: ${result.url}`)
      tweetUrls.push(result.url)
    } catch (error) {
      log.error(error[0])
    }
  }

  // add comment with tweet URLs
  // https://developer.github.com/v3/repos/comments/#create-a-commit-comment
  await octokit.request('POST /repos/:owner/:repo/commits/:sha/comments', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    sha: payload.head_commit.id,
    body: 'Tweeted:\n\n- ' + tweetUrls.join('\n- ')
  })
}
