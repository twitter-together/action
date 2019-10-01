module.exports = getNewTweets;

const parseDiff = require("parse-diff");
const { parseTweet } = require("twitter-text");

async function getNewTweets({ octokit, toolkit, payload }) {
  toolkit.debug("Retrieving changed files from pull request");

  // Avoid loading huuuge diffs for pull requests that don’t create a new tweet file
  const response = await octokit.request(
    "GET /repos/:owner/:repo/pulls/:number/files",
    {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      number: payload.pull_request.number
    }
  );

  const { data: files } = response;

  toolkit.info(`${files.length} files changed in current pull request`);

  const newTweet = files.find(
    file => file.status === "added" && /^tweets\/.*\.tweet$/.test(file.filename)
  );

  if (!newTweet) {
    toolkit.info("Pull request does not include new tweets");
    process.exit(0);
  }

  toolkit.debug(`New tweet found at ${newTweet.filename}`);
  toolkit.debug(`Retrieving content of new tweet`);

  // We load the pull request diff in order to access the contents of the new tweets from
  // pull requests coming from forks. The action does not have access to that git tree,
  // neither does the action’s token have access to the fork repository
  const { data } = await octokit.request(
    "GET /repos/:owner/:repo/pulls/:number",
    {
      headers: {
        accept: "application/vnd.github.diff"
      },
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      number: payload.pull_request.number
    }
  );

  const result = parseDiff(data)
    .filter(file => file.new && /^tweets\/.*\.tweet$/.test(file.to))
    .map(file => {
      const text = file.chunks[0].changes
        .map(line => line.content.substr(1))
        .join("\n");
      return {
        text,
        ...parseTweet(text)
      };
    });

  toolkit.debug(`New tweet: ${result[0].text}`);

  return result;
}
