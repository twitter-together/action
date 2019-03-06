FROM node:alpine

# A bunch of `LABEL` fields for GitHub to index
LABEL "com.github.actions.name"="Twitter, together!"
LABEL "com.github.actions.description"="Tweet from a repository"
LABEL "com.github.actions.icon"="cast"
LABEL "com.github.actions.color"="blue"
LABEL "repository"="http://github.com/gr2m/twitter-together-action"
LABEL "homepage"="http://github.com/gr2m/twitter-together-action"
LABEL "maintainer"="Gregor Martynus (https://github.com/gr2m)"

# install
COPY package*.json ./
RUN npm ci --only=production

# start
COPY lib tweets/README.md ./
ENTRYPOINT ["node", "/index.js"]
