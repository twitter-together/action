module.exports = createCheckRun;

async function createCheckRun(
  { payload, startedAt, octokit, toolkit },
  summary
) {
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
      conclusion: summary.valid ? "success" : "failure",
      output: {
        title: `${summary.count} tweet(s)`,
        summary: summary.body,
      },
    }
  );
  toolkit.info(`check run created: ${response.data.html_url}`);
}
