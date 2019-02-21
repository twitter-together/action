module.exports = getNewTweets

const { parseTweet } = require('twitter-text')

async function getNewTweets (state, payload) {
  const { data: { files } } = await state.octokit.request('GET /repos/:owner/:repo/compare/:base...:head', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    base: state.branch === state.defaultBranch ? payload.before : state.defaultBranch,
    head: payload.after
  })

  state.log(`${files.length} files changed`)
  state.log(files)

  return files
    .filter(file => file.status === 'added' && /^tweets\/.*\.tweet$/.test(file.filename))
    .map(file => {
      const text = state.getFile(file.filename).trim()
      return {
        text,
        ...parseTweet(text)
      }
    })
}
