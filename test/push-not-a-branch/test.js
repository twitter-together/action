/**
 * This test checks the happy path of a commit to the main branch (master)
 * which includes a new *.tweet file.
 */

const tap = require('tap')

// SETUP
process.env.GITHUB_EVENT_NAME = 'push'
process.env.GITHUB_REF = 'refs/tags/v1.0.0'
process.env.GITHUB_EVENT_PATH = require.resolve('./event.json')

// set other env variables so action-toolkit is happy
process.env.GITHUB_TOKEN = ''
process.env.GITHUB_WORKSPACE = ''
process.env.GITHUB_WORKFLOW = ''
process.env.GITHUB_ACTION = ''
process.env.GITHUB_ACTOR = ''
process.env.GITHUB_REPOSITORY = ''
process.env.GITHUB_SHA = ''

process.on('exit', (code) => {
  tap.equal(code, 78)

  // above code exits with 78 (neutral), but tap expects 0.
  // Tap adds the "process.exitCode" property for that purpose.
  process.exitCode = 0
})

require('../..')
