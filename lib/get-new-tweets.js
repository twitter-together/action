module.exports = getNewTweets

const { readFileSync } = require('fs')

async function getNewTweets (request, payload) {
  const requestOptions = request.endpoint('GET /repos/:owner/:repo/compare/:base...:head', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    base: payload.before,
    head: payload.after
  })

  console.log(`-------- requestOptions -------- `)
  console.log(JSON.stringify(requestOptions, null, 2))

  const { data: { files } } = await request(requestOptions)

  return files
    .filter(file => file.status === 'added' && /^tweets\/.*\.tweet$/.test(file.filename))
    .map(file => readFileSync(file.filename, 'utf-8'))
}
