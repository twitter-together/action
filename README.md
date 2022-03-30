<p align="center">
  <a href="https://github.com/gr2m/twitter-together/issues/16"><img src="assets/logo.png" width="150" alt="twitter together logo" /></a>
</p>

<h1 align="center">Twitter, together!</h1>

<p align="center">
  <a href="https://action-badges.now.sh" rel="nofollow"><img alt="Build Status" src="https://github.com/gr2m/twitter-together/workflows/Test/badge.svg"></a>
  <a href="https://github.com/gr2m/twitter-together/blob/80c8aab34382347120e22501c2e44f30a7a62174/package.json#L8" rel="nofollow"><img alt="Coverage" src="https://img.shields.io/badge/coverage-100%25-green.svg"></a>
</p>

Für Open-Source- oder Event-Maintainer, die ein Projekt-Twitter-Konto gemeinsam nutzen, ist "Twitter together" eine GitHub-Aktion, die Textdateien zur Veröffentlichung von Tweets aus einem GitHub-Repository verwendet. Anstatt direkt zu twittern, fördert der Pull-Request-Review-Prozess von GitHub die Zusammenarbeit, die Twitter-Aktivität und die redaktionellen Beiträge, indem er es jedem ermöglicht, Tweet-Entwürfe für ein Projekt einzureichen.

Übersetzt mit www.DeepL.com/Translator (kostenlose Version)

<p align="center">
  <img src="assets/demo.gif" alt="Screencast demonstrating twitter-together" />
</p>

<!-- toc -->

- [Versuchen Sie es](#try-it)
- [Kompatibilität mit Twitter API](#twitter-api-compatibility)
- [Einrichtung](#setup)
- [Beitragen](#contribute)
- [Wie es funktioniert](#how-it-works)
  - [Das "Push"-Ereignis](#the-push-event)
  - [Das Ereignis `pull_request`](#the-pull_request-event)
- [Motivation](#motivation)
- [Lizenz](#license)

<!-- tocstop -->

## Versuchen Sie es

Sie können einen Tweet an dieses Repository senden, um zu sehen, wie die Magie geschieht. Bitte folgen Sie den Anweisungen unter [tweets/README.md](tweets/README.md) und erwähnen Sie Ihren eigenen Twitter-Benutzernamen in dem Tweet. Dieses Repository ist so eingerichtet, dass Tweets von [https://twitter.com/commit2tweet](https://twitter.com/commit2tweet).

## Kompatibilität mit Twitter API

Die Twitter Ads API, die wir derzeit verwenden, ist die Version "v8".

## Einrichtung

1. [Create a twitter app](docs/01-create-twitter-app.md) mit Ihrem gemeinsamen Twitter-Konto und speichern Sie die Anmeldeinformationen als `TWITTER_API_KEY`, `TWITTER_API_SECRET_KEY`, `TWITTER_ACCESS_TOKEN` und `TWITTER_ACCESS_TOKEN_SECRET` in den Geheimhaltungseinstellungen Ihres Repositorys.
2. [Create a `.github/workflows/twitter-together.yml` file](docs/02-create-twitter-together-workflow.md) mit dem unten stehenden Inhalt. Stellen Sie sicher, dass Sie `'main'` ersetzen, wenn Sie den Standardzweig Ihres Repositorys geändert haben.

   ```yml
   on: [push, pull_request]
   name: Twitter, together!
   jobs:
     preview:
       name: Preview
       runs-on: ubuntu-latest
       if: github.event_name == 'pull_request'
       steps:
         - uses: gr2m/twitter-together@v1.x
           env:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
     tweet:
       name: Tweet
       runs-on: ubuntu-latest
       if: github.event_name == 'push' && github.ref == 'refs/heads/main'
       steps:
         - name: checkout main
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

3. Nach dem Erstellen oder Aktualisieren von `.github/workflows/twitter-together.yml` im Standardzweig Ihres Repositorys wird eine Pull-Anfrage mit weiteren Anweisungen erstellt.

Viel Spaß beim kollaborativen Tweeten!

## Beitragen

Alle Beiträge sind willkommen!

Besonders wenn Sie `twitter-together` zum ersten Mal ausprobieren, würde ich gerne hören, ob Sie Probleme hatten. Ich bin sehr dankbar für jede Verbesserung der Dokumentation, um die Dinge klarer zu machen, da ich selbst kein englischer Muttersprachler bin.

Siehe [CONTRIBUTING.md](CONTRIBUTING.md) für weitere Informationen, wie man etwas beitragen kann. Sie können auch [einfach Danke sagen](https://github.com/gr2m/twitter-together/issues/new?labels=feature&template=04_thanks.md) 😊

Übersetzt mit www.DeepL.com/Translator (kostenlose Version)

## Dank an alle Mitwirkenden 💐

Thanks goes to these wonderful people ([Emoji-Taste](https://github.com/all-contributors/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://jasonet.co"><img src="https://avatars1.githubusercontent.com/u/10660468?v=4" width="100px;" alt="Jason Etcovitch"/><br /><sub><b>Jason Etcovitch</b></sub></a><br /><a href="#design-JasonEtco" title="Design">🎨</a> <a href="https://github.com/gr2m/twitter-together/commits?author=JasonEtco" title="Documentation">📖</a> <a href="https://github.com/gr2m/twitter-together/commits?author=JasonEtco" title="Code">💻</a></td><td align="center"><a href="http://erons.me"><img src="https://avatars0.githubusercontent.com/u/37238033?v=4" width="100px;" alt="Erons"/><br /><sub><b>Erons</b></sub></a><br /><a href="https://github.com/gr2m/twitter-together/commits?author=Eronmmer" title="Documentation">📖</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Wie es funktioniert

Twitter-together" verwendet zwei Arbeitsabläufe

1. Push"-Ereignis zur Veröffentlichung neuer Tweets
2. pull_request"-Ereignis zur Validierung und Vorschau neuer Tweets

### Das "push"-Ereignis

Wenn das Ereignis "push" ausgelöst wird, sucht das Skript nach hinzugefügten "*.tweet"-Dateien im Ordner "tweets/" oder in Unterordnern. Wenn es welche gibt, wird ein Tweet für jede hinzugefügte Tweet-Datei veröffentlicht.

Wenn es keinen Unterordner `tweets/` gibt, öffnet das Skript einen Pull Request, der den Ordner mit weiteren Anweisungen erstellt.

### Das Ereignis `pull_request`

Für das Ereignis `pull_request` bearbeitet das Skript nur die Aktionen `opened` und `synchronize`. Es sucht nach neuen `*.tweet`-Dateien im Ordner `tweets/` oder Unterordnern. Wenn es welche gibt, wird die Länge jedes Tweets überprüft. Wenn einer zu lang ist, wird ein fehlgeschlagener Prüflauf mit einer Erklärung erstellt. Wenn alle Tweets gültig sind, wird ein Prüflauf mit einer Vorschau aller Tweets erstellt.

## Motivation

Ich denke, wir können Open Source für Menschen mit unterschiedlichen Interessen zugänglicher machen, indem wir es einfacher machen, andere Dinge als Code und Dokumentation beizutragen. Ich sehe eine besonders große Chance, redaktionelle Beiträge willkommener zu machen, indem wir Tools entwickeln, die GitHubs Actions, Apps und benutzerdefinierte Benutzeroberflächen nutzen, die von GitHubs REST & GraphQL APIs unterstützt werden.

Ich habe noch viele weitere Ideen, die ich gerne umsetzen würde. Bitte pingen Sie mich auf Twitter an, wenn Sie sich mit mir unterhalten möchten:

Übersetzt mit www.DeepL.com/Translator (kostenlose Version) [@gr2m](https://twitter.com/gr2m).

## License

[MIT](LICENSE)
