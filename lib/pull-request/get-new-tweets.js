module.exports = getNewTweets;

const EOL = require("os").EOL;

const parseDiff = require("parse-diff");
const { parseTweet } = require("twitter-text");

async function getNewTweets({ octokit, toolkit, payload }) {
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

  const newTweet = files.find(
    file => file.status === "added" && /^tweets\/.*\.tweet$/.test(file.filename)
  );

  if (!newTweet) {
    toolkit.info("Pull request does not include new tweets");
    process.exit(0);
  }

  toolkit.info(`${files.length} files changed`);

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

  const newTweets = parseDiff(data)
    .filter(file => file.new && /^tweets\/.*\.tweet$/.test(file.to))
    .map(file => {
      const tweetFileContent = file.chunks[0].changes
        .map(line => line.content.substr(1))
        .join("\n");

      return parseTweetFileContent(tweetFileContent);
    });

  toolkit.info(`New tweets found: ${newTweets.length}`);
  return newTweets;
}

function parseTweetFileContent(text) {
  const pollOptions = [];
  let lastLine;
  while ((lastLine = getlastLineMatchingPollOption(text))) {
    pollOptions.push(lastLine.replace(/\( \)\s+/, ""));
    text = withLastLineRemoved(text);
  }

  return {
    poll: pollOptions.length ? pollOptions.reverse() : null,
    text,
    ...parseTweet(text)
  };
}

function getlastLineMatchingPollOption(text) {
  const lines = text.trim().split(EOL);
  const [lastLine] = lines.reverse();
  return /^\( \) /.test(lastLine) ? lastLine : null;
}

function withLastLineRemoved(text) {
  const lines = text.trim().split(EOL);
  return lines
    .slice(0, lines.length - 1)
    .join(EOL)
    .trim();
}
