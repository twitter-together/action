module.exports = handlePullRequest

const { autoLink } = require('twitter-text')
const parseDiff = require('parse-diff')
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

  // TODO: check `GET /repos/:owner/:repo/pulls/:number/files` first to make avoid loading
  //       huge diffs for PRs that don’t have a new tweet
  const { data } = await state.octokit.request('GET /repos/:owner/:repo/pulls/:number', {
    headers: {
      accept: 'application/vnd.github.diff'
    },
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    number: payload.pull_request.number
  })
  const files = parseDiff(data)

  state.log(`${files.length} files changed`)
  state.log(files)

  const newTweets = files
    .filter(file => file.new && /^tweets\/.*\.tweet$/.test(file.to))
    .map(file => {
      const text = file.chunks[0].changes.map(line => line.content.substr(1)).join('\n')
      return {
        text,
        ...parseTweet(text)
      }
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
