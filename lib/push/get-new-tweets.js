module.exports = getNewTweets

const { parseTweet } = require('twitter-text')

async function getNewTweets (state) {
  const { context: { payload }, github: { request } } = state.toolkit
  const { data: { files } } = await request('GET /repos/:owner/:repo/compare/:base...:head', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    base: payload.before,
    head: payload.after
  })

  return files
    .filter(file => file.status === 'added' && /^tweets\/.*\.tweet$/.test(file.filename))
    .map(file => {
      const text = state.toolkit.getFile(file.filename).trim()
      return {
        text,
        ...parseTweet(text)
      }
    })
}
