module.exports = createCheckRun;

const { autoLink } = require("twitter-text");

const parseTweetFileContent = require("../common/parse-tweet-file-content");

async function createCheckRun(
  { octokit, payload, startedAt, toolkit },
  newTweets
) {
  const parsedTweets = newTweets.map((rawTweet) => {
    try {
      return parseTweetFileContent(rawTweet);
    } catch (error) {
      return {
        error: error.message,
        valid: false,
        text: rawTweet,
      };
    }
  });

  const allTweetsValid = parsedTweets.every((tweet) => tweet.valid);

  // Check runs cannot be created if the pull request was created by a fork,
  // so we just log out the result.
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#permissions-for-the-github_token
  if (payload.pull_request.head.repo.fork) {
    for (const tweet of parsedTweets) {
      if (tweet.valid) {
        toolkit.info(`### ✅ Valid\n\n${tweet.text}`);
      } else {
        toolkit.info(
          `### ❌ Invalid\n\n${tweet.text}\n\n${tweet.error || "Unknown error"}`
        );
      }
    }
    process.exit(allTweetsValid ? 0 : 1);
  }

  const response = await octokit.request(
    "POST /repos/:owner/:repo/check-runs",
    {
      headers: {
        accept: "application/vnd.github.antiope-preview+json",
      },
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      name: "preview",
      head_sha: payload.pull_request.head.sha,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      status: "completed",
      conclusion: allTweetsValid ? "success" : "failure",
      output: {
        title: `${parsedTweets.length} tweet(s)`,
        summary: parsedTweets.map(tweetToCheckRunSummary).join("\n\n---\n\n"),
      },
    }
  );

  toolkit.info(`check run created: ${response.data.html_url}`);
}

function tweetToCheckRunSummary(tweet) {
  let text = autoLink(tweet.text)
    .replace(/(^|\n)/g, "$1> ")
    .replace(/(^|\n)> (\n|$)/g, "$1>$2");

  if (!tweet.valid)
    return `### ❌ Invalid\n\n${text}\n\n${tweet.error || "Unknown error"}`;

  if (tweet.poll)
    text +=
      "\n\nThe tweet includes a poll:\n\n> 🔘 " + tweet.poll.join("\n> 🔘 ");
  return `### ✅ Valid\n\n${text}`;
}
