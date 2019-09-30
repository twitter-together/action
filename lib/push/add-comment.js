module.exports = addComment;

function addComment(state, body) {
  const {
    context: { payload },
    github: { request }
  } = state.toolkit;

  // add comment with tweet URLs
  // https://developer.github.com/v3/repos/comments/#create-a-commit-comment
  return request("POST /repos/:owner/:repo/commits/:sha/comments", {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    sha: payload.head_commit.id,
    body
  });
}
