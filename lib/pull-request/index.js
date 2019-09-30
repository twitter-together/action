module.exports = handlePullRequest;

const getNewTweets = require("./get-new-tweets");
const createCheckRun = require("./create-check-run");

async function handlePullRequest(toolkit) {
  const state = {
    startedAt: new Date().toISOString(),
    toolkit
  };

  // ignore builds from branches other than the repository’s defaul branch
  const base = toolkit.context.payload.pull_request.base.ref;
  const defaultBranch = toolkit.context.payload.repository.default_branch;
  if (defaultBranch !== base) {
    return toolkit.exit.neutral(
      `Pull request base "${base}" is not the repository’s default branch`
    );
  }

  // on request errors, log the requset options and error, then end process
  toolkit.github.hook.error("request", error => {
    toolkit.log.info(error.request);
    toolkit.log.fatal(error);
    toolkit.exit.failure(error.message);
  });

  const newTweets = await getNewTweets(state);
  await createCheckRun(state, newTweets);
}
