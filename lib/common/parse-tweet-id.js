module.exports = parseTweetId;

const TWEET_REGEX = /^https:\/\/twitter\.com\/[^/]+\/status\/(\d+)$/;

// TODO allow differently formatted URLs and tweet ids ?
// https://github.com/twitter-together/action/issues/221

// TODO: Should we check if the referenced tweet actually exists?

function parseTweetId(tweetRef) {
  const match = tweetRef.match(TWEET_REGEX);
  if (!match) {
    throw new Error(`Invalid tweet reference: ${tweetRef}`);
  }
  return match;
}
