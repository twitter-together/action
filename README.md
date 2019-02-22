<h1 align="center">Twitter, together!</h1>

<p align="center">
  <a href="https://travis-ci.com/gr2m/twitter-together" rel="nofollow"><img alt="Build Status" src="https://travis-ci.com/gr2m/twitter-together.svg?branch=master"></a>
  <a href="https://greenkeeper.io/" rel="nofollow"><img src="https://badges.greenkeeper.io/gr2m/twitter-together.svg" alt="Greenkeeper badge"></a>
</p>

<p align="center">A GitHub action to tweet together using pull requests</p>

Bigger open source projects often time have their own twitter accounts. And more often than not, nobody is using it out of fear to say something that would upset the other maintainers.

`twitter-together` to the rescue!

This GitHub action uses files in order to send out tweets. Because of that, you can utilize GitHub’s pull request reviews to create drafts and discuss with fellow maintainers and others before sending out a tweet.

An example workflow looks like this (switch to the <kbd>`<> Edit new file`</kbd> tab when creating a new workflow and paste the code below):

```workflow
workflow "Tweet on push to master" {
  on = "push"
  resolves = ["Tweet"]
}

action "Tweet" {
  uses = "gr2m/twitter-together@master"
  secrets = ["GITHUB_TOKEN", "TWITTER_CONSUMER_KEY", "TWITTER_CONSUMER_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_SECRET"]
}

# "push" event won’t work on forks, hence the 2nd workflow with "pull_request"
workflow "Preview and validate tweets on pull requests" {
  on = "pull_request"
  resolves = ["Preview"]
}

action "Preview" {
  uses = "gr2m/twitter-together@master"
  secrets = ["GITHUB_TOKEN"]
}
```

In order to get the `TWITTER_*` credentials, you need to create a twitter app with the account you want to tweet from. You can do that at https://apps.twitter.com/. The twitter app needs read and write permissions, all other configurations are irrelevant. Once you created the app, you find the credentials in the  <kbd>`Keys and tokens`</kbd>  tab.

Besides creating the `.github/main.workflow` file you will also need to create a `tweets/` folder. I recommend to create a `tweets/README.md` file explaining how others can submit a tweet. You can copy this repository’s [`tweets/README.md`](tweets/README.md) file as a template.

## License

[MIT](LICENSE)