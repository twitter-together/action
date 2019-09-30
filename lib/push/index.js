module.exports = handlePush;

const addComment = require("./add-comment");
const getNewTweets = require("./get-new-tweets");
const isSetupDone = require("./is-setup-done");
const setup = require("./setup");
const tweet = require("./tweet");

async function handlePush(toolkit) {
  const state = {
    toolkit,
    twitterCredentials: {
      consumer_key: process.env.TWITTER_API_KEY,
      consumer_secret: process.env.TWITTER_API_SECRET_KEY,
      access_token_key: process.env.TWITTER_ACCESS_TOKEN,
      access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    }
  };
  const {
    exit,
    log,
    context: { payload, ref },
    github: { hook }
  } = toolkit;

  // ignore builds from tags
  if (!ref.startsWith("refs/heads/")) {
    return exit.neutral(`GITHUB_REF is not a branch: ${ref}`);
  }

  // ignore builds from branches other than the repository’s defaul branch
  const defaultBranch = payload.repository.default_branch;
  const branch = process.env.GITHUB_REF.substr("refs/heads/".length);
  if (branch !== defaultBranch) {
    return exit.neutral(`"${branch}" is not the default branch`);
  }

  // on request errors, log the requset options and error, then end process
  hook.error("request", (error, options) => {
    if (options.request.expectStatus === error.status) {
      throw error;
    }

    log.info(error.request);
    log.fatal(error);
    exit.failure(error.message);
  });

  // make sure repository is already setup
  if (!(await isSetupDone(state))) {
    log.info("tweets/ folder does not yet exist. Starting setup");
    return setup(state);
  }

  // find tweets
  const newTweets = await getNewTweets(state);
  if (newTweets.length === 0) {
    return exit.neutral("No new tweets");
  }

  // post all the tweets
  const tweetUrls = [];
  const tweetErrors = [];
  for (let i = 0; i < newTweets.length; i++) {
    log(`Tweeting: ${newTweets[i].text}`);
    try {
      const result = await tweet(state, newTweets[i].text);

      log(`tweeted: ${result.url}`);
      tweetUrls.push(result.url);
    } catch (error) {
      tweetErrors.push(error[0]);
    }
  }

  if (tweetUrls.length) {
    await addComment(state, "Tweeted:\n\n- " + tweetUrls.join("\n- "));
  }

  if (tweetErrors.length) {
    tweetErrors.forEach(log.error);
    await addComment(
      state,
      "Errors:\n\n- " + tweetErrors.map(error => error.message).join("\n- ")
    );
    return exit.failure("Error tweeting");
  }
}
