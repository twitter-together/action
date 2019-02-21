workflow "Tweet on push to master" {
  on = "push"
  resolves = ["Tweet"]
}

action "Tweet" {
  uses = "./" # use itself :)
  secrets = ["GITHUB_TOKEN", "TWITTER_CONSUMER_KEY", "TWITTER_CONSUMER_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_SECRET"]
}
