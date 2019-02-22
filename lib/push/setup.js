module.exports = setup

const fs = require('fs').promises

const TWEETS_FOLDER_NAME = 'tweets'

async function setup (state) {
  const { log, exit, context: { payload }, github: { request } } = state.toolkit

  log.info(`Checking if "twitter-together-setup" branch already exists`)

  // TODO: check if branch/PR already exists
  try {
    // Check if "twitter-together-setup" branch exists
    // https://developer.github.com/v3/git/refs/#get-a-reference
    await request('HEAD /repos/:owner/:repo/git/refs/:ref', {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      ref: 'heads/twitter-together-setup'
    })
    return exit.neutral('"twitter-together-setup" branch already exists')
  } catch (error) {
    log.info('"twitter-together-setup" branch does not yet exist')
  }

  const readmeContent = await fs.readFile(`tweets/README.md`)

  // Get last commit of default branch
  // https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
  const { data: [{ sha }] } = await request('GET /repos/:owner/:repo/commits', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    sha: payload.repository.default_branch,
    per_page: 1
  })

  log.info(`Latest commit sha: "${sha}"`)

  // Create the "twitter-together-setup" branch
  // https://developer.github.com/v3/git/refs/#create-a-reference
  await request('POST /repos/:owner/:repo/git/refs', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    ref: 'refs/heads/twitter-together-setup',
    sha
  })

  log.info(`"twitter-together-setup" branch created`)

  // Create tweets/README.md file
  // https://developer.github.com/v3/repos/contents/#create-a-file
  await request('PUT /repos/:owner/:repo/contents/:path', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    path: `tweets-nanana/README.md`,
    content: readmeContent.toString('base64'),
    branch: 'twitter-together-setup',
    message: 'twitter-together setup'
  })

  log.info(`"tweets-nanana/README.md" created in "twitter-together-setup" branch`)

  // Create pull request
  // https://developer.github.com/v3/pulls/#create-a-pull-request
  const { data: pr } = await request('POST /repos/:owner/:repo/pulls', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    title: '🐦 twitter-together setup',
    body: `This pull requests creates the \`tweets-nanana/\` folder where your \`*.tweet\` files go into. It also creates the \`tweets-nanana/README.md\` file with instructions. Enjoy!`,
    head: 'twitter-together-setup',
    base: payload.repository.default_branch
  })

  log.info(`Setup pull request created: ${pr.html_url}`)
}
