/**
 * This test checks the happy path of pull request adding a new *.tweet file
 */

const nock = require('nock')
const tap = require('tap')

// SETUP
process.env.GITHUB_EVENT_NAME = 'pull_request'
process.env.GITHUB_TOKEN = 'secret123'
process.env.GITHUB_EVENT_PATH = require.resolve('./event.json')

// set other env variables so action-toolkit is happy
process.env.GITHUB_REF = ''
process.env.GITHUB_WORKSPACE = ''
process.env.GITHUB_WORKFLOW = ''
process.env.GITHUB_ACTION = ''
process.env.GITHUB_ACTOR = ''
process.env.GITHUB_REPOSITORY = ''
process.env.GITHUB_SHA = ''

process.on('exit', (code) => {
  tap.equal(code, 78)
  tap.deepEqual(nock.pendingMocks(), [])

  // above code exits with 78 (neutral), but tap expects 0.
  // Tap adds the "process.exitCode" property for that purpose.
  process.exitCode = 0
})

require('../..')
