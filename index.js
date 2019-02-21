const { Toolkit } = require('actions-toolkit')
const { autoLink } = require('twitter-text')

const getNewTweets = require('./lib/get-new-tweets')
const tweet = require('./lib/tweet')

const toolkit = new Toolkit()
const { exit, log, context: { payload, ref }, github: octokit } = toolkit
const startedAt = new Date().toISOString()

main()

async function main () {
  if (!ref) {
    return exit.neutral('GITHUB_REF not set')
  }

  if (!ref.startsWith('refs/heads/')) {
    return exit.neutral(`GITHUB_REF is not a branch: ${ref}`)
  }

  const state = {
    branch: process.env.GITHUB_REF.substr('refs/heads/'.length),
    defaultBranch: payload.repository.default_branch,
    octokit,
    getFile: toolkit.getFile.bind(toolkit),
    log: toolkit.log.bind(toolkit)
  }

  octokit.hook.error('request', (error) => {
    state.log.error(error)
  })

  const newTweets = await getNewTweets(state, payload)

  if (newTweets.length === 0) {
    return exit.neutral('No new tweets')
  }

  if (state.branch === state.defaultBranch) {
    state.log(`"${state.branch}" is the default branch`)

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
    return
  }

  state.log(`"${state.branch}" is not the default branch`)

  for (let i = 0; i < newTweets.length; i++) {
    if (newTweets[i].length > 240) {
      exit.failure(`TODO: tweet is too long - create failing status run: ${newTweets[i]}`)
    }
  }

  const isValid = newTweets.find(tweet => tweet.valid)

  await octokit.request('POST /repos/:owner/:repo/check-runs', {
    headers: {
      accept: 'application/vnd.github.antiope-preview+json'
    },
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    name: 'twitter-together',
    head_sha: payload.after,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    status: 'completed',
    conclusion: isValid ? 'success' : 'failure',
    output: {
      title: `Preview: ${newTweets.length} tweet(s)`,
      summary: newTweets.map(tweet => {
        const text = autoLink(tweet.text).replace(/(^|\n)/g, '$1> ')

        if (tweet.valid) {
          return `### ✅ Valid

${text}`
        }

        return `### ❌ Valid

${text}

The above tweet is ${280 - tweet.weightedLength} characters to long`
      }).join('\n\n---\n\n')
    }
  })
}
