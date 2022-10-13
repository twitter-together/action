module.exports = createCheckRun;

const { autoLink } = require("twitter-text");
const path = require("path");

const parseTweetFileContent = require("../common/parse-tweet-file-content");

async function createCheckRun(
  { octokit, payload, startedAt, toolkit, dir },
  newTweets
) {
  const parsedTweets = newTweets.map((rawTweet) => {
    try {
      return parseTweetFileContent(rawTweet, dir);
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
        summary: parsedTweets
          .map((tweet) => tweetToCheckRunSummary(tweet, payload, false))
          .join("\n\n---\n\n"),
      },
    }
  );

  toolkit.info(`check run created: ${response.data.html_url}`);
}

function tweetToCheckRunSummary(tweet, payload, threading) {
  let text = !tweet.text
    ? ""
    : autoLink(tweet.text)
        .replace(/(^|\n)/g, "$1> ")
        .replace(/(^|\n)> (\n|$)/g, "$1>$2");

  if (!tweet.valid)
    return `### ❌ Invalid\n\n${text}\n\n${tweet.error || "Unknown error"}`;

  if (tweet.poll)
    text +=
      "\n\nThe tweet includes a poll:\n\n> 🔘 " + tweet.poll.join("\n> 🔘 ");

  if (tweet.reply) text = `Replying to ${tweet.reply}\n\n${text}`;

  if (tweet.retweet) text = `Retweeting ${tweet.retweet}\n\n${text}`.trim();

  if (tweet.media.length) {
    const media = tweet.media
      .map(({ file, alt }) => {
        const fileName = path.basename(file);
        const url = `https://raw.githubusercontent.com/${payload.repository.owner.login}/${payload.repository.name}/${payload.after}/media/${fileName}`;
        return `${alt}\n<img src="${url}" height="200" />`;
      })
      .join("\n\n");
    text = `Uploading media:\n\n${media}\n\n${text}`.trim();
  }

  if (tweet.thread || threading) {
    let cells = `\n<tr><td>\n\n${text}\n\n</td></tr>`;
    if (tweet.thread)
      cells += `${tweetToCheckRunSummary(tweet.thread, payload, true)}`;
    return threading ? cells : `### ✅ Valid\n\n<table>${cells}\n</table>`;
  }

  return `### ✅ Valid\n\n${text}`;
}
