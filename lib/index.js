const { readFileSync } = require("fs");

const { Octokit } = require("@octokit/core");
const { createActionAuth } = require("@octokit/auth-action");
const toolkit = require("@actions/core");

const handlePullRequest = require("./pull-request");
const handlePush = require("./push");

main();

async function main() {
  const octokit = new Octokit({
    auth: createActionAuth()
  });

  const payload = JSON.parse(
    readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")
  );
  const ref = process.env.GITHUB_REF;
  const sha = process.env.GITHUB_SHA;

  const state = {
    toolkit,
    octokit,
    payload,
    ref,
    sha,
    startedAt: new Date().toISOString(),
    twitterCredentials: {
      consumer_key: process.env.TWITTER_API_KEY,
      consumer_secret: process.env.TWITTER_API_SECRET_KEY,
      access_token_key: process.env.TWITTER_ACCESS_TOKEN,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    }
  };

  switch (process.env.GITHUB_EVENT_NAME) {
    case "push":
      await handlePush(state);
      break;
    case "pull_request":
      await handlePullRequest(state);
      break;
  }
}
