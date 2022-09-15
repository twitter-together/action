module.exports = parseTweetFileContent;

const EOL = require("os").EOL;

const { existsSync } = require("fs");
const { join } = require("path");
const { parseTweet } = require("twitter-text");
const { load } = require("js-yaml");

const OPTION_REGEX = /^\(\s?\)\s+/;
const FRONT_MATTER_REGEX = new RegExp(
  `^---${EOL}([\\s\\S]*?)${EOL}---(?:$|(?:${EOL})+)`
);

function parseTweetFileContent(text, dir, isThread = false) {
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
    getOptionsFromFrontMatter(frontMatterMatch[1], options, dir);

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
      options.thread = parseTweetFileContent(threadText, dir, true);
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
  validateOptions(options, text, dir);

  // Parse tweet if has text
  const parsed = text ? parseTweet(text) : { valid: true, weightedLength: 0 };
  if (!parsed.valid)
    throw new Error(
      `Tweet exceeds maximum length of 280 characters by ${
        parsed.weightedLength - 280
      } characters`
    );

  // TODO: Support schedule from options
  return {
    poll: options.poll,
    media: options.media,
    thread: options.thread,
    reply: options.reply,
    retweet: options.retweet,
    text,
    ...parsed,
  };
}

function validateOptions(options, text, dir) {
  if (options.retweet && !text && options.poll)
    throw new Error("Cannot attach a poll to a retweet");

  if (options.retweet && !text && options.reply)
    throw new Error("Cannot reply to a tweet with a retweet");

  if (options.retweet && !text && options.thread)
    throw new Error("Cannot create a thread from a retweet");

  if (options.retweet && !text && options.media && options.media.length)
    throw new Error("Cannot attach media to a retweet");

  if (options.poll && options.poll.length > 4)
    throw new Error(
      `Polls cannot have more than four options, found ${options.poll.length} options`
    );

  if (options.poll && options.poll.length < 2)
    throw new Error(
      `Polls must have at least two options, found ${options.poll.length} options`
    );

  if (options.media) {
    for (const media of options.media) {
      if (media.file.indexOf(join(dir, "media")) !== 0)
        throw new Error(`Media file should be within the media directory`);

      if (!existsSync(media.file))
        throw new Error(`Media file ${media.file} does not exist`);

      if (media.alt && media.alt.length > 1000)
        throw new Error(
          `Media alt text must be 1000 characters or less, found length ${media.alt.length}`
        );
    }
  }
}

function getOptionsFromFrontMatter(frontMatter, options, dir) {
  const parsedFrontMatter = load(frontMatter);
  if (typeof parsedFrontMatter !== "object" || !parsedFrontMatter) return;

  if (typeof parsedFrontMatter["thread-delimiter"] === "string")
    options.threadDelimiter = parsedFrontMatter["thread-delimiter"];
  if (typeof parsedFrontMatter.reply === "string")
    options.reply = parsedFrontMatter.reply;
  if (typeof parsedFrontMatter.retweet === "string")
    options.retweet = parsedFrontMatter.retweet;

  if (Array.isArray(parsedFrontMatter.media))
    options.media = parsedFrontMatter.media.reduce((arr, item) => {
      if (item && typeof item === "object" && typeof item.file === "string")
        arr.push({
          file: join(dir, "media", item.file),
          alt: typeof item.alt !== "string" ? null : item.alt,
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
