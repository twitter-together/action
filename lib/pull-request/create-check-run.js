module.exports = createCheckRun;

const { autoLink } = require("twitter-text");

async function createCheckRun(
  { octokit, payload, startedAt, toolkit },
  newTweets
) {
  const allTweetsValid = newTweets.every(tweet => tweet.valid);

  // Check runs cannot be created if the pull request was created by a fork,
  // so we just log out the result.
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#permissions-for-the-github_token
  if (payload.repository.fork) {
    for (const tweet of newTweets) {
      if (tweet.valid) {
        toolkit.info(`### ✅ Valid

${tweet.text}`);
      } else {
        toolkit.info(`### ❌ Invalid

${tweet.text}

The above tweet is ${tweet.weightedLength - 280} characters too long`);
      }
    }
    process.exit(allTweetsValid ? 0 : 1);
  }

  const response = await octokit.request(
    "POST /repos/:owner/:repo/check-runs",
    {
      headers: {
        accept: "application/vnd.github.antiope-preview+json"
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
        title: `${newTweets.length} tweet(s)`,
        summary: newTweets
          .map(tweet => {
            const text = autoLink(tweet.text).replace(/(^|\n)/g, "$1> ");

            if (tweet.valid) {
              return `### ✅ Valid

${text}`;
            }

            return `### ❌ Invalid

${text}

The above tweet is ${tweet.weightedLength - 280} characters too long`;
          })
          .join("\n\n---\n\n")
      }
    }
  );

  toolkit.info(`check run created: ${response.data.html_url}`);
}
