# Contributing

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

<!-- toc -->

- [Have a question? Found a bug? Have an idea?](#have-a-question-found-a-bug-have-an-idea)
- [Submitting the Pull Request](#submitting-the-pull-request)
- [Merging the Pull Request & releasing a new version](#merging-the-pull-request--releasing-a-new-version)
- [Resources](#resources)

<!-- tocstop -->

## Have a question? Found a bug? Have an idea?

Please [create an issue](https://github.com/twitter-together/action/issues/new/choose).

I love pull requests 😍 but before you put in too much time I’d appreciate if you created an issue first to make sure that it is an actual issue.

## Submitting the Pull Request

If you would like to contribute a bug fix or new feature (after discussing in an issue), please add tests.

Each test is a folder such as [`test/push-main-has-tweet`](https://github.com/twitter-together/action/tree/main/test/push-main-has-tweet). You can either adapt one of the existing tests or create a new folder by copying it.

Each folder has a `test.js` file which runs the test, an `event.json` file which has the payload for the event you want to simulate and any other files that simulate a certain state a repository would be in.

You can run the tests using `npm test`. You can run a single test using `npx tap test/<your folder here>`.

## Merging the Pull Request & releasing a new version

Releases are automated using [semantic-release](https://github.com/semantic-release/semantic-release).
The following commit message conventions determine which version is released:

1. `fix: ...` or `fix(scope name): ...` prefix in subject: bumps fix version, e.g. `1.2.3` → `1.2.4`
2. `feat: ...` or `feat(scope name): ...` prefix in subject: bumps feature version, e.g. `1.2.3` → `1.3.0`
3. `BREAKING CHANGE: ` in body: bumps breaking version, e.g. `1.2.3` → `2.0.0`

Only one version number is bumped at a time, the highest version change trumps the others.

If the pull request looks good but does not follow the commit conventions, use the "Squash & merge" button.

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://help.github.com)
