module.exports = createCheckRun;

const { autoLink } = require("twitter-text");

async function createCheckRun(
  { octokit, toolkit, payload, startedAt },
  newTweets
) {
  const allTweetsValid = newTweets.every(tweet => tweet.valid);

  toolkit.debug(`Are all tweets valid? ${allTweetsValid ? "yes" : "no"}`);
  toolkit.debug("Creating check run");

  const { data } = await octokit.request(
    "POST /repos/:owner/:repo/check-runs",
    {
      headers: {
        accept: "application/vnd.github.antiope-preview+json"
      },
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      name: "Preview",
      head_sha: payload.pull_request.head.sha,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      status: "completed",
      conclusion: allTweetsValid ? "success" : "failure",
      output: {
        title: `Preview: ${newTweets.length} tweet(s)`,
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

  toolkit.debug(`Checkrun created: ${data.html_url}`);
  toolkit.debug(JSON.stringify(data, null, 2));
}
