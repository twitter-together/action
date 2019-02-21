FROM node:alpine

# A bunch of `LABEL` fields for GitHub to index
LABEL "com.github.actions.name"="Tweet together"
LABEL "com.github.actions.description"="Tweet together using repository files"
LABEL "com.github.actions.icon"="twitter"
LABEL "com.github.actions.color"="blue"
LABEL "repository"="http://github.com/gr2m/twitter-together-action"
LABEL "homepage"="http://github.com/gr2m/twitter-together-action"
LABEL "maintainer"="Gregor Martynus (https://github.com/gr2m)"

# install
COPY package*.json ./
RUN npm ci --only=production

# start
COPY . .
ENTRYPOINT ["node", "/index.js"]
