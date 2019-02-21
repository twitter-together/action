module.exports = handlePullRequest

const { autoLink } = require('twitter-text')
const getNewTweets = require('./get-new-tweets')
const { parseTweet } = require('twitter-text')

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
    log: toolkit.log
  }

  octokit.hook.error('request', (error) => {
    console.log('error pull request')
    console.log(error)
    state.log.fatal(error)
    exit.failure(error.message)
  })

  const { data: files } = await state.octokit.request('GET /repos/:owner/:repo/pulls/:number/files', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    number: payload.pull_request.number
  })

  state.log(`${files.length} files changed`)
  state.log(files)

  const newTweets = files
    .filter(file => file.status === 'added' && /^tweets\/.*\.tweet$/.test(file.filename))
    .map(file => {
      const text = state.getFile(file.filename).trim()
      return {
        text,
        ...parseTweet(text)
      }
    })

  await getNewTweets(state, {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    base: payload.pull_request.base.label,
    head: payload.pull_request.head.label
  })

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
