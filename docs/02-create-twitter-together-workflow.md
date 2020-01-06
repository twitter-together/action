[back to README.md](../README.md/#setup)

# Create a `.github/main.workflow` file

In your repository, open the Actions tab.

![](workflow-01-actions-tab.png)

Press the <kbd>Setup a new workflow yourself</kbd> button to open the file editor.

![](workflow-02-editor.png)

In the filename input above the code area, replace `main.yml` with `twitter-together.yml`. Then replace the code:

```yml
on: [push, pull_request]
name: Twitter, together!
jobs:
  preview:
    name: Preview
    if: github.event_name == 'pull_request'
    steps:
      - uses: gr2m/twitter-together@v1.x
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  tweet:
    name: Tweet
    if: github.event_name == 'push' && github.ref == 'refs/heads/master'
    steps:
      - name: checkout master
        uses: actions/checkout@v2
      - name: Tweet
        uses: gr2m/twitter-together@v1.x
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TWITTER_ACCESS_TOKEN: ${{ secrets.TWITTER_ACCESS_TOKEN }}
          TWITTER_ACCESS_TOKEN_SECRET: ${{ secrets.TWITTER_ACCESS_TOKEN_SECRET }}
          TWITTER_API_KEY: ${{ secrets.TWITTER_API_KEY }}
          TWITTER_API_SECRET_KEY: ${{ secrets.TWITTER_API_SECRET_KEY }}
```

Make sure to replace `'master'` if you changed your repository's default branch.

![](workflow-04-commit.png)

To create the file, press the <kbd>Start commit</kbd> button. You can optionally set a custom commit message, then press <kbd>Commit new file</kbd>.

---

Nearly done! Shortly after creating or updating `.github/main.workflow` in your repository’s default branch, a pull request will be created with further instructions.

[back to README.md](../README.md/#setup)
