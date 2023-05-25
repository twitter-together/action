module.exports = handlePullRequest;

const createCheckRun = require("./create-check-run");
const createComment = require("./create-comment");
const generateSummary = require("./generate-summary");

const CHECK = "check";
const LOG = "log";
const COMMENT = "comment";

async function handlePullRequest(state) {
  const { octokit, toolkit, payload, trigger, enableComments } = state;

  // ignore builds from branches other than the repository’s default branch
  const base = payload.pull_request.base.ref;
  const defaultBranch = payload.repository.default_branch;
  const fork = !!payload.pull_request.head.repo.fork;

  if (defaultBranch !== base) {
    return toolkit.info(
      `Pull request base "${base}" is not the repository’s default branch`
    );
  }

  // on request errors, log the requset options and error, then end process
  octokit.hook.error("request", (error) => {
    toolkit.info(error);
    toolkit.setFailed(error.stack);
    process.exit();
  });

  // default report type, for `pull_request` non-fork PRs
  let reportType = CHECK;
  // can only log the output for fork PRs without check run permissions
  if (fork && trigger === "pull_request") {
    reportType = LOG;
  }
  // assume use of comments for `pull_request_target` PRs
  // optional: use comments instead of check runs for `pull_request`
  if (trigger === "pull_request_target" || enableComments) {
    reportType = COMMENT;
  }

  const summary = await generateSummary(state, reportType === LOG);

  if (reportType === LOG) {
    toolkit.info(summary.body);
    process.exit(summary.valid ? 0 : 1);
  }
  if (reportType === COMMENT) {
    await createComment(state, summary);
    process.exit(summary.valid ? 0 : 1);
  }
  if (reportType === CHECK) {
    await createCheckRun(state, summary);
  }
}
