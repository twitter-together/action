const { Toolkit } = require('actions-toolkit')
const { autoLink } = require('twitter-text')

const getNewTweets = require('./lib/get-new-tweets')
const tweet = require('./lib/tweet')

const { getFile, exit, log, context: { payload, ref }, github: octokit } = new Toolkit()
const startedAt = new Date().toISOString()

console.log(`-------- payload -------- `)
console.log(JSON.stringify(payload, null, 2))

main()

async function main () {
  if (!ref) {
    return exit.neutral('GITHUB_REF not set')
  }

  if (!ref.startsWith('refs/heads/')) {
    return exit.neutral(`GITHUB_REF is not a branch: ${ref}`)
  }

  octokit.hook.error('request', (error) => {
    log.error(error)
  })

  const branch = ref.substr('refs/heads/'.length)
  const defaultBranch = payload.repository.default_branch
  const newTweets = await getNewTweets(getFile, octokit.request, payload)

  if (newTweets.length === 0) {
    return exit.neutral('No new tweets')
  }

  if (branch === defaultBranch) {
    log(`"${branch}" is the default branch`)

    for (let i = 0; i < newTweets.length; i++) {
      log(`${i + 1}. ${newTweets[i].text}`)
      try {
        const result = await tweet({
          consumerKey: process.env.TWITTER_CONSUMER_KEY,
          consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
          accessTokenKey: process.env.TWITTER_ACCESS_TOKEN,
          accessTokenSecret: process.env.TWITTER_ACCESS_SECRET,
          tweet: newTweets[i].text
        })

        console.log(`tweeted: ${newTweets[i]}`)
        console.log(`-------- result -------- `)
        console.log(JSON.stringify(result, null, 2))
      } catch (error) {
        log.error(error[0])
      }
    }
    return
  }

  log(`"${branch}" is not the default branch`)

  for (let i = 0; i < newTweets.length; i++) {
    if (newTweets[i].length > 240) {
      exit.failure(`TODO: tweet is too long - create failing status run: ${newTweets[i]}`)
    }
  }

  const isValid = newTweets.find(tweet => tweet.valid)

  await octokit.request('POST /repos/:owner/:repo/check-runs', {
    headers: {
      accept: 'application/vnd.github.antiope-preview+json'
    },
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    name: 'twitter-together',
    head_sha: payload.after,
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

        return `### ❌ Valid

${text}

The above tweet is ${280 - tweet.weightedLength} characters to long`
      }).join('\n\n---\n\n')
    }
  })
}
