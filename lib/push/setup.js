module.exports = setup

const fs = require('fs').promises

const TWEETS_FOLDER_NAME = 'tweets'

async function setup (state) {
  const { log, exit, context: { payload }, github: { request } } = state.toolkit

  log.info(`${TWEETS_FOLDER_NAME}/ folder does not yet exist. Creating setup pull request`)

  // TODO: check if branch/PR already exists
  try {
    // https://developer.github.com/v3/git/refs/#get-a-reference
    await request('HEAD /repos/:owner/:repo/git/refs/:ref', {
      ref: 'heads/twitter-together-setup'
    })
  } catch (error) {
    return exit.neutral('branch "twitter-together-setup" already exists')
  }

  const readmeContent = fs.readFile(`${TWEETS_FOLDER_NAME}/README.md`, 'utf8')

  // https://developer.github.com/v3/repos/contents/#create-a-file
  await request('PUT /repos/:owner/:repo/contents/:path', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    path: `${TWEETS_FOLDER_NAME}/README.md`,
    content: readmeContent,
    branch: 'twitter-together-setup',
    message: 'twitter-together setup'
  })

  // https://developer.github.com/v3/pulls/#create-a-pull-request
  const { data: pr } = await request('PUT /repos/:owner/:repo/contents/:path', {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    title: '🐦 twitter-together setup',
    body: `This pull requests creates the \`${TWEETS_FOLDER_NAME}/\` folder where your \`*.tweet\` files go into. It also creates the \`tweets/README.md\` file with instructions. Enjoy!`,
    head: 'twitter-together',
    base: payload.repository.default_branch
  })

  log.info(`Setup pull request created: ${pr.html_url}`)
}
