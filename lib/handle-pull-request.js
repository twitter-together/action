module.exports = handlePullRequest

const { autoLink } = require('twitter-text')
const getNewTweets = require('./get-new-tweets')

async function handlePullRequest (toolkit) {
  const { exit, log, context: { payload }, github: octokit } = toolkit
  const startedAt = new Date().toISOString()

  log(`-------- toolkit.context.event -------- `)
  log(toolkit.context.event)
  log(`-------- toolkit.context.payload.action -------- `)
  log(toolkit.context.payload.action)

  const base = toolkit.context.payload.pull_request.base.ref
  if (toolkit.context.payload.repository.default_branch !== base) {
    return exit.neutral(`Pull request base "${base}" is not the repository’s default branch`)
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
    base: payload.pull_request.base.label,
    head: payload.pull_request.head.label
  })

  for (let i = 0; i < newTweets.length; i++) {
    if (newTweets[i].length > 240) {
      exit.failure(`TODO: tweet is too long - create failing status run: ${newTweets[i]}`)
    }
  }

  const isValid = newTweets.every(tweet => tweet.valid)

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
