module.exports = getNewTweets

const { parseTweet } = require('twitter-text')

async function getNewTweets (state, options) {
  const { data: { files } } = await state.octokit.request('GET /repos/:owner/:repo/compare/:base...:head', options)

  state.toolkit.log(`${files.length} files changed`)
  state.toolkit.log(files)

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
