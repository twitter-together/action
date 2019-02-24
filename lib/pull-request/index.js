module.exports = handlePullRequest

const { autoLink } = require('twitter-text')
const parseDiff = require('parse-diff')
const { parseTweet } = require('twitter-text')

async function handlePullRequest (toolkit) {
  const { context: { payload }, github: octokit } = toolkit
  const startedAt = new Date().toISOString()

  const base = toolkit.context.payload.pull_request.base.ref
  if (toolkit.context.payload.repository.default_branch !== base) {
    return toolkit.exit.neutral(`Pull request base "${base}" is not the repository’s default branch`)
  }

  const state = {
    defaultBranch: payload.repository.default_branch,
    octokit,
    getFile: toolkit.getFile.bind(toolkit),
    log: toolkit.log
  }

  octokit.hook.error('request', (error) => {
    state.log.info(error.request)
    state.log.fatal(error)
    toolkit.exit.failure(error.message)
  })

  // Avoid loading huuuge diffs for pull requests that don’t create a new tweet file
  const { data: files } = await state.octokit.request('GET /repos/:owner/:repo/pulls/:number/files', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    number: payload.pull_request.number
  })

  const newTweet = files.find(file => file.status === 'added' && /^tweets\/.*\.tweet$/.test(file.filename))

  if (!newTweet) {
    return toolkit.exit.neutral(`Pull request does not include new tweets`)
  }

  state.log(`${files.length} files changed`)

  // We load the pull request diff in order to access the contents of the new tweets from
  // pull requests coming from forks. The action does not have access to that git tree,
  // neither does the action’s token have access to the fork repository
  const { data } = await state.octokit.request('GET /repos/:owner/:repo/pulls/:number', {
    headers: {
      accept: 'application/vnd.github.diff'
    },
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    number: payload.pull_request.number
  })

  const newTweets = parseDiff(data)
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
    head_sha: payload.pull_request.head.sha,
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

        return `### ❌ Invalid

${text}

The above tweet is ${tweet.weightedLength - 280} characters too long`
      }).join('\n\n---\n\n')
    }
  })
}
