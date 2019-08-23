module.exports = getNewTweets

const parseDiff = require('parse-diff')
const { parseTweet } = require('twitter-text')

async function getNewTweets (state) {
  const { exit, log, context: { payload }, github: { request } } = state.toolkit

  // Avoid loading huuuge diffs for pull requests that don’t create a new tweet file
  const { data: files } = await request('GET /repos/:owner/:repo/pulls/:number/files', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    number: payload.pull_request.number
  })

  const newTweet = files.find(file => file.status === 'added' && /^tweets\/.*\.tweet$/.test(file.filename))

  if (!newTweet) {
    return exit.neutral('Pull request does not include new tweets')
  }

  log(`${files.length} files changed`)

  // We load the pull request diff in order to access the contents of the new tweets from
  // pull requests coming from forks. The action does not have access to that git tree,
  // neither does the action’s token have access to the fork repository
  const { data } = await request('GET /repos/:owner/:repo/pulls/:number', {
    headers: {
      accept: 'application/vnd.github.diff'
    },
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    number: payload.pull_request.number
  })

  return parseDiff(data)
    .filter(file => file.new && /^tweets\/.*\.tweet$/.test(file.to))
    .map(file => {
      const text = file.chunks[0].changes.map(line => line.content.substr(1)).join('\n')
      return {
        text,
        ...parseTweet(text)
      }
    })
}
