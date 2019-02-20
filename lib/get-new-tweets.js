module.exports = getNewTweets

const { readFileSync } = require('fs')

async function getNewTweets (request, payload) {
  const options = {
    owner: payload.repository.owner.login,
    repo: payload.repository.name
  }
  const requestOptions = payload.commits.length === 1
    ? request.endpoint('GET /repos/:owner/:repo/git/commits/:commit_sha', {
      ...options,
      commit_sha: payload.commits[0].id
    })
    : request.endpoint('GET /repos/:owner/:repo/compare/:base...:head', {
      ...options,
      base: payload.before,
      head: payload.after
    })

  // const { data: { files } } = await request(requestOptions)
  const { data: { files } } = {
    data: {
      files: [{
        status: 'added',
        filename: 'tweets/hello-world.tweet'
      }]
    }
  }

  return files
    .filter(file => file.status === 'added' && /^tweets\/.*\.tweet$/.test(file.filename))
    .map(file => readFileSync(file.filename, 'utf-8'))
}
