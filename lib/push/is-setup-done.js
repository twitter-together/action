module.exports = isSetupDone;

const fs = require("fs");
const { resolve: resolvePath } = require("path");

function isSetupDone() {
  const tweetsFolderPath = resolvePath(process.env.GITHUB_WORKSPACE, "tweets");
  return new Promise((resolve) => {
    fs.stat(tweetsFolderPath, (error, stat) => {
      if (error) {
        return resolve(false);
      }

      resolve(stat.isDirectory());
    });
  });
}
