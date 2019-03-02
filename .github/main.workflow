workflow "Tweet on push to default branch" {
  on = "push"
  resolves = ["Tweet"]
}

action "Tweet" {
  uses = "./" # use itself :)
  secrets = ["GITHUB_TOKEN", "TWITTER_API_KEY", "TWITTER_API_SECRET_KEY", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_TOKEN_SECRET"]
}

# "push" event won’t work on forks, hence the 2nd workflow with "pull_request"
workflow "Preview and validate tweets on pull requests" {
  on = "pull_request"
  resolves = ["Preview"]
}

action "Preview" {
  uses = "./" # use itself :)
  secrets = ["GITHUB_TOKEN"]
}

workflow "Test" {
  on = "push"
  resolves = ["npm test"]
}

action "npm ci" {
  uses = "docker://node:alpine"
  runs = "npm"
  args = "ci"
}

action "npm test" {
  needs = "npm ci"
  uses = "docker://node:alpine"
  runs = "npm"
  args = "test"
}

workflow "Release" {
  on = "push"
  resolves = ["npx semantic-release"]
}

action "filter: master branch" {
  needs = "npm test"
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "npx semantic-release" {
  needs = "filter: master branch"
  uses = "docker://node:alpine"
  runs = "npx"
  args = "semantic-release"
}
