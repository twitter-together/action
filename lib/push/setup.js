module.exports = setup;

async function setup({ toolkit, octokit, payload, sha }) {
  toolkit.info('Checking if "twitter-together-setup" branch exists already');

  try {
    // Check if "twitter-together-setup" branch exists
    // https://developer.github.com/v3/git/refs/#get-a-reference
    await octokit.request("HEAD /repos/:owner/:repo/git/refs/:ref", {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      ref: "heads/twitter-together-setup",
      request: {
        expectStatus: 404,
      },
    });

    // If it does, the script assumes that the setup pull requset already exists
    // and stops here
    return toolkit.info('"twitter-together-setup" branch already exists');
  } catch (error) {
    toolkit.info('"twitter-together-setup" branch does not yet exist');
  }

  // Create the "twitter-together-setup" branch
  // https://developer.github.com/v3/git/refs/#create-a-reference
  await octokit.request("POST /repos/:owner/:repo/git/refs", {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    ref: "refs/heads/twitter-together-setup",
    sha,
  });
  toolkit.info('"twitter-together-setup" branch created');

  // Create tweets/README.md from same file in gr2m/twitter-together repo
  // https://developer.github.com/v3/repos/contents/#get-contents
  const { data: readmeContent } = await octokit.request(
    "GET /repos/:owner/:repo/contents/:path",
    {
      mediaType: {
        format: "raw",
      },
      owner: "gr2m",
      repo: "twitter-together",
      path: "tweets/README.md",
    }
  );
  // https://developer.github.com/v3/repos/contents/#create-or-update-a-file
  await octokit.request("PUT /repos/:owner/:repo/contents/:path", {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    path: "tweets/README.md",
    content: Buffer.from(readmeContent).toString("base64"),
    branch: "twitter-together-setup",
    message: "twitter-together setup",
  });
  toolkit.info('"tweets/README.md" created in "twitter-together-setup" branch');

  // Create pull request
  // https://developer.github.com/v3/pulls/#create-a-pull-request
  const { data: pr } = await octokit.request("POST /repos/:owner/:repo/pulls", {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    title: "🐦 twitter-together setup",
    body: `This pull request creates the \`tweets/\` folder where your \`*.tweet\` files go into. It also creates the \`tweets/README.md\` file with instructions.

Note that if you plan to support tweets with polls, your app has to be approved for Twitter's Ads API. See [the Ads API Application Form](https://github.com/gr2m/twitter-together/blob/main/docs/03-apply-for-access-to-the-twitter-ads-api.md) documentation for more details.

Enjoy!`,
    head: "twitter-together-setup",
    base: payload.repository.default_branch,
  });
  toolkit.info(`Setup pull request created: ${pr.html_url}`);
}
