const { Toolkit } = require('actions-toolkit')

const toolkit = new Toolkit({
  event: ['push', 'pull_request.opened', 'pull_request.synchronize']
})

const handlePullRequest = require('./lib/handle-pull-request')
const handlePush = require('./lib/handle-push')

switch (toolkit.context.event) {
  case 'push':
    handlePush(toolkit)
    break
  case 'pull_request':
    handlePullRequest(toolkit)
    break
}
