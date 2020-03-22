module.exports = parseTweetFileContent;

const EOL = require("os").EOL;

const { parseTweet } = require("twitter-text");

const OPTION_REGEX = /^\(\s?\)\s+/;

function parseTweetFileContent(text) {
  const pollOptions = [];
  let lastLine;
  while ((lastLine = getlastLineMatchingPollOption(text))) {
    pollOptions.push(lastLine.replace(OPTION_REGEX, ""));
    text = withLastLineRemoved(text);
  }

  return {
    poll: pollOptions.length ? pollOptions.reverse() : null,
    text,
    ...parseTweet(text),
  };
}

function getlastLineMatchingPollOption(text) {
  const lines = text.trim().split(EOL);
  const [lastLine] = lines.reverse();
  return OPTION_REGEX.test(lastLine) ? lastLine : null;
}

function withLastLineRemoved(text) {
  const lines = text.trim().split(EOL);
  return lines
    .slice(0, lines.length - 1)
    .join(EOL)
    .trim();
}
