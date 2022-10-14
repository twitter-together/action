// TODO REFACTOR HIS

module.exports = createCheckRun;

const { autoLink } = require("twitter-text");

const parseTweetFileContent = require("../common/parse-tweet-file-content");
const updateIssue = require("../common/update-issue");

async function createCheckRun(
  { octokit, payload, startedAt, toolkit, dir, trigger, comments },
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

  // Check runs cannot be created if the pull request was created by a fork
  // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#permissions-for-the-github_token

  // fallback to a text only log if we are not posting markdown comments (strip HTML)
  const textOnly =
    payload.pull_request.head.repo.fork && trigger === "pull_request";

  const summary = parsedTweets
    .map((tweet) => tweetToCheckRunSummary({ tweet, payload, dir, textOnly }))
    .join("\n\n---\n\n");

  const body = `## Found ${parsedTweets.length} new \`.tweet\` file(s)\n\n${summary}`;

  if (textOnly) {
    toolkit.info(body);
  } else if (comments) {
    await updateIssue({ octokit, payload, body });
  }

  // exit before the check run if we've posted a comment or cannot do the check run

  if (payload.pull_request.head.repo.fork || comments) {
    process.exit(allTweetsValid ? 0 : 1);
  } else if (comments) {
    // make a comment if we can
    await updateIssue({ octokit, payload, body });
  }

  const response = await octokit.request(
    "POST /repos/:owner/:repo/check-runs",
    {
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
        summary,
      },
    }
  );

  toolkit.info(`check run created: ${response.data.html_url}`);
}

function tweetToCheckRunSummary(state, threading = false) {
  const { tweet, payload, dir, textOnly } = state;

  if (!tweet.valid)
    return `### ❌ Invalid Tweet\n\n\`\`\`tweet\n${tweet.text}\n\`\`\`\n\n**${
      tweet.error || "Unknown error"
    }**`;

  let text = !tweet.text
    ? ""
    : autoLink(tweet.text)
        .replace(/(^|\n)/g, "$1> ")
        .replace(/(^|\n)> (\n|$)/g, "$1>$2");

  if (tweet.poll) text = `- ${tweet.poll.join("\n- ")}\n\n${text}`;

  if (tweet.reply) text = `Replying to ${tweet.reply}\n\n${text}`;

  if (tweet.retweet) text = `Retweeting ${tweet.retweet}\n\n${text}`.trim();

  if (tweet.media.length) {
    const media = tweet.media
      .map(({ file, alt }) => {
        const fileName = file.replace(dir, "");
        if (textOnly) {
          return `- ${fileName} [${alt}]`;
        } else {
          const { repo, sha } = payload.pull_request.head;
          return `${alt}\n<img src="https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${sha}${fileName}" height="200" />`;
        }
      })
      .join(textOnly ? "\n" : "\n\n");
    text = `${media}\n\n${text}`.trim();
  }

  if (tweet.thread || threading) {
    const count = threading ? threading + 1 : 1;
    let thread = `\n\n#### --- 🧵 ${count} ---\n\n${text}`;
    if (tweet.thread)
      thread += tweetToCheckRunSummary(
        { ...state, tweet: tweet.thread },
        count
      );
    return threading ? thread : `### ✅ Valid Thread${thread}`;
  }

  return `### ✅ Valid Tweet\n\n${text}`;
}
