workflow "Tweet on push to default branch" {
  on = "push"
  resolves = ["Tweet"]
}

action "Tweet" {
  uses = "./" # use itself :)
  secrets = ["GITHUB_TOKEN", "TWITTER_CONSUMER_KEY", "TWITTER_CONSUMER_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_SECRET"]
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
