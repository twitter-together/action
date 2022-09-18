const { readFileSync } = require("fs");
const { resolve, basename } = require("path");

const { Octokit } = require("@octokit/action");
const toolkit = require("@actions/core");

const handlePullRequest = require("./pull-request");
const handlePush = require("./push");
const parseTweetFileContent = require("./common/parse-tweet-file-content");
const tweet = require("./common/tweet");

const VERSION = require("../package.json").version;

console.log(`Running twitter-together version ${VERSION}`);

async function main() {
  const state = {
    startedAt: new Date().toISOString(),
    twitterCredentials: {
      consumer_key: process.env.TWITTER_API_KEY,
      consumer_secret: process.env.TWITTER_API_SECRET_KEY,
      access_token_key: process.env.TWITTER_ACCESS_TOKEN,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    },
  };

  // Allow for CLI invocation using `--file tweets/test.tweet`
  if (process.argv.length > 2 && process.argv[2] === "--file") {
    if (!process.argv[3]) throw new Error("No file specified for --file");
    const fileState = {
      ...state,
      dir: resolve(process.argv[3], "..", ".."),
    };

    const payload = readFileSync(resolve(process.argv[3]), "utf8");
    const parsed = parseTweetFileContent(payload, fileState.dir);
    console.log("Parsed tweet:", parsed);
    console.log(await tweet(fileState, parsed, basename(process.argv[3])));
    return;
  }

  // If not given file flag, assume GitHub Action
  const payload = JSON.parse(
    readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")
  );
  const ref = process.env.GITHUB_REF;
  const sha = process.env.GITHUB_SHA;
  const dir = process.env.GITHUB_WORKSPACE;
  const githubState = {
    ...state,
    toolkit,
    octokit: new Octokit(),
    payload,
    ref,
    sha,
    dir,
  };

  switch (process.env.GITHUB_EVENT_NAME) {
    case "push":
      await handlePush(githubState);
      break;
    case "pull_request":
      await handlePullRequest(githubState);
      break;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
