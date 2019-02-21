module.exports = getNewTweets

const { readFileSync } = require('fs')

const { parseTweet } = require('twitter-text')

async function getNewTweets (request, payload) {
  const { data: { files } } = await request('GET /repos/:owner/:repo/compare/:base...:head', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    base: payload.before,
    head: payload.after
  })

  console.log(`${files.length} files changed`)

  return files
    .filter(file => file.status === 'added' && /^tweets\/.*\.tweet$/.test(file.filename))
    .map(file => {
      const text = readFileSync(file.filename, 'utf-8').trim()
      return {
        text,
        ...parseTweet(text)
      }
    })
}
