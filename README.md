<p align="center">
  <a href="https://github.com/gr2m/twitter-together/issues/16"><img src="assets/logo.png" width="150" alt="twitter together logo" /></a>
</p>

<h1 align="center">Twitter, together!</h1>

<p align="center">
  <a href="https://travis-ci.com/gr2m/twitter-together" rel="nofollow"><img alt="Build Status" src="https://travis-ci.com/gr2m/twitter-together.svg?token=SMJUtZjXxPL3JRiMCqHx&branch=master"></a>
  <a href="https://github.com/gr2m/twitter-together/blob/80c8aab34382347120e22501c2e44f30a7a62174/package.json#L8" rel="nofollow"><img alt="Coverage" src="https://img.shields.io/badge/coverage-100%25-green.svg"></a>
  <a href="https://greenkeeper.io/" rel="nofollow"><img src="https://badges.greenkeeper.io/gr2m/twitter-together.svg?token=fec4ee116d4210bb3f03e13bed6266d5fc8e8764def4f269753e522abfba3a19&ts=1550824957051"></a>
<a href="#contributors"><img alt="All Contributors" src="https://img.shields.io/badge/all_contributors-1-orange.svg" /></a>
</p>

For Open Source or event maintainers that share a project twitter account, `twitter-together` is a GitHub Action that utilizes text files to publish tweets from a GitHub repository. Rather than tweeting directly, GitHub’s pull request review process encourages more collaboration, Twitter activity and editorial contributions by enabling everyone to submit tweet drafts to a project.

<p align="center">
  <img src="assets/demo.gif" alt="Screencast demonstrating twitter-together" />
</p>

<!-- toc -->

- [Try it](#try-it)
- [Setup](#setup)
- [Contribute](#contribute)
- [How it works](#how-it-works)
  * [The `push` event](#the-push-event)
  * [The `pull_request` event](#the-pull_request-event)
- [Motivation](#motivation)
- [License](#license)

<!-- tocstop -->

## Try it

You can submit a tweet to this repository to see the magic happen. Please follow the instructions at [tweets/README.md](tweets/README.md) and add your own twitter username to the tweet. This repository is setup to tweet from [https://twitter.com/commit2tweet](https://twitter.com/commit2tweet).

## Setup

1. [Create a twitter](docs/01-create-twitter-app.md) app with your shared twitter account and store the credentials as `TWITTER_API_KEY`, `TWITTER_API_SECRET_KEY`, `TWITTER_ACCESS_TOKEN` and `TWITTER_ACCESS_TOKEN_SECRET` in your repository’s secrets settings.
2. [Create a `.github/main.workflow` file](docs/02-create-main.workflow.md) or amend your existing one with the content below

   ```workflow
   workflow "Tweet on push to default branch" {
     on = "push"
     resolves = ["Tweet"]
   }
 
   action "Tweet" {
     uses = "gr2m/twitter-together@master"
     secrets = ["GITHUB_TOKEN", "TWITTER_API_KEY", "TWITTER_API_SECRET_KEY", "TWITTER_ACCESS_TOKEN",  "TWITTER_ACCESS_TOKEN_SECRET"]
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
3. After creating or updating `.github/main.workflow` in your repository’s default branch, a pull request will be created with further instructions.

Happy collaborative tweeting! Please let me know how it works!

## Contribute

All contributions welcome!

Especially if you try `twitter-together` for the first time, I’d love to hear if you run into any trouble. I greately appreciate any documentation improvements to make things more clear, I am not a native English speaker myself.

See [CONTRIBUTING.md](CONTRIBUTING.md) for more information on how to contribute. You can also [just say thanks](https://github.com/gr2m/twitter-together/issues/new?labels=feature&template=04_thanks.md) 😊

## Thanks to all contributors 💐

Thanks goes to these wonderful people ([emoji key](https://github.com/all-contributors/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
| [<img src="https://avatars1.githubusercontent.com/u/10660468?v=4" width="100px;" alt="Jason Etcovitch"/><br /><sub><b>Jason Etcovitch</b></sub>](https://jasonet.co)<br />[🎨](#design-JasonEtco "Design") [📖](https://github.com/gr2m/twitter-together/commits?author=JasonEtco "Documentation") [💻](https://github.com/gr2m/twitter-together/commits?author=JasonEtco "Code") |
| :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## How it works

`twitter-together` is using two workflows

1. `push` event to publish new tweets
2. `pull_request` event to validate and preview new tweets

### The `push` event

When triggered by the `push` event, the script looks for new `*.tweet` files in the `tweets/` folder or subfolders. If there are any, a tweet for each new tweet file is published.

If there is no `tweets/` subfolder, the scripts opens a pull request creating the folder with further instructions.

### The `pull_request` event

For the `pull_request` event, the script handles only `opened` and `synchronize` actions. It looks for new `*.tweet` files in the `tweets/` folder or subfolders. If there are any, the length of each tweet is validated. If one is too long, a failed check run with an explanation is created. If all tweets are valid, a check run with a preview of all tweets is created.

## Motivation

I think we can make Open Source more inclusive to people with more diverse interests by making it easier to contribute other things than code and documentation. I see a particularly big opportunity to be more welcoming towards editorial contributions using GitHub’s Acions, Apps and custom user interfaces backed by GitHub’s REST & GraphQL APIs.

I’ve plenty more ideas that I’d like to build out. Please ping me on twitter if you’d like to chat: [@gr2m](https://twitter.com/gr2m).

## License

[MIT](LICENSE)
