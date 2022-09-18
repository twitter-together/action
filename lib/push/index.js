module.exports = handlePush;

const { inspect } = require("util");

const addComment = require("./add-comment");
const getNewTweets = require("./get-new-tweets");
const isSetupDone = require("./is-setup-done");
const setup = require("./setup");
const tweet = require("../common/tweet");

const parseTweetFileContent = require("../common/parse-tweet-file-content");

async function handlePush(state) {
  const { toolkit, octokit, payload, ref } = state;

  // ignore builds from tags
  if (!ref.startsWith("refs/heads/")) {
    toolkit.info(`GITHUB_REF is not a branch: ${ref}`);
    return;
  }

  // ignore builds from branches other than the repository’s defaul branch
  const defaultBranch = payload.repository.default_branch;
  const branch = process.env.GITHUB_REF.substr("refs/heads/".length);
  if (branch !== defaultBranch) {
    toolkit.info(`"${branch}" is not the default branch`);
    return;
  }

  // on request errors, log the requset options and error, then end process
  octokit.hook.error("request", (error, options) => {
    if (options.request.expectStatus === error.status) {
      throw error;
    }

    toolkit.info(error);
    toolkit.setFailed(error.stack);
    process.exit();
  });

  // make sure repository is already setup
  if (!(await isSetupDone())) {
    toolkit.info("tweets/ folder does not yet exist. Starting setup");
    return setup(state);
  }

  // find tweets
  const newTweets = await getNewTweets(state);
  if (newTweets.length === 0) {
    toolkit.info("No new tweets");
    return;
  }

  // post all the tweets
  const tweetUrls = [];
  const tweetErrors = [];
  for (let i = 0; i < newTweets.length; i++) {
    try {
      const parsed = parseTweetFileContent(newTweets[i].text, state.dir);

      toolkit.info(`Tweeting: ${parsed.text}`);
      if (parsed.poll) {
        toolkit.info(
          `Tweet has poll with ${
            parsed.poll.length
          } options: ${parsed.poll.join(", ")}`
        );
      }

      let result = await tweet(state, parsed, newTweets[i].filename);
      while (result) {
        toolkit.info(`tweeted: ${result.url}`);
        tweetUrls.push(result.url);
        result = result.thread;
      }
    } catch (error) {
      console.log(`error`);
      console.log(error[0] || error);
      tweetErrors.push(error[0] || error);
    }
  }

  if (tweetUrls.length) {
    await addComment(state, "Tweeted:\n\n- " + tweetUrls.join("\n- "));
  }

  if (tweetErrors.length) {
    tweetErrors.forEach((error) => toolkit.error(inspect(error)));
    await addComment(
      state,
      "Errors:\n\n- " + tweetErrors.map((error) => error.message).join("\n- ")
    );
    return toolkit.setFailed("Error tweeting");
  }
}
