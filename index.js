const { Toolkit } = require('actions-toolkit')
const { autoLink } = require('twitter-text')

const getNewTweets = require('./lib/get-new-tweets')
const tweet = require('./lib/tweet')

const { context: { payload }, github: octokit } = new Toolkit()
const startedAt = new Date().toISOString()

console.log(`-------- payload -------- `)
console.log(JSON.stringify(payload, null, 2))

main()

async function main () {
  if (!process.env.GITHUB_REF) {
    console.log('GITHUB_REF not set')
    return
  }

  if (!process.env.GITHUB_REF.startsWith('refs/heads/')) {
    console.log(`GITHUB_REF is not a branch: ${process.env.GITHUB_REF}`)
    return
  }

  octokit.hook.error('request', (error) => {
    console.error(error)
  })

  const branch = process.env.GITHUB_REF.substr('refs/heads/'.length)
  const defaultBranch = payload.repository.default_branch
  const newTweets = await getNewTweets(octokit.request, payload)

  if (newTweets.length === 0) {
    console.log('No new tweets')
    return
  }

  if (branch === defaultBranch) {
    console.log(`"${branch}" is the default branch`)

    for (let i = 0; i < newTweets.length; i++) {
      console.log(`1st tweet: ${newTweets[i]}`)
      try {
        const result = await tweet({
          consumerKey: process.env.TWITTER_CONSUMER_KEY,
          consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
          accessTokenKey: process.env.TWITTER_ACCESS_TOKEN,
          accessTokenSecret: process.env.TWITTER_ACCESS_SECRET,
          tweet: newTweets[i]
        })

        console.log(`tweeted: ${newTweets[i]}`)
        console.log(`-------- result -------- `)
        console.log(JSON.stringify(result, null, 2))
      } catch (error) {
        console.error(error[0])
      }
    }
  }

  console.log(`"${branch}" is not the default branch`)

  for (let i = 0; i < newTweets.length; i++) {
    if (newTweets[i].length > 240) {
      console.log(`TODO: tweet is too long - create failing status run: ${newTweets[i]}`)
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
