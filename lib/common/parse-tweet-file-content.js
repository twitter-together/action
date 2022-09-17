module.exports = parseTweetFileContent;

const EOL = require("os").EOL;

const { parseTweet } = require("twitter-text");
const { load } = require("js-yaml");

const OPTION_REGEX = /^\(\s?\)\s+/;
const FRONT_MATTER_REGEX = new RegExp(
  `^---${EOL}([\\s\\S]*?)${EOL}---(?:$|(?:${EOL})+)`
);

function parseTweetFileContent(text, isThread = false) {
  const options = {
    threadDelimiter: "---",
    reply: null,
    retweet: null,
    media: [],
    schedule: null,
    poll: null,
    thread: null,
  };

  // Extract front matter options
  const frontMatterMatch = text.match(FRONT_MATTER_REGEX);
  if (frontMatterMatch) {
    text = text.slice(frontMatterMatch[0].length);
    getOptionsFromFrontMatter(frontMatterMatch[1], options);

    if (isThread) {
      if (options.reply)
        throw new Error("Cannot set a tweet to reply to when in a thread");
    }
  }

  // Handle threading
  if (options.threadDelimiter) {
    const threadIdx = text.match(
      new RegExp(`(?:${EOL})+${options.threadDelimiter}(?:${EOL})+`)
    );
    if (threadIdx) {
      const threadText = text.slice(threadIdx.index + threadIdx[0].length);
      text = text.slice(0, threadIdx.index);

      // Each item can have front matter, as we only split one thread delimiter at a time
      options.thread = parseTweetFileContent(threadText, true);
    }
  }

  // Extract in-content options
  if (!options.poll) {
    const pollOptions = [];
    let lastLine;
    while ((lastLine = getlastLineMatchingPollOption(text))) {
      pollOptions.push(lastLine.replace(OPTION_REGEX, ""));
      text = withLastLineRemoved(text);
    }
    if (pollOptions.length) options.poll = pollOptions.reverse();
  }

  // Validate options
  validateOptions(options, text);

  // Parse tweet if has text
  const parsed = text ? parseTweet(text) : { valid: true, weightedLength: 0 };
  if (!parsed.valid)
    throw new Error(`Tweet exceeds maximum length of 280 characters by ${parsed.weightedLength - 280} characters`);

  // TODO: Introduce more properties from options
  return {
    poll: options.poll,
    thread: options.thread,
    reply: options.reply,
    retweet: options.retweet,
    text,
    ...parsed,
  };
}

function validateOptions(options, text) {
  if (options.retweet && !text && options.poll)
    throw new Error("Cannot attach a poll to a retweet");

  if (options.retweet && !text && options.reply)
    throw new Error("Cannot reply to a tweet with a retweet");

  if (options.retweet && !text && options.thread)
    throw new Error("Cannot create a thread from a retweet");

  if (options.poll && options.poll.length > 4)
    throw new Error(`Polls cannot have more than four options, found ${options.poll.length} options`);

  if (options.poll && options.poll.length < 2)
    throw new Error(`Polls must have at least two options, found ${options.poll.length} options`);
}

function getOptionsFromFrontMatter(frontMatter, options) {
  const parsedFrontMatter = load(frontMatter);
  if (typeof parsedFrontMatter !== "object" || !parsedFrontMatter) return;

  if (typeof parsedFrontMatter["thread-delimiter"] === "string")
    options.threadDelimiter = parsedFrontMatter["thread-delimiter"];
  if (typeof parsedFrontMatter.reply === "string")
    options.reply = parsedFrontMatter.reply;
  if (typeof parsedFrontMatter.retweet === "string")
    options.retweet = parsedFrontMatter.retweet;

  // TODO: Max 1 video or one gif can be attached, or up to 4 images
  if (Array.isArray(parsedFrontMatter.media))
    options.media = parsedFrontMatter.media.reduce((arr, item) => {
      if (item && typeof item === "object" && typeof item.url === "string")
        arr.push({
          url: item.url,
          alt: typeof item.url !== "string" ? null : item.alt,
        });
      return arr;
    }, []);

  if (typeof parsedFrontMatter.schedule === "string") {
    const schedule = new Date(parsedFrontMatter.schedule);
    if (!isNaN(schedule.getTime())) options.schedule = schedule;
  }

  if (Array.isArray(parsedFrontMatter.poll))
    options.poll = parsedFrontMatter.poll.reduce((arr, item) => {
      if (typeof item === "string") arr.push(item);
      return arr;
    }, []);
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
