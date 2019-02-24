module.exports = isSetupDone

const fs = require('fs')
const { resolve: resolvePath } = require('path')

function isSetupDone (state) {
  const tweetsFolderPath = resolvePath(state.toolkit.workspace, 'tweets')
  return new Promise(resolve => {
    fs.stat(tweetsFolderPath, (error, stat) => {
      if (error) {
        return resolve(false)
      }

      resolve(stat.isDirectory())
    })
  })
}
